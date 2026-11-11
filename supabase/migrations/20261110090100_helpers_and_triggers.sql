-- Helper functions and triggers (Phase 3).
-- All SECURITY DEFINER functions pin search_path to '' and use fully
-- qualified names, so they cannot be hijacked through a malicious schema.

-- ---------- role helpers (used by RLS policies) ----------
create function private.has_any_role(roles public.user_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role = any(roles) from public.profiles p where p.id = (select auth.uid())), false)
$$;

create function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role <> 'member' from public.profiles p where p.id = (select auth.uid())), false)
$$;

-- Super Admin, Chairperson, Vice Chairperson, Secretary
create function private.is_leadership()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_any_role(array['super_admin','chairperson','vice_chairperson','secretary']::public.user_role[])
$$;

-- Leadership + Membership Coordinator: may read member and application data
create function private.is_member_reader()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_any_role(array['super_admin','chairperson','vice_chairperson','secretary','membership_coordinator']::public.user_role[])
$$;

-- Super Admin, Chairperson, Membership Coordinator: may approve or reject
create function private.is_member_approver()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_any_role(array['super_admin','chairperson','membership_coordinator']::public.user_role[])
$$;

create function private.is_approved_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.profile_id = (select auth.uid())
      and m.status = 'approved'
      and (m.expires_at is null or m.expires_at >= current_date)
  )
$$;

create function private.can_register_for_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.status = 'published'
      and e.registration_required
      and (e.registration_deadline is null or e.registration_deadline >= now())
      and coalesce(e.ends_at, e.starts_at) > now()
      and (e.visibility = 'public' or private.is_approved_member())
  )
$$;

-- ---------- generic triggers ----------
create function private.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- Stamps the creator column with the signed-in user (client values are ignored).
create function private.stamp_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null then
    new := jsonb_populate_record(new, jsonb_build_object(tg_argv[0], (select auth.uid())));
  end if;
  return new;
end $$;

create function private.set_published_at() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new)->>'status') = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- ---------- sign-up: create the profile ----------
-- Only whitelisted metadata keys are read; `role` can never come from the client.
-- Registration is refused unless the privacy-notice consent flag is present.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  yr smallint;
begin
  if (meta->>'consent') is distinct from 'true' then
    raise exception 'consent_required';
  end if;
  if (meta->>'year_of_study') ~ '^[1-8]$' then
    yr := (meta->>'year_of_study')::smallint;
  end if;
  insert into public.profiles (id, full_name, email, programme, year_of_study, consent_given_at, privacy_notice_version)
  values (new.id, btrim(coalesce(meta->>'full_name', '')), new.email, nullif(btrim(coalesce(meta->>'programme', '')), ''), yr, now(), nullif(meta->>'privacy_notice_version', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.sync_profile_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function private.sync_profile_email();

-- ---------- profiles ----------
create function private.guard_profile_update() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Defence in depth: column privileges already block users from writing `role`.
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.has_any_role(array['super_admin']::public.user_role[]) then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function private.guard_profile_update();
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();

-- ---------- memberships ----------
create function private.memberships_before_write() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.membership_number := null; new.reviewed_by := null; new.reviewed_at := null;
    new.rejection_reason := null; new.expires_at := null; new.applied_at := now();
    return new;
  end if;
  if new.profile_id is distinct from old.profile_id
     or new.academic_year is distinct from old.academic_year
     or new.applied_at is distinct from old.applied_at then
    raise exception 'immutable_field';
  end if;
  if new.status is distinct from old.status then
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
    if new.status = 'approved' and new.membership_number is null then
      new.membership_number := 'MKUESA-' || lpad(nextval('public.membership_number_seq')::text, 5, '0');
    end if;
  end if;
  return new;
end $$;
create trigger memberships_write before insert or update on public.memberships for each row execute function private.memberships_before_write();
create trigger memberships_updated_at before update on public.memberships for each row execute function private.set_updated_at();

-- ---------- event registrations ----------
-- The server decides the status: registered, or waitlisted when full.
-- The event row is locked so two people cannot take the last seat together.
create function private.event_registrations_before_write() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cap integer;
  taken integer;
begin
  if tg_op = 'INSERT' then
    select e.capacity into cap from public.events e where e.id = new.event_id for update;
    select count(*) into taken from public.event_registrations r
      where r.event_id = new.event_id and r.status in ('registered','attended');
    new.status := case when cap is null or taken < cap then 'registered' else 'waitlisted' end;
    new.registered_at := now();
    new.attended_at := null;
    return new;
  end if;
  if new.event_id is distinct from old.event_id
     or new.profile_id is distinct from old.profile_id
     or new.registered_at is distinct from old.registered_at then
    raise exception 'immutable_field';
  end if;
  if new.status = 'attended' and old.status is distinct from 'attended' then
    new.attended_at := now();
  end if;
  return new;
end $$;
create trigger event_registrations_write before insert or update on public.event_registrations for each row execute function private.event_registrations_before_write();

-- ---------- stamps and timestamps on content tables ----------
create trigger announcements_stamp before insert on public.announcements for each row execute function private.stamp_user('created_by');
create trigger events_stamp before insert on public.events for each row execute function private.stamp_user('created_by');
create trigger opportunities_stamp before insert on public.opportunities for each row execute function private.stamp_user('created_by');
create trigger resources_stamp before insert on public.resources for each row execute function private.stamp_user('uploaded_by');
create trigger certificates_stamp before insert on public.certificates for each row execute function private.stamp_user('issued_by');

create trigger announcements_published before insert or update on public.announcements for each row execute function private.set_published_at();
create trigger research_published before insert or update on public.research_publications for each row execute function private.set_published_at();

create trigger announcements_updated_at before update on public.announcements for each row execute function private.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function private.set_updated_at();
create trigger resources_updated_at before update on public.resources for each row execute function private.set_updated_at();
create trigger research_updated_at before update on public.research_publications for each row execute function private.set_updated_at();
create trigger opportunities_updated_at before update on public.opportunities for each row execute function private.set_updated_at();
create trigger executive_positions_updated_at before update on public.executive_positions for each row execute function private.set_updated_at();

-- ---------- audit logging ----------
-- Runs as the table owner, so clients can neither skip nor forge entries.
create function private.audit_row() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  o jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  n jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce(n->>'id', o->>'id')::uuid,
    jsonb_strip_nulls(jsonb_build_object('status_old', o->>'status', 'status_new', n->>'status'))
  );
  return coalesce(new, old);
end $$;

create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function private.audit_row();
create trigger audit_announcements after insert or update or delete on public.announcements for each row execute function private.audit_row();
create trigger audit_events after insert or update or delete on public.events for each row execute function private.audit_row();
create trigger audit_resources after insert or update or delete on public.resources for each row execute function private.audit_row();
create trigger audit_research after insert or update or delete on public.research_publications for each row execute function private.audit_row();
create trigger audit_opportunities after insert or update or delete on public.opportunities for each row execute function private.audit_row();
create trigger audit_certificates after insert or update or delete on public.certificates for each row execute function private.audit_row();
create trigger audit_executive_positions after insert or update or delete on public.executive_positions for each row execute function private.audit_row();

create function private.audit_role_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), 'profiles.role_changed', 'profiles', new.id,
          jsonb_build_object('role_old', old.role, 'role_new', new.role));
  return new;
end $$;
create trigger audit_profile_role after update of role on public.profiles
  for each row when (old.role is distinct from new.role) execute function private.audit_role_change();

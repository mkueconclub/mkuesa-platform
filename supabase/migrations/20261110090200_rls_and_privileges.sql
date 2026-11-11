-- Row Level Security and privileges (Phase 3).
-- Two layers: (1) table/column privileges say WHICH columns a role may touch,
-- (2) RLS policies say WHICH rows. Everything is denied unless allowed here.

-- ---------- privileges: start from nothing ----------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.has_any_role(public.user_role[]), private.is_staff(), private.is_leadership(),
  private.is_member_reader(), private.is_member_approver(), private.is_approved_member(),
  private.can_register_for_event(uuid)
to authenticated;

-- anonymous visitors: public content only
grant select on public.announcements, public.events, public.resources,
  public.research_publications, public.opportunities to anon;
grant select (id, display_name, position_title, bio, photo_path, term_label, display_order, is_current)
  on public.executive_positions to anon;

-- signed-in users
grant select on public.profiles, public.memberships, public.announcements, public.events,
  public.resources, public.research_publications, public.opportunities, public.certificates,
  public.event_registrations, public.executive_positions, public.contact_messages, public.audit_logs
  to authenticated;
grant update (full_name, phone, registration_number, programme, year_of_study, avatar_path) on public.profiles to authenticated;
grant insert (profile_id, academic_year, motivation) on public.memberships to authenticated;
grant update (status, rejection_reason, expires_at) on public.memberships to authenticated;
grant delete on public.memberships to authenticated;
grant insert, update, delete on public.announcements, public.events, public.resources,
  public.research_publications, public.opportunities, public.executive_positions to authenticated;
grant insert (event_id, profile_id) on public.event_registrations to authenticated;
grant update (status) on public.event_registrations to authenticated;
grant delete on public.event_registrations to authenticated;
grant insert (profile_id, event_id, title, certificate_type) on public.certificates to authenticated;
grant update (revoked_at, revoked_reason) on public.certificates to authenticated;
grant delete on public.certificates to authenticated;
grant update (status) on public.contact_messages to authenticated;
grant delete on public.contact_messages to authenticated;

-- ---------- enable RLS everywhere ----------
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.executive_positions enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.resources enable row level security;
alter table public.research_publications enable row level security;
alter table public.opportunities enable row level security;
alter table public.certificates enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- ---------- profiles ----------
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_staff on public.profiles for select to authenticated using (private.is_member_reader());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- memberships ----------
create policy memberships_select_own on public.memberships for select to authenticated using (profile_id = (select auth.uid()));
create policy memberships_select_staff on public.memberships for select to authenticated using (private.is_member_reader());
create policy memberships_insert_own on public.memberships for insert to authenticated with check (profile_id = (select auth.uid()));
create policy memberships_update_approver on public.memberships for update to authenticated
  using (private.is_member_approver()) with check (private.is_member_approver());
create policy memberships_delete_admin on public.memberships for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.user_role[]));

-- ---------- executive_positions ----------
create policy exec_select_public on public.executive_positions for select to anon, authenticated using (public_consent and is_current);
create policy exec_select_staff on public.executive_positions for select to authenticated using (private.is_staff());
create policy exec_insert on public.executive_positions for insert to authenticated
  with check (private.has_any_role(array['super_admin','chairperson','secretary']::public.user_role[]));
create policy exec_update on public.executive_positions for update to authenticated
  using (private.has_any_role(array['super_admin','chairperson','secretary']::public.user_role[]))
  with check (private.has_any_role(array['super_admin','chairperson','secretary']::public.user_role[]));
create policy exec_delete on public.executive_positions for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.user_role[]));

-- ---------- published content: read policies ----------
create policy announcements_select_public on public.announcements for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and published_at <= now());
create policy announcements_select_members on public.announcements for select to authenticated
  using (status = 'published' and visibility = 'members' and published_at <= now() and private.is_approved_member());
create policy announcements_select_staff on public.announcements for select to authenticated using (private.is_staff());

create policy events_select_public on public.events for select to anon, authenticated using (status = 'published' and visibility = 'public');
create policy events_select_members on public.events for select to authenticated using (status = 'published' and visibility = 'members' and private.is_approved_member());
create policy events_select_staff on public.events for select to authenticated using (private.is_staff());

create policy resources_select_public on public.resources for select to anon, authenticated using (status = 'published' and visibility = 'public');
create policy resources_select_members on public.resources for select to authenticated using (status = 'published' and visibility = 'members' and private.is_approved_member());
create policy resources_select_staff on public.resources for select to authenticated using (private.is_staff());

create policy opportunities_select_public on public.opportunities for select to anon, authenticated using (status = 'published' and visibility = 'public');
create policy opportunities_select_members on public.opportunities for select to authenticated using (status = 'published' and visibility = 'members' and private.is_approved_member());
create policy opportunities_select_staff on public.opportunities for select to authenticated using (private.is_staff());

create policy research_select_public on public.research_publications for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy research_select_author on public.research_publications for select to authenticated using (author_id = (select auth.uid()));
create policy research_select_staff on public.research_publications for select to authenticated using (private.is_staff());

-- ---------- published content: write policies (per the permission matrix) ----------
do $$
declare
  cfg jsonb := '{
    "announcements":        {"full": ["super_admin","chairperson","vice_chairperson","secretary"], "cru": [], "draft": ["content_editor"]},
    "events":               {"full": ["super_admin","chairperson","vice_chairperson","secretary"], "cru": ["content_editor"], "draft": []},
    "resources":            {"full": ["super_admin","chairperson","content_editor"], "cru": ["vice_chairperson","secretary"], "draft": []},
    "research_publications":{"full": ["super_admin","chairperson","content_editor"], "cru": ["vice_chairperson","secretary"], "draft": []},
    "opportunities":        {"full": ["super_admin","chairperson","content_editor"], "cru": ["vice_chairperson","secretary"], "draft": []}
  }';
  t text; c jsonb; full_r text; cru_r text; draft_r text;
begin
  for t, c in select key, value from jsonb_each(cfg) loop
    select array_agg(x)::text into full_r  from jsonb_array_elements_text(c->'full') x;
    select array_agg(x)::text into cru_r   from jsonb_array_elements_text(c->'cru') x;
    select array_agg(x)::text into draft_r from jsonb_array_elements_text(c->'draft') x;
    execute format('create policy %I on public.%I for insert to authenticated with check (private.has_any_role(%L::public.user_role[]))', t||'_full_insert', t, full_r);
    execute format('create policy %I on public.%I for update to authenticated using (private.has_any_role(%L::public.user_role[])) with check (private.has_any_role(%L::public.user_role[]))', t||'_full_update', t, full_r, full_r);
    execute format('create policy %I on public.%I for delete to authenticated using (private.has_any_role(%L::public.user_role[]))', t||'_full_delete', t, full_r);
    if cru_r is not null then
      execute format('create policy %I on public.%I for insert to authenticated with check (private.has_any_role(%L::public.user_role[]))', t||'_cru_insert', t, cru_r);
      execute format('create policy %I on public.%I for update to authenticated using (private.has_any_role(%L::public.user_role[])) with check (private.has_any_role(%L::public.user_role[]))', t||'_cru_update', t, cru_r, cru_r);
    end if;
    if draft_r is not null then
      -- may create and edit drafts, but can never publish or edit published items
      execute format('create policy %I on public.%I for insert to authenticated with check (status::text = ''draft'' and private.has_any_role(%L::public.user_role[]))', t||'_draft_insert', t, draft_r);
      execute format('create policy %I on public.%I for update to authenticated using (status::text = ''draft'' and private.has_any_role(%L::public.user_role[])) with check (status::text = ''draft'' and private.has_any_role(%L::public.user_role[]))', t||'_draft_update', t, draft_r, draft_r);
    end if;
  end loop;
end $$;

-- ---------- event_registrations ----------
create policy registrations_select_own on public.event_registrations for select to authenticated using (profile_id = (select auth.uid()));
create policy registrations_select_leadership on public.event_registrations for select to authenticated using (private.is_leadership());
create policy registrations_insert_own on public.event_registrations for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.can_register_for_event(event_id));
create policy registrations_cancel_own on public.event_registrations for update to authenticated
  using (profile_id = (select auth.uid()) and status in ('registered','waitlisted'))
  with check (profile_id = (select auth.uid()) and status = 'cancelled');
create policy registrations_update_leadership on public.event_registrations for update to authenticated
  using (private.is_leadership()) with check (private.is_leadership());
create policy registrations_delete_own_cancelled on public.event_registrations for delete to authenticated
  using (profile_id = (select auth.uid()) and status = 'cancelled');
create policy registrations_delete_admin on public.event_registrations for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.user_role[]));

-- ---------- certificates ----------
create policy certificates_select_own on public.certificates for select to authenticated
  using (profile_id = (select auth.uid()) and revoked_at is null);
create policy certificates_select_staff on public.certificates for select to authenticated
  using (private.has_any_role(array['super_admin','chairperson','vice_chairperson','secretary','treasurer','membership_coordinator']::public.user_role[]));
create policy certificates_insert on public.certificates for insert to authenticated with check (private.is_member_reader());
create policy certificates_revoke on public.certificates for update to authenticated
  using (private.has_any_role(array['super_admin','chairperson']::public.user_role[]))
  with check (private.has_any_role(array['super_admin','chairperson']::public.user_role[]));
create policy certificates_delete on public.certificates for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.user_role[]));

-- ---------- contact_messages (inserts only via public.submit_contact_message) ----------
create policy contact_select on public.contact_messages for select to authenticated using (private.is_leadership());
create policy contact_update on public.contact_messages for update to authenticated
  using (private.has_any_role(array['super_admin','secretary']::public.user_role[]))
  with check (private.has_any_role(array['super_admin','secretary']::public.user_role[]));
create policy contact_delete on public.contact_messages for delete to authenticated
  using (private.has_any_role(array['super_admin']::public.user_role[]));

-- ---------- audit_logs: read-only for leadership; no client writes exist ----------
create policy audit_select on public.audit_logs for select to authenticated using (private.is_leadership());

-- Executive profiles and direct messages to executives.
--
-- How it works
--   1. Chairperson / Secretary / Super Admin create the committee entry (name, position, term) as before.
--   2. ONLY the Super Administrator approves it: links the entry to the officer's account (profile_id) and sets
--      public_consent = true. Approval is what puts the officer on the public About page.
--   3. The approved officer then adds their own contact email (and may edit their bio) with
--      public.set_my_executive_contact(). Until they do, their card is shown but cannot be opened.
--   4. A visitor opens the officer's profile and writes to them. The message is stored in executive_messages for
--      THAT officer only and is read in their own inbox. Nobody else (not even other officers) can read it.

-- ---------- columns ----------
alter table public.executive_positions
  add column contact_email text check (contact_email is null or (char_length(contact_email) <= 254 and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  add column approved_at timestamptz;

-- The profile page is public, so the officer's email is readable by visitors (they were told so when they entered it).
-- Rows are still limited by the existing policy: only approved, current officers are visible to visitors.
grant select (contact_email) on public.executive_positions to anon;

-- ---------- approval and email guard ----------
-- Only the Super Administrator may approve an officer or link an entry to an account.
-- Only the officer themselves (or the Super Administrator) may set the contact email.
create function private.guard_executive_entry() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  -- No signed-in user means a trusted database session (migrations, seed, SQL editor): visitors never reach this table.
  v_super boolean := (select auth.uid()) is null or private.has_any_role(array['super_admin']::public.user_role[]);
begin
  if tg_op = 'INSERT' then
    if (new.public_consent or new.profile_id is not null or new.contact_email is not null) and not v_super then
      raise exception 'super_admin_only' using errcode = '42501';
    end if;
  else
    if (new.public_consent is distinct from old.public_consent or new.profile_id is distinct from old.profile_id
        or new.approved_at is distinct from old.approved_at) and not v_super then
      raise exception 'super_admin_only' using errcode = '42501';
    end if;
    if new.contact_email is distinct from old.contact_email
       and not (v_super or (old.profile_id is not null and old.profile_id = (select auth.uid()))) then
      raise exception 'not_your_entry' using errcode = '42501';
    end if;
  end if;
  if new.public_consent and new.approved_at is null then new.approved_at := now(); end if;
  if not new.public_consent then new.approved_at := null; end if;
  return new;
end $$;
create trigger executive_positions_guard before insert or update on public.executive_positions
  for each row execute function private.guard_executive_entry();

-- ---------- the officer adds or changes their own contact details ----------
create function public.set_my_executive_contact(p_email text, p_bio text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_bio text := nullif(btrim(coalesce(p_bio, '')), '');
  v_uid uuid := (select auth.uid());
  n integer;
begin
  if v_uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_input'; end if;
  if v_bio is not null and char_length(v_bio) > 1000 then raise exception 'invalid_input'; end if;
  update public.executive_positions
     set contact_email = v_email, bio = v_bio
   where profile_id = v_uid and public_consent and is_current;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'not_approved' using errcode = '42501'; end if;
end $$;
revoke all on function public.set_my_executive_contact(text, text) from public, anon;
grant execute on function public.set_my_executive_contact(text, text) to authenticated;

-- ---------- messages to executives ----------
create table public.executive_messages (
  id uuid primary key default gen_random_uuid(),
  executive_id uuid not null references public.executive_positions(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 2 and 100),
  sender_email text not null check (char_length(sender_email) <= 254),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  status public.contact_status not null default 'new',
  created_at timestamptz not null default now()
);
create index executive_messages_exec_idx on public.executive_messages (executive_id, created_at desc);
create index executive_messages_throttle_idx on public.executive_messages (lower(sender_email), created_at);

alter table public.executive_messages enable row level security;
grant select, delete on public.executive_messages to authenticated;
grant update (status) on public.executive_messages to authenticated;

-- Is this row one of the signed-in person's own (current) executive entries?
create function private.owns_executive(p_executive uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.executive_positions e
    where e.id = p_executive and e.profile_id = (select auth.uid()) and e.is_current
  )
$$;
revoke all on function private.owns_executive(uuid) from public, anon, authenticated;
grant execute on function private.owns_executive(uuid) to authenticated;

create policy exec_msg_select on public.executive_messages for select to authenticated using (private.owns_executive(executive_id));
create policy exec_msg_update on public.executive_messages for update to authenticated
  using (private.owns_executive(executive_id)) with check (private.owns_executive(executive_id));
create policy exec_msg_delete on public.executive_messages for delete to authenticated using (private.owns_executive(executive_id));

-- Visitors write through this function only. Limits: 3 messages per sender address per hour, 5 per officer per hour,
-- 60 overall per hour. The officer must be approved, current, and must have added their email.
create function public.submit_executive_message(p_executive uuid, p_name text, p_email text, p_subject text, p_message text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 100
     or char_length(btrim(coalesce(p_subject, ''))) not between 3 and 150
     or char_length(btrim(coalesce(p_message, ''))) not between 10 and 2000
     or char_length(v_email) > 254
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_input';
  end if;
  if not exists (
    select 1 from public.executive_positions e
    where e.id = p_executive and e.public_consent and e.is_current and e.profile_id is not null and e.contact_email is not null
  ) then
    raise exception 'not_available';
  end if;
  if (select count(*) from public.executive_messages where lower(sender_email) = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.executive_messages where executive_id = p_executive and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.executive_messages where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited';
  end if;
  insert into public.executive_messages (executive_id, sender_name, sender_email, subject, message)
  values (p_executive, btrim(p_name), v_email, btrim(p_subject), btrim(p_message));
end $$;
revoke all on function public.submit_executive_message(uuid, text, text, text, text) from public;
grant execute on function public.submit_executive_message(uuid, text, text, text, text) to anon, authenticated;

-- Retention: messages to executives older than 12 months. Schedule with the other purge jobs (pg_cron).
create function private.purge_old_executive_messages() returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.executive_messages where created_at < now() - interval '12 months';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.purge_old_executive_messages() from public, anon, authenticated;

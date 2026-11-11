-- Public RPC functions (Phase 3): the only ways to do things RLS cannot express.

-- Role changes: Super Admin only, never on yourself (prevents lock-out).
create function public.set_user_role(target uuid, new_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_any_role(array['super_admin']::public.user_role[]) then
    raise exception 'forbidden';
  end if;
  if target = (select auth.uid()) then
    raise exception 'cannot_change_own_role';
  end if;
  update public.profiles set role = new_role where id = target;
  if not found then raise exception 'not_found'; end if;
end $$;
revoke all on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- Contact form: callable by anyone, throttled in the database.
-- Limits: 3 messages per email address per hour, 30 per hour overall.
create function public.submit_contact_message(p_name text, p_email text, p_subject text, p_message text)
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
  if (select count(*) from public.contact_messages where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into public.contact_messages (name, email, subject, message)
  values (btrim(p_name), v_email, btrim(p_subject), btrim(p_message));
end $$;
revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

-- Retention: contact messages older than 12 months. Schedule in Phase 8 (pg_cron).
create function private.purge_old_contact_messages() returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.contact_messages where created_at < now() - interval '12 months';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.purge_old_contact_messages() from public, anon, authenticated;

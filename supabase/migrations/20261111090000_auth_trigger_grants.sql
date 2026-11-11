-- Precaution for sign-up ("Database error saving new user").
-- Migration 3 revoked everything on schema `private` from PUBLIC. The triggers on auth.users
-- are fired by Supabase's auth service role (supabase_auth_admin), so make sure that role can
-- reach the two trigger functions. Safe to run more than once; skipped where the role does not exist.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.handle_new_user() to supabase_auth_admin;
    grant execute on function private.sync_profile_email() to supabase_auth_admin;
  end if;
end $$;

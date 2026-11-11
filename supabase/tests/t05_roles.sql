do $$ begin
  perform test.as_user(test.u('mb'));
  perform test.throws($q$select public.set_user_role('00000000-0000-0000-0000-000000000009', 'super_admin')$q$, 'forbidden', 'member cannot grant themselves Super Admin');
  perform test.as_user(test.u('chair'));
  perform test.throws($q$select public.set_user_role('00000000-0000-0000-0000-000000000009', 'secretary')$q$, 'forbidden', 'chairperson cannot assign roles');
  perform test.as_anon();
  perform test.throws($q$select public.set_user_role('00000000-0000-0000-0000-000000000009', 'secretary')$q$, 'permission denied', 'anonymous visitors cannot call set_user_role');

  perform test.as_user(test.u('super'));
  perform test.throws($q$select public.set_user_role('00000000-0000-0000-0000-000000000001', 'member')$q$, 'cannot_change_own_role', 'Super Admin cannot demote themselves');
  perform test.throws($q$select public.set_user_role(gen_random_uuid(), 'member')$q$, 'not_found', 'unknown user is reported');
  perform test.throws($q$update public.profiles set role = 'member' where id = '00000000-0000-0000-0000-000000000009'$q$, 'permission denied', 'even Super Admin must use set_user_role, not a direct update');
  perform public.set_user_role(test.u('mb'), 'content_editor');
  perform test.as_admin();
  perform test.ok((select role from public.profiles where id = test.u('mb')) = 'content_editor', 'Super Admin can assign a role');
  perform test.ok(exists (select 1 from public.audit_logs where action = 'profiles.role_changed' and actor_id = test.u('super')
      and metadata->>'role_new' = 'content_editor'), 'role change is audit-logged with the actor');

  -- defence in depth: a JWT-bearing non-admin session is stopped by the trigger even with table privileges
  perform set_config('request.jwt.claim.sub', test.u('ma')::text, true);
  perform test.throws($q$update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000008'$q$, 'role_change_forbidden', 'trigger blocks role escalation by a non-admin identity');
  perform test.as_admin();
  update public.profiles set role = 'member' where id = test.u('mb');
  perform test.ok((select role from public.profiles where id = test.u('mb')) = 'member', 'bootstrap path (SQL editor, no JWT) can still set roles');
end $$;

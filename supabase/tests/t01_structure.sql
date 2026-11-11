do $$ begin
  perform test.eq((select count(*) from pg_tables where schemaname = 'public'), 12, 'exactly 12 public tables');
  perform test.eq((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0, 'RLS enabled on every public table');
  perform test.eq((select count(*) from pg_tables t where schemaname = 'public'
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename)), 0, 'every public table has at least one policy');
  perform test.eq((select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee = 'anon'
     and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')), 0, 'anon has no write privileges on any table');
  perform test.eq((select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee = 'authenticated'
     and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES')), 0, 'authenticated has no truncate/trigger/references');
  perform test.eq((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public','private') and p.prosecdef
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')), 0, 'every SECURITY DEFINER function pins search_path');
  -- internal helpers: only the seven policy helpers may be executable by signed-in users, and none by anon
  perform test.eq((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and has_function_privilege('anon', p.oid, 'execute')), 0, 'anon can execute no internal function');
  perform test.eq((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and has_function_privilege('authenticated', p.oid, 'execute')
       and p.proname not in ('has_any_role','is_staff','is_leadership','is_member_reader','is_member_approver','is_approved_member','can_register_for_event')), 0, 'signed-in users can execute only the policy helpers');
  perform test.ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon cannot read profiles at all');
  perform test.ok(not has_table_privilege('anon', 'public.audit_logs', 'select'), 'anon cannot read audit logs');
  perform test.ok(not has_table_privilege('authenticated', 'public.audit_logs', 'insert'), 'authenticated cannot write audit logs');
end $$;

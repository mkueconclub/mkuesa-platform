do $$ begin
  perform test.as_user(test.u('memco'));
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-00000000000a'$q$), 1, 'setup: approve application');
  perform test.as_user(test.u('chair'));
  perform test.eq(test.rows($q$insert into public.announcements (title, slug, body) values ('Audit me', 'audit-me', 'b')$q$), 1, 'setup: create announcement');
  perform test.as_admin();
  perform test.ok(exists (select 1 from public.audit_logs where action = 'memberships.update' and actor_id = test.u('memco') and metadata->>'status_new' = 'approved'), 'approval is audit-logged with actor and new status');
  perform test.ok(exists (select 1 from public.audit_logs where action = 'announcements.insert' and actor_id = test.u('chair')), 'content creation is audit-logged');

  perform test.as_user(test.u('chair'));
  perform test.throws($q$insert into public.audit_logs (action, entity_type) values ('fake', 'fake')$q$, 'permission denied', 'nobody can forge audit entries');
  perform test.throws($q$update public.audit_logs set action = 'edited'$q$, 'permission denied', 'nobody can edit audit entries');
  perform test.throws($q$delete from public.audit_logs$q$, 'permission denied', 'nobody can delete audit entries');
  perform test.ok(test.count('select * from public.audit_logs') >= 2, 'chairperson can read the audit log');
  perform test.as_user(test.u('vice'));
  perform test.ok(test.count('select * from public.audit_logs') >= 2, 'vice chairperson can read the audit log');
  perform test.as_user(test.u('sec'));
  perform test.ok(test.count('select * from public.audit_logs') >= 2, 'secretary can read the audit log');
  perform test.as_user(test.u('treas'));
  perform test.eq(test.count('select * from public.audit_logs'), 0, 'treasurer cannot read the audit log');
  perform test.as_user(test.u('memco'));
  perform test.eq(test.count('select * from public.audit_logs'), 0, 'membership coordinator cannot read the audit log');
  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.audit_logs'), 0, 'members cannot read the audit log');

  perform test.throws($q$select private.audit_role_change()$q$, 'permission denied', 'members cannot call internal functions');
  perform test.throws($q$select private.purge_old_contact_messages()$q$, 'permission denied', 'members cannot purge messages');
  perform test.as_anon();
  perform test.throws($q$select private.handle_new_user()$q$, 'permission denied', 'visitors cannot call internal functions');
end $$;

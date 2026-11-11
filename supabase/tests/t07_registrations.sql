do $$ begin
  perform test.as_user(test.u('ma'));
  perform test.eq(test.rows($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008')$q$), 1, 'member can register for a public event');
  perform test.ok((select status from public.event_registrations where profile_id = test.u('ma')) = 'registered', 'first registration is confirmed');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008')$q$, 'duplicate key', 'cannot register twice');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id, status) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'attended')$q$, 'permission denied', 'client cannot choose its own registration status');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009')$q$, 'row-level security', 'cannot register someone else');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'cannot register for a draft event');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'cannot register for an event without registration');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'cannot register for a past event');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'cannot register after the deadline');
  perform test.eq(test.rows($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008')$q$), 1, 'approved member can register for a members-only event');

  perform test.as_user(test.u('mb'));
  perform test.eq(test.rows($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009')$q$), 1, 'second person can register');
  perform test.ok((select status from public.event_registrations where profile_id = test.u('mb')) = 'waitlisted', 'full event (capacity 1) waitlists the next person');
  perform test.throws($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000009')$q$, 'row-level security', 'unapproved member cannot register for a members-only event');
  perform test.eq(test.count('select * from public.event_registrations'), 1, 'members only see their own registrations');

  perform test.throws($q$update public.event_registrations set status = 'attended' where profile_id = '00000000-0000-0000-0000-000000000009'$q$, 'row-level security', 'member cannot mark themselves as attended');
  perform test.eq(test.rows($q$update public.event_registrations set status = 'cancelled' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'member can cancel their own registration');
  perform test.eq(test.rows($q$update public.event_registrations set status = 'cancelled' where profile_id = '00000000-0000-0000-0000-000000000008'$q$), 0, 'member cannot cancel someone else''s registration');
  perform test.eq(test.rows($q$delete from public.event_registrations where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'member can remove their own cancelled registration');

  perform test.as_user(test.u('ma'));
  perform test.eq(test.rows($q$delete from public.event_registrations where profile_id = '00000000-0000-0000-0000-000000000008' and event_id = '10000000-0000-0000-0000-000000000001'$q$), 0, 'an active registration cannot simply be deleted');

  perform test.as_user(test.u('treas'));
  perform test.eq(test.count('select * from public.event_registrations'), 0, 'treasurer cannot see registrations');
  perform test.as_user(test.u('sec'));
  perform test.ok(test.count('select * from public.event_registrations') >= 2, 'secretary can see registrations');
  perform test.eq(test.rows($q$update public.event_registrations set status = 'attended' where profile_id = '00000000-0000-0000-0000-000000000008' and event_id = '10000000-0000-0000-0000-000000000001'$q$), 1, 'secretary can mark attendance');
  perform test.ok((select attended_at from public.event_registrations where profile_id = test.u('ma') and event_id = test.ev('pub')) is not null, 'attendance time is stamped');
  perform test.as_anon();
  perform test.throws('select * from public.event_registrations', 'permission denied', 'anonymous visitors cannot read registrations');
end $$;

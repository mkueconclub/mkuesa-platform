do $$ begin
  perform test.as_user(test.u('mb'));
  perform test.eq(test.rows($q$insert into public.memberships (profile_id, academic_year, motivation) values ('00000000-0000-0000-0000-000000000009', '2026/2027', 'I want to join')$q$), 1, 'member can apply for themselves');
  perform test.ok((select status from public.memberships where profile_id = test.u('mb')) = 'pending', 'application starts as pending');
  perform test.throws($q$insert into public.memberships (profile_id, academic_year, status) values ('00000000-0000-0000-0000-000000000009', '2025/2026', 'approved')$q$, 'permission denied', 'member cannot choose their own status');
  perform test.throws($q$insert into public.memberships (profile_id, academic_year) values ('00000000-0000-0000-0000-000000000008', '2027/2028')$q$, 'row-level security', 'member cannot apply on behalf of someone else');
  perform test.throws($q$insert into public.memberships (profile_id, academic_year) values ('00000000-0000-0000-0000-000000000009', '2026/2027')$q$, 'duplicate key', 'one application per academic year');
  perform test.throws($q$insert into public.memberships (profile_id, academic_year) values ('00000000-0000-0000-0000-000000000009', '2026/2028')$q$, 'check', 'malformed academic year is refused');
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 0, 'member cannot approve their own application');
  perform test.ok(not private.is_approved_member(), 'pending applicant is not an approved member');

  perform test.as_user(test.u('editor'));
  perform test.eq(test.count('select * from public.memberships'), 0, 'content editor sees no applications');
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 0, 'content editor cannot approve');
  perform test.as_user(test.u('treas'));
  perform test.eq(test.count('select * from public.memberships'), 0, 'treasurer sees no individual applications');
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 0, 'treasurer cannot approve');
  perform test.as_user(test.u('vice'));
  perform test.ok(test.count('select * from public.memberships') >= 3, 'vice chairperson can read applications');
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 0, 'vice chairperson cannot approve');

  perform test.as_user(test.u('memco'));
  perform test.throws($q$update public.memberships set academic_year = '2030/2031' where profile_id = '00000000-0000-0000-0000-000000000009'$q$, 'permission denied', 'approver cannot rewrite the academic year');
  perform test.eq(test.rows($q$update public.memberships set status = 'approved' where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'membership coordinator can approve');
  perform test.ok((select membership_number from public.memberships where profile_id = test.u('mb')) like 'MKUESA-%', 'membership number assigned on approval');
  perform test.ok((select reviewed_by from public.memberships where profile_id = test.u('mb')) = test.u('memco'), 'reviewer is stamped by the server, not the client');
  perform test.ok((select reviewed_at from public.memberships where profile_id = test.u('mb')) is not null, 'review time recorded');

  perform test.as_user(test.u('mb'));
  perform test.ok(private.is_approved_member(), 'applicant becomes an approved member after approval');
  perform test.as_user(test.u('memco'));
  perform test.eq(test.rows($q$update public.memberships set expires_at = current_date - 1 where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'approver can set an expiry date');
  perform test.as_user(test.u('mb'));
  perform test.ok(not private.is_approved_member(), 'expired membership no longer counts as approved');

  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.memberships'), 1, 'a member sees only their own membership');

  perform test.as_user(test.u('memco'));
  perform test.eq(test.rows($q$delete from public.memberships where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 0, 'only Super Admin can delete a membership');
  perform test.as_user(test.u('super'));
  perform test.eq(test.rows($q$delete from public.memberships where profile_id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'Super Admin can delete a membership');

  perform test.as_anon();
  perform test.throws('select * from public.memberships', 'permission denied', 'anonymous visitors cannot read memberships');
end $$;

-- Executive profiles: Super Admin approval, officer's own contact email, and direct messages to one officer.
do $$
declare
  v_chair uuid; v_treas uuid;
begin
  -- fixtures (trusted session): two committee entries, not yet approved or linked
  perform test.as_admin();
  insert into public.executive_positions (display_name, position_title, is_current, display_order) values ('Chair Officer', 'Chairperson', true, 10) returning id into v_chair;
  insert into public.executive_positions (display_name, position_title, is_current, display_order) values ('Treasurer Officer', 'Treasurer', true, 11) returning id into v_treas;

  -- only the Super Administrator approves or links
  perform test.as_user(test.u('chair'));
  perform test.throws(format($q$update public.executive_positions set public_consent = true where id = %L$q$, v_chair), 'super_admin_only', 'chairperson cannot approve an officer');
  perform test.throws(format($q$update public.executive_positions set profile_id = %L where id = %L$q$, test.u('chair'), v_chair), 'super_admin_only', 'chairperson cannot link an account');
  perform test.throws($q$insert into public.executive_positions (display_name, position_title, public_consent) values ('Self Approved', 'Secretary', true)$q$, 'super_admin_only', 'chairperson cannot create an already-approved entry');
  perform test.eq(test.rows(format($q$update public.executive_positions set bio = 'Economics, year 3.' where id = %L$q$, v_chair)), 1, 'chairperson can still edit an entry''s ordinary details');
  perform test.throws(format($q$update public.executive_positions set contact_email = 'x@example.test' where id = %L$q$, v_chair), 'not_your_entry', 'chairperson cannot set another officer''s email');

  perform test.as_user(test.u('super'));
  perform test.eq(test.rows(format($q$update public.executive_positions set profile_id = %L, public_consent = true where id = %L$q$, test.u('chair'), v_chair)), 1, 'super admin approves and links the chairperson');
  perform test.ok((select approved_at is not null from public.executive_positions where id = v_chair), 'approval time is recorded');

  -- the officer adds their own email
  perform test.as_user(test.u('treas'));
  perform test.throws($q$select public.set_my_executive_contact('treas@example.test', 'bio')$q$, 'not_approved', 'an officer with no approved entry cannot add an email');
  perform test.as_user(test.u('chair'));
  perform test.throws($q$select public.set_my_executive_contact('not-an-email', 'bio')$q$, 'invalid_input', 'a bad email is refused');
  perform test.throws($q$select public.set_my_executive_contact('chair@example.test', repeat('x', 1001))$q$, 'invalid_input', 'an oversized bio is refused');
  perform public.set_my_executive_contact('Chair@Example.test', 'Leads the association.');
  perform test.ok((select contact_email = 'chair@example.test' and bio = 'Leads the association.' from public.executive_positions where id = v_chair), 'chairperson saved their own email (lower-cased) and bio');
  perform test.throws(format($q$update public.executive_positions set public_consent = false where id = %L$q$, v_chair), 'super_admin_only', 'an officer cannot withdraw or change approval themselves');

  -- visitors: see approved officers, including the email, but never the linked account
  perform test.as_anon();
  perform test.eq(test.count('select id, contact_email from public.executive_positions where contact_email is not null'), 1, 'visitors can read the approved officer''s email');
  perform test.eq(test.count($q$select id from public.executive_positions where position_title = 'Treasurer'$q$), 0, 'an unapproved officer is invisible to visitors');
  perform test.throws('select profile_id from public.executive_positions', 'permission denied', 'visitors still cannot read the linked account');
  perform test.throws($q$update public.executive_positions set contact_email = 'evil@example.test'$q$, 'permission denied', 'visitors cannot change anything');

  -- visitor messages the chairperson
  perform test.eq(test.rows(format($q$select public.submit_executive_message(%L, 'Visitor', 'v@example.test', 'Hello chair', 'This is a valid message body.')$q$, v_chair)), 1, 'visitor can message an approved officer with an email');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Visitor', 'v@example.test', 'Hello treasurer', 'This is a valid message body.')$q$, v_treas), 'not_available', 'cannot message an officer who is not approved');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'V', 'v@example.test', 'Hello chair', 'This is a valid message body.')$q$, v_chair), 'invalid_input', 'one-letter name is refused');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Visitor', 'nope', 'Hello chair', 'This is a valid message body.')$q$, v_chair), 'invalid_input', 'bad sender email is refused');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Visitor', 'v@example.test', 'Hello chair', 'short')$q$, v_chair), 'invalid_input', 'too-short message is refused');
  perform public.submit_executive_message(v_chair, 'Visitor', 'v@example.test', 'Second', 'This is a valid message body.');
  perform public.submit_executive_message(v_chair, 'Visitor', 'v@example.test', 'Third', 'This is a valid message body.');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Visitor', 'v@example.test', 'Fourth', 'This is a valid message body.')$q$, v_chair), 'rate_limited', 'fourth message from one address within an hour is throttled');
  perform public.submit_executive_message(v_chair, 'Other', 'o1@example.test', 'From o1', 'This is a valid message body.');
  perform public.submit_executive_message(v_chair, 'Other', 'o2@example.test', 'From o2', 'This is a valid message body.');
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Other', 'o3@example.test', 'From o3', 'This is a valid message body.')$q$, v_chair), 'rate_limited', 'one officer cannot be flooded (5 per hour)');
  perform test.throws('select * from public.executive_messages', 'permission denied', 'visitors cannot read messages');
  perform test.throws($q$insert into public.executive_messages (executive_id, sender_name, sender_email, subject, message) values (gen_random_uuid(), 'D', 'd@example.test', 'Direct', 'bypassing the function')$q$, 'permission denied', 'visitors cannot insert directly');

  -- who can read the messages: only the officer they were sent to
  perform test.as_user(test.u('chair'));
  perform test.eq(test.count('select id from public.executive_messages'), 5, 'the chairperson reads their own messages');
  perform test.as_user(test.u('super'));
  perform test.eq(test.count('select id from public.executive_messages'), 0, 'even the Super Administrator does not read an officer''s messages');
  perform test.as_user(test.u('sec'));
  perform test.eq(test.count('select id from public.executive_messages'), 0, 'other officers cannot read them');
  perform test.eq(test.rows($q$update public.executive_messages set status = 'spam'$q$), 0, 'other officers cannot change them');
  perform test.eq(test.rows($q$delete from public.executive_messages$q$), 0, 'other officers cannot delete them');
  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select id from public.executive_messages'), 0, 'members cannot read them');

  perform test.as_user(test.u('chair'));
  perform test.eq(test.rows($q$update public.executive_messages set status = 'read' where subject = 'Hello chair'$q$), 1, 'the chairperson can mark a message read');
  perform test.throws($q$update public.executive_messages set message = 'edited'$q$, 'permission denied', 'message text cannot be edited');
  perform test.eq(test.rows($q$delete from public.executive_messages where subject = 'Second'$q$), 1, 'the chairperson can delete a message');

  -- withdrawing approval hides the officer and stops messages
  perform test.as_user(test.u('super'));
  perform test.eq(test.rows(format($q$update public.executive_positions set public_consent = false where id = %L$q$, v_chair)), 1, 'super admin withdraws approval');
  perform test.ok((select approved_at is null from public.executive_positions where id = v_chair), 'approval time is cleared');
  perform test.as_anon();
  perform test.throws(format($q$select public.submit_executive_message(%L, 'Late', 'late@example.test', 'Too late', 'This is a valid message body.')$q$, v_chair), 'not_available', 'a withdrawn officer cannot be messaged');
end $$;

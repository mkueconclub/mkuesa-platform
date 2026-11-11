do $$ begin
  perform test.as_anon();
  perform test.eq(test.rows($q$select public.submit_contact_message('Visitor', 'visitor@example.test', 'Hello there', 'This is a valid message body.')$q$), 1, 'visitor can send a message');
  perform test.throws($q$select public.submit_contact_message('Visitor', 'not-an-email', 'Hello there', 'This is a valid message body.')$q$, 'invalid_input', 'bad email is refused');
  perform test.throws($q$select public.submit_contact_message('Visitor', 'v2@example.test', 'Hello there', 'short')$q$, 'invalid_input', 'too-short message is refused');
  perform test.throws($q$select public.submit_contact_message('V', 'v3@example.test', 'Hello there', 'This is a valid message body.')$q$, 'invalid_input', 'one-letter name is refused');
  perform test.throws($q$select public.submit_contact_message('Visitor', 'v4@example.test', 'Hello there', repeat('x', 2001))$q$, 'invalid_input', 'oversized message is refused');
  perform public.submit_contact_message('Visitor', 'Visitor@Example.test', 'Second one', 'This is a valid message body.');
  perform public.submit_contact_message('Visitor', 'visitor@example.test', 'Third one', 'This is a valid message body.');
  perform test.throws($q$select public.submit_contact_message('Visitor', 'visitor@example.test', 'Fourth one', 'This is a valid message body.')$q$, 'rate_limited', 'fourth message from one address within an hour is throttled');
  perform test.throws('select * from public.contact_messages', 'permission denied', 'visitors cannot read messages');
  perform test.throws($q$insert into public.contact_messages (name, email, subject, message) values ('Direct', 'd@example.test', 'Direct insert', 'bypassing the function')$q$, 'permission denied', 'visitors cannot insert directly');

  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.contact_messages'), 0, 'members cannot read messages');
  perform test.as_user(test.u('memco'));
  perform test.eq(test.count('select * from public.contact_messages'), 0, 'membership coordinator cannot read messages');
  perform test.as_user(test.u('chair'));
  perform test.eq(test.count('select * from public.contact_messages'), 3, 'chairperson can read messages');
  perform test.eq(test.rows($q$update public.contact_messages set status = 'read'$q$), 0, 'chairperson cannot change message status');
  perform test.as_user(test.u('sec'));
  perform test.eq(test.rows($q$update public.contact_messages set status = 'read'$q$), 3, 'secretary can triage messages');
  perform test.eq(test.rows($q$delete from public.contact_messages$q$), 0, 'secretary cannot delete messages');
  perform test.as_user(test.u('super'));
  perform test.eq(test.rows($q$delete from public.contact_messages$q$), 3, 'Super Admin can delete messages');

  -- site-wide ceiling
  perform test.as_admin();
  insert into public.contact_messages (name, email, subject, message)
    select 'Bulk ' || g, 'bulk' || g || '@example.test', 'Bulk subject', 'Bulk message body text' from generate_series(1, 30) g;
  perform test.as_anon();
  perform test.throws($q$select public.submit_contact_message('Visitor', 'fresh@example.test', 'Hello there', 'This is a valid message body.')$q$, 'rate_limited', 'site-wide hourly ceiling protects against floods');
end $$;

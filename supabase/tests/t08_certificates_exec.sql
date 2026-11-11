do $$ begin
  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.certificates'), 1, 'member sees only their own non-revoked certificate');
  perform test.throws($q$insert into public.certificates (profile_id, title) values ('00000000-0000-0000-0000-000000000008', 'Self issued')$q$, 'row-level security', 'member cannot issue themselves a certificate');
  perform test.as_user(test.u('mb'));
  perform test.eq(test.count('select * from public.certificates'), 0, 'other members see none of it');
  perform test.as_user(test.u('editor'));
  perform test.throws($q$insert into public.certificates (profile_id, title) values ('00000000-0000-0000-0000-000000000009', 'Editor cert')$q$, 'row-level security', 'content editor cannot issue certificates');

  perform test.as_user(test.u('memco'));
  perform test.eq(test.rows($q$insert into public.certificates (profile_id, title) values ('00000000-0000-0000-0000-000000000009', 'Participation')$q$), 1, 'membership coordinator can issue a certificate');
  perform test.ok((select issued_by from public.certificates where title = 'Participation') = test.u('memco'), 'issuer is stamped by the server');
  perform test.ok((select length(verification_code) from public.certificates where title = 'Participation') = 32, 'verification code is 32 random characters');
  perform test.eq(test.rows($q$update public.certificates set revoked_at = now() where title = 'Participation'$q$), 0, 'membership coordinator cannot revoke');
  perform test.as_user(test.u('chair'));
  perform test.eq(test.rows($q$update public.certificates set revoked_at = now(), revoked_reason = 'test' where title = 'Participation'$q$), 1, 'chairperson can revoke');
  perform test.throws($q$update public.certificates set verification_code = 'forged' where title = 'Participation'$q$, 'permission denied', 'verification code cannot be rewritten');
  perform test.as_user(test.u('mb'));
  perform test.eq(test.count('select * from public.certificates'), 0, 'revoked certificate disappears for its holder');
  perform test.as_anon();
  perform test.throws('select * from public.certificates', 'permission denied', 'anonymous visitors cannot read certificates');

  -- executive positions
  perform test.eq(test.count('select id, display_name, position_title from public.executive_positions'), 1, 'public sees only consenting, current officers');
  perform test.throws('select * from public.executive_positions', 'permission denied', 'public must name columns (select * is refused)');
  perform test.throws('select profile_id from public.executive_positions', 'permission denied', 'public cannot read the linked profile id');
  perform test.as_user(test.u('sec'));
  perform test.ok(test.count('select * from public.executive_positions') >= 2, 'secretary sees non-public entries too');
  perform test.eq(test.rows($q$insert into public.executive_positions (display_name, position_title) values ('New Officer', 'Treasurer')$q$), 1, 'secretary can add an officer');
  perform test.as_user(test.u('vice'));
  perform test.throws($q$insert into public.executive_positions (display_name, position_title) values ('Other Officer', 'Treasurer')$q$, 'row-level security', 'vice chairperson cannot edit officers');
  perform test.as_user(test.u('ma'));
  perform test.throws($q$insert into public.executive_positions (display_name, position_title) values ('Member Officer', 'Chair')$q$, 'row-level security', 'member cannot add officers');
end $$;

do $$
declare uid uuid := gen_random_uuid(); r public.profiles;
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (uid, 'new@example.test', '{"full_name":"  New Student ","consent":"true","programme":"BA Economics","year_of_study":"2","role":"super_admin","privacy_notice_version":"v1"}');
  select * into r from public.profiles where id = uid;
  perform test.ok(r.id is not null, 'sign-up creates a profile');
  perform test.ok(r.role = 'member', 'role injected through sign-up metadata is ignored');
  perform test.ok(r.full_name = 'New Student', 'name is trimmed');
  perform test.ok(r.programme = 'BA Economics' and r.year_of_study = 2, 'programme and year are stored');
  perform test.ok(r.consent_given_at is not null and r.privacy_notice_version = 'v1', 'consent timestamp and notice version recorded');

  perform test.throws($q$insert into auth.users (email, raw_user_meta_data) values ('noc@example.test', '{"full_name":"No Consent"}')$q$, 'consent_required', 'sign-up without consent is refused');
  perform test.throws($q$insert into auth.users (email, raw_user_meta_data) values ('noc2@example.test', '{"full_name":"No Consent","consent":"false"}')$q$, 'consent_required', 'consent=false is refused');
  perform test.throws($q$insert into auth.users (email, raw_user_meta_data) values ('short@example.test', '{"full_name":"X","consent":"true"}')$q$, 'full_name', 'one-letter name is refused');

  insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), 'y@example.test', '{"full_name":"Year Test","consent":"true","year_of_study":"99"}');
  perform test.ok((select year_of_study from public.profiles where email = 'y@example.test') is null, 'invalid year of study is ignored, not stored');

  update auth.users set email = 'changed@example.test' where id = uid;
  perform test.ok((select email from public.profiles where id = uid) = 'changed@example.test', 'email change in auth is synced to the profile');
end $$;

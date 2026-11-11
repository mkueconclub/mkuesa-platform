do $$ begin
  perform test.as_user(test.u('mb'));
  perform test.eq(test.count('select * from public.profiles'), 1, 'member sees only their own profile');
  perform test.eq(test.rows($q$update public.profiles set full_name = 'Renamed' where id = '00000000-0000-0000-0000-000000000009'$q$), 1, 'member can edit their own name');
  perform test.eq(test.rows($q$update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000008'$q$), 0, 'member cannot edit someone else');
  perform test.throws($q$update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000009'$q$, 'permission denied', 'member cannot write the role column');
  perform test.throws($q$update public.profiles set email = 'x@evil.test' where id = '00000000-0000-0000-0000-000000000009'$q$, 'permission denied', 'member cannot write the email column');
  perform test.throws($q$insert into public.profiles (id, full_name, email) values (gen_random_uuid(), 'Fake', 'f@example.test')$q$, 'permission denied', 'clients cannot insert profiles');
  perform test.throws($q$delete from public.profiles where id = '00000000-0000-0000-0000-000000000009'$q$, 'permission denied', 'clients cannot delete profiles');

  perform test.as_user(test.u('editor'));
  perform test.eq(test.count('select * from public.profiles'), 1, 'content editor sees only their own profile');
  perform test.as_user(test.u('treas'));
  perform test.eq(test.count('select * from public.profiles'), 1, 'treasurer sees only their own profile (data minimisation)');
  perform test.as_user(test.u('memco'));
  perform test.ok(test.count('select * from public.profiles') >= 10, 'membership coordinator sees all profiles');
  perform test.as_user(test.u('sec'));
  perform test.ok(test.count('select * from public.profiles') >= 10, 'secretary sees all profiles');

  perform test.as_anon();
  perform test.throws('select * from public.profiles', 'permission denied', 'anonymous visitors cannot read profiles');
end $$;

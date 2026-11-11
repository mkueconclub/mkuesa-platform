-- Waiting-list promotion. Event 'pub' has capacity 1 (see fixtures).
do $$ begin
  perform test.as_user(test.u('ma'));
  insert into public.event_registrations (event_id, profile_id) values (test.ev('pub'), test.u('ma'));
  perform test.as_user(test.u('mb'));
  insert into public.event_registrations (event_id, profile_id) values (test.ev('pub'), test.u('mb'));
  perform test.as_admin();
  insert into public.event_registrations (event_id, profile_id) values (test.ev('pub'), test.u('mc'));

  perform test.ok((select status from public.event_registrations where profile_id = test.u('ma') and event_id = test.ev('pub')) = 'registered', 'first person holds the place');
  perform test.ok((select status from public.event_registrations where profile_id = test.u('mb') and event_id = test.ev('pub')) = 'waitlisted', 'second person is waitlisted');
  perform test.ok((select status from public.event_registrations where profile_id = test.u('mc') and event_id = test.ev('pub')) = 'waitlisted', 'third person is waitlisted');

  -- A waitlisted person cancelling frees nothing.
  perform test.as_user(test.u('mc'));
  update public.event_registrations set status = 'cancelled' where profile_id = test.u('mc') and event_id = test.ev('pub');
  perform test.as_admin();
  perform test.ok((select status from public.event_registrations where profile_id = test.u('mb') and event_id = test.ev('pub')) = 'waitlisted', 'cancelling from the waiting list promotes nobody');

  -- The place holder cancels: the longest-waiting person moves up.
  perform test.as_user(test.u('ma'));
  update public.event_registrations set status = 'cancelled' where profile_id = test.u('ma') and event_id = test.ev('pub');
  perform test.as_admin();
  perform test.ok((select status from public.event_registrations where profile_id = test.u('mb') and event_id = test.ev('pub')) = 'registered', 'cancelling a confirmed place promotes the waitlisted person');
  perform test.eq((select count(*) from public.event_registrations where event_id = test.ev('pub') and status = 'registered'), 1, 'the event never exceeds its capacity');

  -- A removed (deleted) confirmed registration also frees the place.
  insert into public.event_registrations (event_id, profile_id) values (test.ev('pub'), test.u('sec'));
  perform test.ok((select status from public.event_registrations where profile_id = test.u('sec') and event_id = test.ev('pub')) = 'waitlisted', 'a new person joins the waiting list while full');
  delete from public.event_registrations where profile_id = test.u('mb') and event_id = test.ev('pub');
  perform test.ok((select status from public.event_registrations where profile_id = test.u('sec') and event_id = test.ev('pub')) = 'registered', 'deleting a confirmed registration promotes the next person');

  -- Members can still not call the function themselves.
  perform test.as_user(test.u('ma'));
  perform test.throws('select private.promote_waitlist()', 'permission denied', 'members cannot call the promotion function directly');
end $$;

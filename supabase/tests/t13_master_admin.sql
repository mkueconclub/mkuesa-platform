-- The Super Administrator passes every member-only check without a membership; other officers do not.
do $$ begin
  perform test.as_user(test.u('super'));
  perform test.ok(private.is_approved_member(), 'super admin counts as an approved member with no membership row');
  perform test.ok(private.can_register_for_event(test.ev('members')), 'super admin may register for a members-only event');
  perform test.eq(test.rows($q$insert into public.event_registrations (event_id, profile_id) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001')$q$), 1, 'super admin can register for a members-only event');
  perform test.eq(test.rows($q$insert into public.research_publications (title, slug, type, status, author_id) values ('Admin research', 'admin-research', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000001')$q$), 1, 'super admin can submit research');
  perform test.eq(test.count($q$select 1 from public.announcements where visibility = 'members' and status = 'published'$q$), 1, 'super admin sees members-only announcements');

  -- everyone else is unchanged
  perform test.as_user(test.u('chair'));
  perform test.ok(not private.is_approved_member(), 'the chairperson still needs an approved membership for member-only features');
  perform test.as_user(test.u('treas'));
  perform test.ok(not private.is_approved_member(), 'the treasurer still needs an approved membership');
  perform test.as_user(test.u('mb'));
  perform test.ok(not private.is_approved_member(), 'a member with no application is still not approved');
  perform test.ok(not private.can_register_for_event(test.ev('members')), 'a non-approved member still cannot register for a members-only event');
  perform test.as_user(test.u('mc'));
  perform test.ok(not private.is_approved_member(), 'a pending applicant is still not approved');
  perform test.as_user(test.u('ma'));
  perform test.ok(private.is_approved_member(), 'an approved member is still approved');
  perform test.as_anon();
  perform test.throws('select private.is_approved_member()', 'permission denied', 'visitors still cannot call the helper');
end $$;

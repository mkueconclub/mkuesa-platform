do $$ begin
  -- announcements: visibility rules
  perform test.as_anon();
  perform test.eq(test.count('select * from public.announcements'), 1, 'anonymous visitors see only the published public announcement');
  perform test.as_user(test.u('mb'));
  perform test.eq(test.count('select * from public.announcements'), 1, 'unapproved member does not see members-only announcements');
  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.announcements'), 2, 'approved member also sees members-only announcements (not drafts)');
  perform test.as_user(test.u('treas'));
  perform test.eq(test.count('select * from public.announcements'), 3, 'staff can read drafts');

  -- who may write
  perform test.as_anon();
  perform test.throws($q$insert into public.announcements (title, slug, body) values ('x y z', 'x1', 'b')$q$, 'permission denied', 'anonymous visitors cannot create announcements');
  perform test.as_user(test.u('ma'));
  perform test.throws($q$insert into public.announcements (title, slug, body) values ('x y z', 'x2', 'b')$q$, 'row-level security', 'member cannot create announcements');
  perform test.as_user(test.u('treas'));
  perform test.throws($q$insert into public.announcements (title, slug, body) values ('x y z', 'x3', 'b')$q$, 'row-level security', 'treasurer cannot create announcements');
  perform test.as_user(test.u('memco'));
  perform test.throws($q$insert into public.announcements (title, slug, body) values ('x y z', 'x4', 'b')$q$, 'row-level security', 'membership coordinator cannot create announcements');

  -- content editor: drafts only
  perform test.as_user(test.u('editor'));
  perform test.eq(test.rows($q$insert into public.announcements (title, slug, body, created_by) values ('Editor draft', 'ed-draft', 'b', '00000000-0000-0000-0000-000000000001')$q$), 1, 'editor can create a draft announcement');
  perform test.ok((select created_by from public.announcements where slug = 'ed-draft') = test.u('editor'), 'creator is stamped by the server, a forged created_by is ignored');
  perform test.throws($q$insert into public.announcements (title, slug, body, status) values ('Editor pub', 'ed-pub', 'b', 'published')$q$, 'row-level security', 'editor cannot publish an announcement');
  perform test.throws($q$update public.announcements set status = 'published' where slug = 'ed-draft'$q$, 'row-level security', 'editor cannot publish their own draft');
  perform test.eq(test.rows($q$update public.announcements set title = 'Edited draft' where slug = 'ed-draft'$q$), 1, 'editor can edit a draft');
  perform test.eq(test.rows($q$update public.announcements set title = 'Tampered' where slug = 'a-pub'$q$), 0, 'editor cannot edit a published announcement');
  perform test.eq(test.rows($q$delete from public.announcements where slug = 'ed-draft'$q$), 0, 'editor cannot delete announcements');

  -- chairperson publishes
  perform test.as_user(test.u('chair'));
  perform test.eq(test.rows($q$update public.announcements set status = 'published' where slug = 'ed-draft'$q$), 1, 'chairperson can publish');
  perform test.as_anon();
  perform test.eq(test.count('select * from public.announcements'), 2, 'published announcement becomes visible to the public');
  perform test.ok((select published_at from public.announcements where slug = 'ed-draft') is not null, 'published_at is set automatically');

  -- resources / events / opportunities / research
  perform test.as_user(test.u('vice'));
  perform test.eq(test.rows($q$insert into public.resources (title, slug, category, kind, external_url) values ('Vice res', 'v-res', 'economics', 'link', 'https://example.test/v')$q$), 1, 'vice chairperson can create a resource');
  perform test.eq(test.rows($q$delete from public.resources where slug = 'v-res'$q$), 0, 'vice chairperson cannot delete resources');
  perform test.eq(test.rows($q$insert into public.events (title, slug, description, starts_at) values ('Vice event', 'v-event', 'd', now() + interval '5 days')$q$), 1, 'vice chairperson can create an event');
  perform test.as_user(test.u('editor'));
  perform test.eq(test.rows($q$delete from public.resources where slug = 'v-res'$q$), 1, 'editor can delete resources');
  perform test.eq(test.rows($q$insert into public.events (title, slug, description, starts_at, status) values ('Editor event', 'ed-event', 'd', now() + interval '6 days', 'published')$q$), 1, 'editor can create and publish events');
  perform test.eq(test.rows($q$delete from public.events where slug = 'ed-event'$q$), 0, 'editor cannot delete events');
  perform test.throws($q$insert into public.resources (title, slug, category, kind) values ('No link', 'nl', 'economics', 'link')$q$, 'check', 'a resource must have exactly one of link or file');
  perform test.throws($q$insert into public.resources (title, slug, category, kind, external_url) values ('Bad url', 'bu', 'economics', 'link', 'javascript:alert(1)')$q$, 'check', 'javascript: URLs are refused');
  perform test.as_user(test.u('treas'));
  perform test.throws($q$insert into public.opportunities (title, slug, category, description) values ('Opp t', 'ot', 'internship', 'd')$q$, 'row-level security', 'treasurer cannot create opportunities');

  perform test.as_anon();
  perform test.eq(test.count('select * from public.events'), 5, 'anonymous visitors see every published public event');
  perform test.eq(test.count($q$select * from public.events where slug in ('e-draft','e-members','v-event')$q$), 0, 'anonymous visitors see no draft or members-only event');
  perform test.eq(test.count('select * from public.resources'), 1, 'anonymous visitors see only published public resources');
  perform test.eq(test.count('select * from public.opportunities'), 1, 'anonymous visitors see only published public opportunities');
  perform test.eq(test.count('select * from public.research_publications'), 1, 'anonymous visitors see only published research');
  perform test.as_user(test.u('mb'));
  perform test.eq(test.count('select * from public.research_publications'), 2, 'authors can also see their own submitted research');
  perform test.as_user(test.u('ma'));
  perform test.eq(test.count('select * from public.research_publications'), 1, 'other members do not see unpublished submissions');
  perform test.eq(test.count('select * from public.resources'), 2, 'approved members see members-only resources');
end $$;

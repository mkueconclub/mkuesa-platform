-- TEST ONLY: fixture users and content. All data is synthetic.
-- Roles: super, chair, vice, sec, treas, memco, editor, plus members ma (approved), mb (none), mc (pending).
insert into auth.users (id, email, raw_user_meta_data)
select test.u(k), k || '@example.test',
       jsonb_build_object('full_name', 'Test ' || k, 'consent', 'true', 'privacy_notice_version', 'v1')
from unnest(array['super','chair','vice','sec','treas','memco','editor','ma','mb','mc']) as k;

update public.profiles set role = 'super_admin' where id = test.u('super');
update public.profiles set role = 'chairperson' where id = test.u('chair');
update public.profiles set role = 'vice_chairperson' where id = test.u('vice');
update public.profiles set role = 'secretary' where id = test.u('sec');
update public.profiles set role = 'treasurer' where id = test.u('treas');
update public.profiles set role = 'membership_coordinator' where id = test.u('memco');
update public.profiles set role = 'content_editor' where id = test.u('editor');

insert into public.memberships (profile_id, academic_year) values (test.u('ma'), '2026/2027'), (test.u('mc'), '2026/2027');
update public.memberships set status = 'approved' where profile_id = test.u('ma');

insert into public.announcements (title, slug, body, visibility, status) values
  ('Published public', 'a-pub', 'body', 'public', 'published'),
  ('Draft', 'a-draft', 'body', 'public', 'draft'),
  ('Published members', 'a-members', 'body', 'members', 'published');

insert into public.events (id, title, slug, description, starts_at, ends_at, capacity, registration_required, registration_deadline, visibility, status) values
  (test.ev('pub'), 'Pub event', 'e-pub', 'd', now() + interval '30 days', null, 1, true, null, 'public', 'published'),
  (test.ev('draft'), 'Draft event', 'e-draft', 'd', now() + interval '30 days', null, null, true, null, 'public', 'draft'),
  (test.ev('members'), 'Members event', 'e-members', 'd', now() + interval '30 days', null, null, true, null, 'members', 'published'),
  (test.ev('open'), 'Open event', 'e-open', 'd', now() + interval '30 days', null, null, false, null, 'public', 'published'),
  (test.ev('past'), 'Past event', 'e-past', 'd', now() - interval '10 days', now() - interval '9 days', null, true, null, 'public', 'published'),
  (test.ev('deadline'), 'Deadline passed', 'e-deadline', 'd', now() + interval '10 days', null, null, true, now() - interval '1 day', 'public', 'published');

insert into public.resources (title, slug, category, kind, external_url, visibility, status) values
  ('Res public', 'r-pub', 'economics', 'link', 'https://example.test/a', 'public', 'published'),
  ('Res members', 'r-members', 'economics', 'link', 'https://example.test/b', 'members', 'published'),
  ('Res draft', 'r-draft', 'economics', 'link', 'https://example.test/c', 'public', 'draft');

insert into public.opportunities (title, slug, category, description, visibility, status) values
  ('Opp public', 'o-pub', 'internship', 'd', 'public', 'published'),
  ('Opp draft', 'o-draft', 'internship', 'd', 'public', 'draft');

insert into public.research_publications (title, slug, type, status, author_id) values
  ('Pub paper', 'p-pub', 'article', 'published', null),
  ('Submitted paper', 'p-sub', 'student_research', 'submitted', test.u('mb'));

insert into public.executive_positions (display_name, position_title, public_consent, is_current) values
  ('Consenting Person', 'Chairperson', true, true),
  ('Private Person', 'Secretary', false, true);

insert into public.certificates (profile_id, title, revoked_at) values
  (test.u('ma'), 'Valid certificate', null),
  (test.u('ma'), 'Revoked certificate', now());

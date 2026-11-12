-- Phase 6: certificate verification, research submissions, analytics.
do $$
declare
  v_valid text; v_revoked text; v_evt_pub text; v_evt_draft text;
begin
  perform test.as_admin();
  insert into public.certificates (profile_id, event_id, title) values
    (test.u('ma'), test.ev('pub'), 'Public event cert'),
    (test.u('ma'), test.ev('draft'), 'Draft event cert');
  select verification_code into v_valid from public.certificates where title = 'Valid certificate';
  select verification_code into v_revoked from public.certificates where title = 'Revoked certificate';
  select verification_code into v_evt_pub from public.certificates where title = 'Public event cert';
  select verification_code into v_evt_draft from public.certificates where title = 'Draft event cert';

  -- ---- verification: anyone with a code
  perform test.as_anon();
  perform test.ok((select status from public.verify_certificate(v_valid)) = 'valid', 'a visitor can verify a valid certificate');
  perform test.ok((select status from public.verify_certificate(upper(v_valid))) = 'valid', 'codes are case-insensitive');
  perform test.ok((select status from public.verify_certificate('  ' || v_valid || ' ')) = 'valid', 'surrounding spaces are ignored');
  perform test.ok((select status from public.verify_certificate(v_revoked)) = 'revoked', 'a revoked certificate is reported as revoked');
  perform test.ok((select holder from public.verify_certificate(v_valid)) = 'Test m.', 'holder name is masked to first name and last initial');
  perform test.eq((select count(*) from public.verify_certificate('not-a-code')), 0, 'a malformed code returns nothing');
  perform test.eq((select count(*) from public.verify_certificate('0123456789abcdef0123456789abcdef')), 0, 'an unknown code returns nothing');
  perform test.eq((select count(*) from public.verify_certificate(null)), 0, 'null returns nothing');
  perform test.ok((select event_title from public.verify_certificate(v_evt_pub)) = 'Pub event', 'a public event title is shown');
  perform test.ok((select event_title from public.verify_certificate(v_evt_draft)) is null, 'a draft event title is never leaked');
  perform test.throws('select * from public.certificates', 'permission denied', 'visitors still cannot read the certificates table');
  perform test.eq((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'certificates' and column_name = 'email'), 0, 'certificates carry no email');

  -- ---- research submissions
  perform test.as_user(test.u('ma'));
  perform test.eq(test.rows($q$insert into public.research_publications (title, slug, type, status, author_id, abstract)
    values ('My research', 'my-research', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000008', 'An abstract of reasonable length for review.')$q$), 1, 'an approved member can submit research');
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('Self published', 'self-pub', 'student_research', 'published', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'a member cannot publish their own submission');
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('Wrong type', 'wrong-type', 'article', 'submitted', '00000000-0000-0000-0000-000000000008')$q$, 'row-level security', 'a member can only submit student research');
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('As someone else', 'as-else', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000009')$q$, 'row-level security', 'a member cannot submit as another person');
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id, reviewed_by)
    values ('Pre reviewed', 'pre-rev', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001')$q$, 'row-level security', 'a submission cannot claim to be reviewed');
  perform test.eq(test.rows($q$update public.research_publications set status = 'published' where slug = 'my-research'$q$), 0, 'a member cannot publish or edit after submitting');

  -- cap of 5 waiting submissions (a bulk insert of many rows in one statement must not slip past it)
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id) select 'Bulk ' || g, 'bulk-' || g, 'student_research', 'submitted', '00000000-0000-0000-0000-000000000008' from generate_series(1, 10) g$q$, 'too_many_submissions', 'a bulk insert cannot exceed the cap');
  perform test.rows($q$insert into public.research_publications (title, slug, type, status, author_id) select 'Extra ' || g, 'extra-' || g, 'student_research', 'submitted', '00000000-0000-0000-0000-000000000008' from generate_series(1, 4) g$q$);
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('Sixth', 'sixth', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000008')$q$, 'too_many_submissions', 'no more than 5 submissions may wait for review');

  -- withdraw
  perform test.eq(test.rows($q$delete from public.research_publications where slug = 'extra-1'$q$), 1, 'an author can withdraw a submission nobody has reviewed');
  perform test.eq(test.rows($q$delete from public.research_publications where slug = 'p-sub'$q$), 0, 'a member cannot withdraw someone else''s submission');
  perform test.as_admin();
  update public.research_publications set status = 'in_review' where slug = 'extra-2';
  perform test.as_user(test.u('ma'));
  perform test.eq(test.rows($q$delete from public.research_publications where slug = 'extra-2'$q$), 0, 'a submission under review can no longer be withdrawn');

  -- members who are not approved cannot submit
  perform test.as_user(test.u('mb'));
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('Not a member', 'not-member', 'student_research', 'submitted', '00000000-0000-0000-0000-000000000009')$q$, 'row-level security', 'a person with no membership cannot submit');
  perform test.as_user(test.u('mc'));
  perform test.throws($q$insert into public.research_publications (title, slug, type, status, author_id)
    values ('Pending member', 'pending-member', 'student_research', 'submitted', '00000000-0000-0000-0000-00000000000a')$q$, 'row-level security', 'a pending applicant cannot submit');

  -- ---- analytics
  perform test.as_anon();
  perform test.throws('select public.admin_analytics()', 'permission denied', 'visitors cannot call analytics');
  perform test.as_user(test.u('ma'));
  perform test.throws('select public.admin_analytics()', 'forbidden', 'members cannot read analytics');
  perform test.as_user(test.u('treas'));
  perform test.throws('select public.admin_analytics()', 'forbidden', 'the treasurer cannot read member analytics');
  perform test.as_user(test.u('editor'));
  perform test.throws('select public.admin_analytics()', 'forbidden', 'content editors cannot read analytics');
  perform test.as_user(test.u('memco'));
  perform test.ok(jsonb_array_length(public.admin_analytics()->'applications_by_month') = 12, 'the membership coordinator gets 12 months of data');
  perform test.as_user(test.u('chair'));
  perform test.ok((public.admin_analytics()) ?& array['applications_by_month','events','members_by_year','programmes'], 'leadership gets all four datasets');
  perform test.ok((select (sum((x->>'count')::int)) from jsonb_array_elements(public.admin_analytics()->'programmes') x) >= 1, 'approved members appear in the programme breakdown');
  perform test.ok(not exists (select 1 from jsonb_array_elements(public.admin_analytics()->'programmes') x where (x->>'count')::int < 3 and x->>'label' <> 'Other (small groups)' and x->>'label' <> 'Not given'), 'small programme groups are merged');
end $$;

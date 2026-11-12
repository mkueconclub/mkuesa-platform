-- Phase 6: certificate verification, student research submissions, committee analytics.
-- No new tables. Everything here is either a policy or a pinned-search_path SECURITY DEFINER function.

-- ---------------------------------------------------------------------------
-- 1. Certificate verification (public). Anyone holding a code can check it.
--    Returns only what a verifier needs: status, title, type, date, a masked holder name
--    ("Amina O.") and the event title when that event is public. Never an email or an id.
--    Codes are 128-bit random (see certificates.verification_code), so they cannot be guessed.
-- ---------------------------------------------------------------------------
create function public.verify_certificate(p_code text)
returns table (status text, title text, certificate_type text, issued_at timestamptz, holder text, event_title text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_code text := lower(btrim(coalesce(p_code, '')));
begin
  if v_code !~ '^[0-9a-f]{32}$' then
    return;
  end if;
  return query
  select
    case when c.revoked_at is null then 'valid' else 'revoked' end,
    c.title,
    c.certificate_type,
    c.issued_at,
    case
      when btrim(p.full_name) ~ '\s'
        then split_part(btrim(p.full_name), ' ', 1) || ' ' || upper(left((regexp_match(btrim(p.full_name), '(\S+)$'))[1], 1)) || '.'
      else btrim(p.full_name)
    end,
    case when e.status = 'published' and e.visibility = 'public' then e.title end
  from public.certificates c
  join public.profiles p on p.id = c.profile_id
  left join public.events e on e.id = c.event_id
  where c.verification_code = v_code;
end $$;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Student research submissions.
--    An approved member may submit their own research for review: it always starts as
--    'submitted' and can never be created already published or reviewed. No more than 5 may
--    wait for review at once (see the trigger below). Authors already see their own rows (research_select_author).
--    Staff review and publish through the existing admin policies.
-- ---------------------------------------------------------------------------
create policy research_member_submit on public.research_publications for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'submitted'
    and type = 'student_research'
    and reviewed_by is null
    and published_at is null
    and file_path is null
    and private.is_approved_member()
  );

-- No more than 5 submissions may wait for review per person. A trigger (not a policy check) so that
-- a bulk insert of many rows in one request cannot slip past: row triggers see rows added earlier in
-- the same statement. Staff are exempt.
create function private.limit_pending_submissions() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'submitted' and new.author_id is not null and not private.is_staff() then
    if (select count(*) from public.research_publications r
        where r.author_id = new.author_id and r.status in ('submitted', 'in_review')) >= 5 then
      raise exception 'too_many_submissions';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.limit_pending_submissions() from public, anon, authenticated;
create trigger research_limit_pending before insert on public.research_publications
  for each row execute function private.limit_pending_submissions();

-- An author may withdraw a submission that nobody has started reviewing.
create policy research_member_withdraw on public.research_publications for delete to authenticated
  using (author_id = (select auth.uid()) and status = 'submitted');

-- ---------------------------------------------------------------------------
-- 3. Committee analytics: one aggregate call instead of pulling rows to the server
--    (the API returns at most 1,000 rows per request). Readable by the roles that may already
--    read member data. Contains counts only; programmes with fewer than 3 members are merged
--    into "Other (small groups)" so no individual can be picked out.
-- ---------------------------------------------------------------------------
create function public.admin_analytics()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_member_reader() then
    raise exception 'forbidden';
  end if;

  return jsonb_build_object(
    -- last 12 calendar months (Nairobi time), zero-filled
    'applications_by_month', (
      select coalesce(jsonb_agg(jsonb_build_object('month', to_char(g, 'YYYY-MM'), 'applied', applied, 'approved', approved) order by g), '[]'::jsonb)
      from (
        select g,
               (select count(*) from public.memberships x where date_trunc('month', x.applied_at at time zone 'Africa/Nairobi') = g) as applied,
               (select count(*) from public.memberships x where date_trunc('month', x.applied_at at time zone 'Africa/Nairobi') = g and x.status = 'approved') as approved
        from generate_series(date_trunc('month', now() at time zone 'Africa/Nairobi') - interval '11 months',
                             date_trunc('month', now() at time zone 'Africa/Nairobi'), interval '1 month') g
      ) t
    ),
    -- the 12 most recent finished events
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object('title', title, 'starts_at', starts_at, 'capacity', capacity,
                                                   'signed_up', signed_up, 'attended', attended, 'waitlisted', waitlisted) order by starts_at), '[]'::jsonb)
      from (
        select e.title, e.starts_at, e.capacity,
               count(r.id) filter (where r.status in ('registered', 'attended')) as signed_up,
               count(r.id) filter (where r.status = 'attended') as attended,
               count(r.id) filter (where r.status = 'waitlisted') as waitlisted
        from public.events e
        left join public.event_registrations r on r.event_id = e.id
        where e.status = 'published' and coalesce(e.ends_at, e.starts_at) < now()
        group by e.id
        order by e.starts_at desc
        limit 12
      ) x
    ),
    -- approved, unexpired members by year of study
    'members_by_year', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by sort), '[]'::jsonb)
      from (
        select coalesce('Year ' || p.year_of_study, 'Not given') as label, coalesce(p.year_of_study, 99) as sort, count(*) as n
        from public.profiles p
        where exists (select 1 from public.memberships m where m.profile_id = p.id and m.status = 'approved' and (m.expires_at is null or m.expires_at >= current_date))
        group by p.year_of_study
      ) y
    ),
    -- approved, unexpired members by programme; groups under 3 are merged
    'programmes', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by (label = 'Other (small groups)'), n desc), '[]'::jsonb)
      from (
        select label, sum(c)::int as n
        from (
          select case when c >= 3 then prog else 'Other (small groups)' end as label, c
          from (
            select coalesce(nullif(btrim(p.programme), ''), 'Not given') as prog, count(*) as c
            from public.profiles p
            where exists (select 1 from public.memberships m where m.profile_id = p.id and m.status = 'approved' and (m.expires_at is null or m.expires_at >= current_date))
            group by 1
          ) g
        ) s
        group by label
      ) t
    )
  );
end $$;
revoke all on function public.admin_analytics() from public, anon;
grant execute on function public.admin_analytics() to authenticated;

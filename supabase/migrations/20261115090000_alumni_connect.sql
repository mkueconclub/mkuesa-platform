-- Alumni following by members (50+ approved followers earn a badge) and the Alumni Connect centre
-- (discussion board for approved alumni).

create table public.alumni_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  alumnus_id uuid not null references public.alumni_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, alumnus_id),
  check (follower_id <> alumnus_id)
);
create index alumni_follows_alumnus_idx on public.alumni_follows (alumnus_id);

create table public.connect_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.alumni_profiles(id) on delete cascade,
  topic text not null check (topic in ('idea','career','mentorship','collaboration','general')),
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index connect_posts_recent_idx on public.connect_posts (created_at desc);

create table public.connect_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.connect_posts(id) on delete cascade,
  author_id uuid not null references public.alumni_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index connect_replies_post_idx on public.connect_replies (post_id, created_at);

alter table public.alumni_follows enable row level security;
alter table public.connect_posts enable row level security;
alter table public.connect_replies enable row level security;
grant select, insert, delete on public.alumni_follows, public.connect_posts, public.connect_replies to authenticated;

-- Following: approved members only, own rows only, approved alumni only.
create policy follows_select_own on public.alumni_follows for select to authenticated using (follower_id = (select auth.uid()));
create policy follows_insert_own on public.alumni_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and private.is_approved_member()
    and exists (select 1 from public.alumni_profiles a where a.id = alumnus_id and a.status = 'approved'));
create policy follows_delete_own on public.alumni_follows for delete to authenticated using (follower_id = (select auth.uid()));

-- Alumni Connect: approved alumni read and write; authors (and staff) may delete.
create policy posts_select on public.connect_posts for select to authenticated using (private.is_approved_alumnus() or private.is_staff());
create policy posts_insert on public.connect_posts for insert to authenticated with check (author_id = (select auth.uid()) and private.is_approved_alumnus());
create policy posts_delete on public.connect_posts for delete to authenticated using (author_id = (select auth.uid()) or private.is_staff());
create policy replies_select on public.connect_replies for select to authenticated using (private.is_approved_alumnus() or private.is_staff());
create policy replies_insert on public.connect_replies for insert to authenticated with check (author_id = (select auth.uid()) and private.is_approved_alumnus());
create policy replies_delete on public.connect_replies for delete to authenticated using (author_id = (select auth.uid()) or private.is_staff());

-- Directory of approved alumni for approved members, approved alumni and staff. No emails are exposed.
-- Followers are counted once per person and only while they hold an approved, unexpired membership.
-- is_verified is true above 50 such followers (more than 50).
create function public.alumni_directory()
returns table (id uuid, full_name text, graduation_year smallint, organisation text, position_title text, bio text,
               linkedin_url text, open_to_mentoring boolean, follower_count integer, is_verified boolean, followed_by_me boolean)
language sql stable security definer set search_path = '' as $$
  select a.id, p.full_name, a.graduation_year, a.organisation, a.position_title, a.bio, a.linkedin_url, a.open_to_mentoring,
         c.n::integer, c.n > 50,
         exists (select 1 from public.alumni_follows f where f.alumnus_id = a.id and f.follower_id = (select auth.uid()))
  from public.alumni_profiles a
  join public.profiles p on p.id = a.id
  cross join lateral (
    select count(distinct f.follower_id) as n
    from public.alumni_follows f
    join public.memberships m on m.profile_id = f.follower_id and m.status = 'approved' and (m.expires_at is null or m.expires_at >= current_date)
    where f.alumnus_id = a.id
  ) c
  where a.status = 'approved'
    and (private.is_approved_member() or private.is_approved_alumnus() or private.is_staff())
  order by c.n desc, p.full_name
$$;
revoke all on function public.alumni_directory() from public, anon;
grant execute on function public.alumni_directory() to authenticated;

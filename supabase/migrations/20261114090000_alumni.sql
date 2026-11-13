-- Alumni portal: alumni profiles (verified by staff) and alumni-submitted opportunities (reviewed by staff).
alter type public.opportunity_category add value if not exists 'attachment';
alter type public.opportunity_category add value if not exists 'mentorship';
alter type public.opportunity_category add value if not exists 'graduate_trainee';
alter type public.opportunity_category add value if not exists 'research_collaboration';

create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.alumni_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  graduation_year smallint not null check (graduation_year between 1990 and 2100),
  organisation text check (char_length(organisation) <= 150),
  position_title text check (char_length(position_title) <= 150),
  bio text check (char_length(bio) <= 2000),
  open_to_mentoring boolean not null default false,
  linkedin_url text check (linkedin_url ~* '^https?://'),
  status public.review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opportunities gain the fields alumni submit. submission_status is NULL for staff-created items.
alter table public.opportunities
  add column eligibility text check (char_length(eligibility) <= 2000),
  add column contact text check (char_length(contact) <= 300),
  add column submission_status public.review_status;

create function private.is_approved_alumnus()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.alumni_profiles a where a.id = (select auth.uid()) and a.status = 'approved')
$$;

-- Only staff may change review state; alumni edits to their profile send it back to review.
create function private.alumni_guard() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not private.is_staff() then
    new.status := 'pending'; new.reviewed_by := null;
  elsif tg_op = 'UPDATE' and not private.is_staff() then
    new.status := old.status; new.reviewed_by := old.reviewed_by;
  end if;
  return new;
end $$;
create trigger alumni_profiles_guard before insert or update on public.alumni_profiles for each row execute function private.alumni_guard();
create trigger alumni_profiles_updated_at before update on public.alumni_profiles for each row execute function private.set_updated_at();

-- Approval publishes automatically; nothing else can publish an alumni submission.
create function private.alumni_submission_publish() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.submission_status = 'approved' then new.status := 'published';
  elsif new.submission_status is not null then new.status := 'draft';
  end if;
  return new;
end $$;
create trigger opportunities_alumni_publish before insert or update on public.opportunities for each row execute function private.alumni_submission_publish();

alter table public.alumni_profiles enable row level security;
grant select, insert, update on public.alumni_profiles to authenticated;
create policy alumni_select_own on public.alumni_profiles for select to authenticated using (id = (select auth.uid()));
create policy alumni_select_staff on public.alumni_profiles for select to authenticated using (private.is_staff());
create policy alumni_insert_own on public.alumni_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy alumni_update_own on public.alumni_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy alumni_update_staff on public.alumni_profiles for update to authenticated
  using (private.has_any_role('{super_admin,chairperson,vice_chairperson,secretary}'::public.user_role[]))
  with check (private.has_any_role('{super_admin,chairperson,vice_chairperson,secretary}'::public.user_role[]));

-- Approved alumni may submit opportunities (always pending, public once approved) and see their own.
create policy opportunities_alumni_submit on public.opportunities for insert to authenticated
  with check (private.is_approved_alumnus() and created_by = (select auth.uid()) and submission_status = 'pending' and status = 'draft' and visibility = 'public');
create policy opportunities_alumni_own on public.opportunities for select to authenticated using (created_by = (select auth.uid()) and submission_status is not null);

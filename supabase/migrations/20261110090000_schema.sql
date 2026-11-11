-- MKUESA platform: core schema (Phase 3)
-- Every table gets Row Level Security in migration 3. Never edit an applied
-- migration; add a new one.

create schema if not exists private;

-- ---------- enums ----------
create type public.user_role as enum ('super_admin','chairperson','vice_chairperson','secretary','treasurer','membership_coordinator','content_editor','member');
create type public.membership_status as enum ('pending','approved','rejected','suspended','expired');
create type public.content_status as enum ('draft','published','archived');
create type public.visibility as enum ('public','members');
create type public.registration_status as enum ('registered','waitlisted','cancelled','attended');
create type public.resource_category as enum ('economics','finance_investment','academic_material','recommended_course','video_lesson');
create type public.resource_kind as enum ('file','link','video');
create type public.publication_type as enum ('student_research','article','economic_analysis','association_publication');
create type public.publication_status as enum ('draft','submitted','in_review','published','rejected');
create type public.opportunity_category as enum ('internship','scholarship','competition','conference','career');
create type public.contact_status as enum ('new','read','replied','spam');

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text check (phone ~ '^[0-9+() -]{7,20}$'),
  registration_number text check (char_length(registration_number) between 3 and 40),
  programme text check (char_length(programme) <= 120),
  year_of_study smallint check (year_of_study between 1 and 8),
  avatar_path text check (char_length(avatar_path) <= 300),
  role public.user_role not null default 'member',
  consent_given_at timestamptz,
  privacy_notice_version text check (char_length(privacy_notice_version) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);

-- ---------- memberships ----------
create sequence public.membership_number_seq;
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  academic_year text not null check (
    case when academic_year ~ '^[0-9]{4}/[0-9]{4}$'
      then substr(academic_year, 6)::int = substr(academic_year, 1, 4)::int + 1
      else false end),
  status public.membership_status not null default 'pending',
  membership_number text unique,
  motivation text check (char_length(motivation) <= 500),
  applied_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text check (char_length(rejection_reason) <= 300),
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, academic_year)
);
create index memberships_status_idx on public.memberships (status);
create index memberships_profile_idx on public.memberships (profile_id);

-- ---------- executive_positions ----------
create table public.executive_positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 120),
  position_title text not null check (char_length(position_title) between 2 and 80),
  bio text check (char_length(bio) <= 1000),
  photo_path text check (char_length(photo_path) <= 300),
  term_label text check (char_length(term_label) <= 20),
  display_order smallint not null default 0,
  is_current boolean not null default true,
  public_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index executive_positions_public_idx on public.executive_positions (display_order) where public_consent and is_current;

-- ---------- announcements ----------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  body text not null check (char_length(body) <= 20000),
  visibility public.visibility not null default 'public',
  status public.content_status not null default 'draft',
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_feed_idx on public.announcements (status, published_at desc);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(description) <= 20000),
  location text check (char_length(location) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer check (capacity > 0),
  registration_required boolean not null default false,
  registration_deadline timestamptz,
  visibility public.visibility not null default 'public',
  status public.content_status not null default 'draft',
  cover_image_path text check (char_length(cover_image_path) <= 300),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_feed_idx on public.events (status, starts_at);

-- ---------- event_registrations ----------
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  attended_at timestamptz,
  unique (event_id, profile_id)
);
create index event_registrations_event_idx on public.event_registrations (event_id);
create index event_registrations_profile_idx on public.event_registrations (profile_id);

-- ---------- resources ----------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 5000),
  category public.resource_category not null,
  kind public.resource_kind not null,
  external_url text check (external_url ~* '^https?://'),
  storage_path text check (char_length(storage_path) <= 300),
  tags text[] not null default '{}',
  visibility public.visibility not null default 'public',
  status public.content_status not null default 'draft',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(external_url, storage_path) = 1)
);
create index resources_feed_idx on public.resources (status, category);
create index resources_tags_idx on public.resources using gin (tags);

-- ---------- research_publications ----------
create table public.research_publications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 250),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  abstract text check (char_length(abstract) <= 3000),
  body text check (char_length(body) <= 100000),
  file_path text check (char_length(file_path) <= 300),
  type public.publication_type not null,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text check (char_length(author_name) <= 120),
  status public.publication_status not null default 'draft',
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_feed_idx on public.research_publications (status, published_at desc);
create index research_author_idx on public.research_publications (author_id);

-- ---------- opportunities ----------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  organisation text check (char_length(organisation) <= 150),
  category public.opportunity_category not null,
  description text not null check (char_length(description) <= 20000),
  apply_url text check (apply_url ~* '^https?://'),
  location text check (char_length(location) <= 200),
  deadline timestamptz,
  visibility public.visibility not null default 'public',
  status public.content_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opportunities_feed_idx on public.opportunities (status, deadline);

-- ---------- certificates ----------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null check (char_length(title) between 3 and 200),
  certificate_type text not null default 'participation' check (char_length(certificate_type) <= 40),
  issued_by uuid references public.profiles(id) on delete set null,
  issued_at timestamptz not null default now(),
  verification_code text not null unique default replace(gen_random_uuid()::text, '-', ''),
  file_path text check (char_length(file_path) <= 300),
  revoked_at timestamptz,
  revoked_reason text check (char_length(revoked_reason) <= 300)
);
create index certificates_profile_idx on public.certificates (profile_id);

-- ---------- contact_messages ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  status public.contact_status not null default 'new',
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index contact_messages_throttle_idx on public.contact_messages (lower(email), created_at);

-- ---------- audit_logs (append-only; written only by triggers) ----------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

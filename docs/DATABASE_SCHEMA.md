# MKUESA Digital Platform — Database Schema (Proposal)

**Status:** Implemented in Phase 3 as four migrations in `supabase/migrations/`, verified by 179 automated permission tests (`npm run test:db`). Not yet applied to a live Supabase project: see `docs/SUPABASE_SETUP.md`.
**Database:** Supabase PostgreSQL. All tables in the `public` schema unless noted. Helper functions live in a private schema.

---

## 1. Conventions

- Primary keys: `uuid` (`gen_random_uuid()`); `profiles.id` equals `auth.users.id`.
- Every table has `created_at timestamptz default now()`; mutable tables also have `updated_at` (maintained by a trigger).
- Status and category fields use PostgreSQL **enums** or `CHECK` constraints, so invalid values are rejected by the database itself.
- Public-facing content has a unique `slug`.
- **RLS is enabled on every table.** No table is readable or writable until a policy allows it (deny by default).
- No student data in seed files. `seed.sql` contains clearly labelled sample content only.

### Enums
| Enum | Values |
|---|---|
| `user_role` | `super_admin`, `chairperson`, `vice_chairperson`, `secretary`, `treasurer`, `membership_coordinator`, `content_editor`, `member` |
| `membership_status` | `pending`, `approved`, `rejected`, `suspended`, `expired` |
| `content_status` | `draft`, `published`, `archived` |
| `visibility` | `public`, `members` |
| `registration_status` | `registered`, `waitlisted`, `cancelled`, `attended` |

---

## 2. Entity Relationships

```
auth.users 1──1 profiles 1──* memberships
                    │
                    ├──* event_registrations *──1 events
                    ├──* certificates ───────────? events
                    ├──? executive_positions
                    ├──* announcements / events / resources / opportunities (created_by)
                    ├──* research_publications (author, reviewer)
                    └──* audit_logs (actor)

contact_messages  (standalone, no user link)
```

---

## 3. Tables and Their Purpose

Twelve tables, exactly as listed in your brief. No duplicates added.

### 3.1 `profiles` — *who the person is*
One row per registered user, created automatically on sign-up.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| full_name | text NOT NULL | |
| email | text NOT NULL | copied from auth for display; unique |
| phone | text | optional |
| registration_number | text | **optional**, restricted visibility; decision #5 |
| programme | text | e.g. course name |
| year_of_study | smallint | CHECK 1–8 |
| avatar_path | text | Storage path, not a public URL |
| role | `user_role` NOT NULL default `member` | **Not writable by the user** |
| consent_given_at | timestamptz | Data Protection Act consent timestamp |
| privacy_notice_version | text | which notice they accepted |
| created_at / updated_at | timestamptz | |

Indexes: `role`, unique `lower(email)`.
**Why separate from `memberships`:** a profile is the person (lasts their whole time on the platform); membership is a status that is applied for and renewed.

### 3.2 `memberships` — *membership applications and status per academic year*
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid NOT NULL | FK → profiles |
| academic_year | text NOT NULL | e.g. `2026/2027`, CHECK format |
| status | `membership_status` default `pending` | |
| membership_number | text UNIQUE | assigned on approval |
| motivation | text | optional short statement on the application |
| applied_at | timestamptz default now() | |
| reviewed_by | uuid | FK → profiles |
| reviewed_at | timestamptz | |
| rejection_reason | text | |
| expires_at | date | |

Constraints: `UNIQUE (profile_id, academic_year)`. Indexes: `(status)`, `(profile_id)`.
**Why:** supports renewals each year and keeps a record of who approved whom.

### 3.3 `executive_positions` — *the public leadership page*
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid | nullable FK → profiles (a leader may not hold a platform account yet) |
| display_name | text NOT NULL | shown publicly **only with consent** |
| position_title | text NOT NULL | |
| bio | text | |
| photo_path | text | |
| term_label | text | e.g. `2026/2027` |
| display_order | smallint | |
| is_current | boolean default true | |
| public_consent | boolean default false | must be true to appear publicly |

**Why separate from `profiles.role`:** a *position* (Chairperson, shown on the About page) and a *system role* (what the person may do in the admin portal) are different things.

### 3.4 `announcements`
`id`, `title`, `slug` unique, `body`, `visibility` (renamed from `audience` for consistency with other tables), `status` (`content_status`), `is_pinned`, `published_at`, `created_by` → profiles, timestamps.
Index: `(status, published_at DESC)`.

### 3.5 `events`
`id`, `title`, `slug` unique, `description`, `location`, `starts_at`, `ends_at` (CHECK ≥ starts_at), `capacity` (nullable = unlimited), `registration_required`, `registration_deadline`, `visibility`, `status`, `cover_image_path`, `created_by`, timestamps.
Indexes: `(status, starts_at)`.

### 3.6 `event_registrations`
`id`, `event_id` → events (CASCADE), `profile_id` → profiles (CASCADE), `status` (`registration_status`), `registered_at`, `attended_at`.
Constraint: **`UNIQUE (event_id, profile_id)`**: no double registration. Capacity is enforced in a database function so two people can't take the last seat at the same time. Indexes: `(event_id)`, `(profile_id)`.

### 3.7 `resources` — *Learning Hub*
`id`, `title`, `slug` unique, `description`, `category` (`economics` | `finance_investment` | `academic_material` | `recommended_course` | `video_lesson`), `kind` (`file` | `link` | `video`), `external_url`, `storage_path` (CHECK: exactly one of the two is set), `tags text[]` (GIN index), `visibility`, `status`, `uploaded_by`, timestamps.
**Why `tags text[]`, not a tags table:** avoids two extra tables for a small catalogue.

### 3.8 `research_publications`
`id`, `title`, `slug` unique, `abstract`, `body` (markdown) and/or `file_path`, `type` (`student_research` | `article` | `economic_analysis` | `association_publication`), `author_id` → profiles (nullable), `author_name` (for non-members), `status` (`draft` | `submitted` | `in_review` | `published` | `rejected`), `reviewed_by`, `published_at`, timestamps.
The `submitted`/`in_review` statuses prepare for student submissions in Phase 6 without needing a new table.

### 3.9 `opportunities`
`id`, `title`, `organisation`, `category` (`internship` | `scholarship` | `competition` | `conference` | `career`), `description`, `apply_url`, `location`, `deadline`, `visibility`, `status`, `created_by`, timestamps.
Index: `(status, deadline)`.

### 3.10 `certificates`
`id`, `profile_id` → profiles, `event_id` → events (nullable), `title`, `certificate_type`, `issued_by` → profiles, `issued_at`, `verification_code text UNIQUE` (random, non-guessable), `file_path`, `revoked_at`, `revoked_reason`.
**Public verification** (Phase 6) goes through a narrow database function that takes a code and returns only name, title, issue date and validity. The table itself is **never** publicly readable.

### 3.11 `contact_messages`
`id`, `name`, `email`, `subject`, `message` (length CHECK), `status` (`new` | `read` | `replied` | `spam`), `created_at`.
Written only through a server endpoint (Turnstile + rate limit). Read by authorised staff only. A retention period (proposed: delete after 12 months) is enforced by a scheduled job.

### 3.12 `audit_logs` — *append-only record of important actions*
`id`, `actor_id` → profiles (nullable, set null on delete), `action` (e.g. `membership.approved`), `entity_type`, `entity_id`, `metadata jsonb` (before/after values; **no secrets**), `created_at`.
**No UPDATE or DELETE policy exists.** Rows are written by triggers/`SECURITY DEFINER` functions so they can't be skipped or faked from the browser. IP addresses are deliberately not stored (minimisation).
Index: `(entity_type, entity_id)`, `(created_at DESC)`.

---

## 4. Row Level Security Design

Helper functions (in a private schema, `SECURITY DEFINER`, `search_path` fixed):
- `current_user_role()`: returns the caller's role from `profiles`.
- `has_role(variadic roles)`: true if the caller's role is in the list.
- `is_approved_member()`: true if the caller has an `approved`, non-expired membership.

Using functions avoids recursive policies on `profiles`.

| Table | Anonymous | Signed-in user | Staff |
|---|---|---|---|
| profiles | none | read/update **own row**, but **not** `role` (column-level privilege + trigger) | read per role; role changes by Super Admin only |
| memberships | none | read own; insert own `pending` application | membership roles read/approve |
| executive_positions | read rows with `public_consent AND is_current` | same | exec/admin write |
| announcements / events / opportunities / resources / research | read `published` AND `visibility = public` | + `members` visibility if approved member | role-based write; Content Editor cannot publish announcements (draft only) |
| event_registrations | none | read/insert/cancel own | read by event managers |
| certificates | none | read own, not revoked | issuing roles |
| contact_messages | none (inserts via server only) | none | Secretary / Super Admin |
| audit_logs | none | none | read-only for listed roles; no writes from clients |

**Storage buckets** (all private except one):
`avatars` (own folder), `resources` (policy follows `visibility`), `publications`, `certificates` (owner + issuers), `event-covers` and `leadership-photos` (public-read, staff-write). Limits: size and MIME allow-list, e.g. PDF, PNG, JPEG, WEBP; no executables.

---

## 5. Data Protection Act, 2019: Design Choices

- **Minimisation:** only what the feature needs. Phone, registration number and motivation are optional.
- **Consent:** timestamp and notice version stored on `profiles`.
- **Access limits:** registration number visible only to membership staff.
- **Retention:** defined per table before launch (contact messages 12 months; rejected applications to be set by you; closed accounts anonymised).
- **Rights:** a member can edit their profile and request deletion; deletion removes personal data but keeps anonymised audit entries.
- **Cross-border hosting:** disclosed in the privacy notice (see risk R4).
- **Sample data:** synthetic only.

---

## 6. Open Questions for the Owner
1. Single role per person (as designed) acceptable?
2. Collect `registration_number`? Optional or required?
3. Should applicants (pending) be able to see member-only content? *Recommend no.*
4. Retention periods you want (esp. rejected applications, closed accounts)?
5. Are **guests** allowed to register for public events? *Recommend no for v1.*


---

## 7. Implementation Notes (Phase 3)

**Changes from the Phase 0 proposal**
| Change | Reason |
|---|---|
| `announcements.audience` renamed `visibility` | Same enum and meaning as on events, resources and opportunities |
| Treasurer and Content Editor cannot read individual member data | Data minimisation. Treasurer gets aggregate statistics only (built in Phase 5) |
| Contact form inserts only through `public.submit_contact_message()` | Validates input and throttles in the database: 3 per email per hour, 30 per hour overall. No service-role key needed |
| Anonymous visitors may read only named columns of `executive_positions` | Hides the linked profile id. **Public queries must list columns; `select *` is refused** |
| Resource, publication and opportunity categories use database enums | Sample content in the UI uses slightly different ids and will be mapped when pages read from the database |
| Storage buckets deferred to Phase 4-5 | No upload features exist yet |
| Certificate verification function deferred to Phase 6 | Public name exposure needs an explicit decision |

**Behaviour to know**
- **Sign-up is refused unless consent is recorded.** The database trigger rejects it even if someone calls Supabase directly. Only whitelisted metadata is read; a `role` supplied at sign-up is ignored.
- **Roles can be changed only by Super Admin** (via `public.set_user_role`, never on yourself) or from the Supabase SQL editor. Three layers: column privileges, RLS, and a trigger.
- **Membership approval** stamps the reviewer and time, assigns `MKUESA-00001`-style numbers, and cannot change the applicant or academic year. `expires_at` is set manually by an approver.
- **Event registration status is chosen by the server** (`registered`, or `waitlisted` when full; the event row is locked to prevent two people taking the last seat). Waitlisted people are **not** promoted automatically when someone cancels. This is planned for Phase 4.
- **Audit log** is written by triggers for memberships, content, certificates, officers and role changes. Nobody can insert, edit or delete entries from the app.
- `private.purge_old_contact_messages()` deletes messages older than 12 months. It is **not scheduled yet** (Phase 8).

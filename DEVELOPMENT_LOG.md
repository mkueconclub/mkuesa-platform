# Development Log

## Phase 0 — Project Discovery and Architecture
**Date:** 10 Nov 2026 · **Status:** Complete, awaiting owner approval

### Completed
- Inspected environment: no existing project; folder skeleton only.
- Verified current stable package versions and peer dependencies against the npm registry.
- Wrote architecture, sitemap, roles matrix, roadmap, risk register, and decision list (`docs/PROJECT_ARCHITECTURE.md`).
- Proposed 12-table relational schema and RLS design (`docs/DATABASE_SCHEMA.md`). **No SQL executed.**
- Created security baseline, deployment placeholder, `.env.example` (names only) and `.gitignore`.

### Changes to the original skeleton
- `src/middleware.ts` → `src/proxy.ts` (Next.js 16 rename; `middleware.ts` is deprecated).
- Admin routes to be added in Phase 1/5: opportunities, certificates, leadership, messages, audit-logs (required by the brief, absent from the skeleton).

### Technical findings
- TypeScript 7.0 and ESLint 10 are the newest releases but are not supported by the lint toolchain used by Next.js → pinned to TypeScript 5.9.x and ESLint 9.39.x.
- Not tested: nothing is built yet, so there is nothing to run. No functionality is claimed.

### Outstanding / pending owner decisions
See `docs/PROJECT_ARCHITECTURE.md` §9 (nine decisions) and the list of official information required.

### Next
Phase 1 — Project Foundation (on approval).

---

## Owner inputs received (10 Nov 2026) — Phase 0 still awaiting approval

### Logo
- Official MKUESA logo supplied: `public/logos/mkuesa-logo-original-400.jpg` (399×399 JPEG, grey background, **not transparent**).
- Logo colours (approximate, sampled from the image): orange ≈ `#F06010`, purple ≈ `#9000C0`, charcoal ≈ `#303030`, white.
- **Conflict:** the brief's palette (navy / gold / forest green) does not match the logo (orange / purple). Needs an owner decision before Phase 1 design tokens.
- Needs a higher-resolution or vector original (SVG, or PNG with transparent background) for the header, favicon and print.

### Executive committee (provided by owner; publication consent still to be confirmed)
| Position | Name |
|---|---|
| Chairperson | Brian Angwenyi |
| Vice Chair | Seth Haguma |
| Secretary | Divinnah Mogeni |
| Treasurer | Joy Masinde |
| Members Coordinator | *(name not yet provided)* |

Names are for the `executive_positions` table (Phase 3). Not to be published until each person consents.

---

## Phase 1 — Project Foundation
**Date:** 10 Nov 2026 · **Status:** Built and tested, awaiting owner review

### Owner decisions applied
Brand-led palette (logo purple/orange); all Phase 0 recommendations approved.

### Completed
- Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.5, ESLint 9.39.5, Vitest 5.1.0 installed with exact pins; `package-lock.json` generated.
- Design tokens (`globals.css`), typography (Newsreader + Public Sans, self-hosted), reduced-motion support, visible focus styles.
- Layout: responsive header (desktop nav from 1280px, accessible mobile menu with Escape-to-close), footer, skip link, shared `PublicShell`, branded 404.
- UI primitives: Button (5 variants), Container, Section, Card, Badge, Input (label, hint, error, ARIA).
- Placeholder pages for all public routes, login, dashboard and admin so no navigation link leads to a 404. Home page includes a temporary design-system preview.
- `proxy.ts` stub (matcher: `/dashboard`, `/admin`; no logic yet). Baseline security headers in `next.config.ts`.
- `robots: noindex` set site-wide until launch (**remove in Phase 8**).
- Dependencies added: 2 Fontsource fonts, `lucide-react`. Nothing else.

### Tests run (all passing)
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 problems |
| Vitest | 27/27: 22 contrast pairs (WCAG AA), 3 navigation integrity, 2 utility |
| `next build` | Succeeds; 12 routes prerendered |
| Production server | All 11 routes return 200; unknown route returns 404 with header/footer; security headers present; fonts served; skip link, landmarks, `lang` present |

### Not tested (be aware)
- **No real browser was available**, so nothing has been viewed visually. Layout, spacing, mobile menu behaviour and responsiveness are **unverified until you open it locally**. Please check on a phone-width window.
- Keyboard and screen-reader behaviour is built per ARIA practice but not manually tested (formal pass in Phase 7).

### Outstanding issues
1. **Logo** is a 399px JPEG with a grey background, cropped to a circle. Needs SVG/transparent PNG; favicon not set until then.
2. **ESLint 9 is flagged "no longer supported"** by npm. ESLint 10 isn't yet supported by the `eslint-plugin-*` packages used by `eslint-config-next`. Re-check at Phase 7.
3. Header switches to the mobile menu below 1280px (7 links + 2 buttons don't fit tablets). Revisit after you see it.
4. Content Security Policy deferred to Phase 7.
5. Official content, contact details and Members Coordinator name still needed.

---

## Phase 2 — Public Website
**Date:** 10 Nov 2026 · **Status:** Built and tested, awaiting owner review

### Owner input applied
Mission, vision and core values (lightly corrected for spelling and grammar; **owner to confirm the final wording**).

### Completed
- **Home:** hero, mission and vision, "what we do" (derived directly from the mission), core values, announcements, upcoming events, featured academic content, membership call to action.
- **About:** background (pending), mission and vision, values, objectives (pending), constitution and governance (pending), executive committee (positions only).
- **Membership:** draft benefits (flagged for confirmation), requirements (pending), three-step process. Registration button disabled until Phase 3.
- **Events:** upcoming and past lists, plus `/events/[slug]` detail pages (unknown slug returns 404).
- **Learning Hub, Research, Opportunities:** all categories from the brief, each with sample cards.
- **Contact:** details pending; form fully built but disabled until the backend, rate limiting and CAPTCHA exist (Phase 3).
- New components: PageHeader, ContentCard, EventCard, Notice, Textarea. Dependencies added: none.

### Tests run (all passing)
| Check | Result |
|---|---|
| `tsc --noEmit` / `eslint .` | 0 errors / 0 problems |
| Vitest | 46/46: 28 contrast pairs, sample-content integrity, committee privacy gate, date helpers (Nairobi time), navigation, utilities |
| `next build` | Succeeds; 17 routes (4 event pages statically generated) |
| Live server | All routes 200; unknown event 404; exactly one `<h1>` per page; official text present; **no executive name appears in any served page**; contact form disabled with 4 labelled fields; no broken internal links from the home page |

### Test correction
My first date test assumed a 12-hour clock; `en-KE` correctly uses 24-hour time ("14:00"). The code was right and the test was fixed.

### Not tested
- **Not viewed in a browser by me.** Visual quality, spacing, hero graphic and mobile layout need your eyes.
- Keyboard and screen-reader behaviour (formal pass in Phase 7).

### Outstanding
1. Confirm mission/vision wording; supply history, objectives, constitution, membership requirements, contact details, social links, Members Coordinator name.
2. Confirm each officer's consent, then set `showExecutiveNames = true`.
3. Logo replacement (SVG or transparent PNG) still needed.
4. All events, resources, publications and opportunities are sample content.
5. Phase 1 review feedback (header, mobile menu, colours) not yet received.

---

## Phase 3 — Database and Authentication
**Date:** 10 Nov 2026 · **Status:** Built and tested up to the Supabase boundary; awaiting owner review and Supabase project creation

### Owner input applied
Supabase account to be created under `mkueconclub@gmail.com`. Registration open to any email address.

### Completed
- **Four migrations** (`supabase/migrations/`): schema (11 enums, all 12 tables, constraints, indexes), helper functions and triggers, RLS and privileges, public functions.
- **Authentication:** register, login, logout, password reset (request and update), email-confirmation route, open-redirect protection, privacy-notice consent recorded on the profile.
- **Role-based access:** 8 roles; permissions enforced by the database. `/admin` gated server-side; `/dashboard` requires sign-in.
- **Member features (minimal, expanded in Phase 4):** dashboard with membership status and "apply for membership"; admin page showing role and pending-application count.
- **Contact form live** through a throttled database function (honeypot + limits).
- **Draft privacy notice** at `/privacy` (needs legal/ICT review).
- **Docs:** `docs/SUPABASE_SETUP.md` (step-by-step), schema notes, security controls, architecture deviations.
- Dependencies added: `@supabase/supabase-js`, `@supabase/ssr`, `zod`. Nothing else.

### Tests run (all passing)
| Check | Result |
|---|---|
| Database permission suite (`npm run test:db`) on PostgreSQL 16 with a Supabase stand-in | **179 assertions, 10 files**, covering sign-up, profiles, memberships, roles, content publishing, registrations, certificates, contact, audit |
| Deliberate-break checks | Opening the `role` column and loosening the contact policy were each caught by the suite |
| Vitest | **85 tests**: validation, redirect safety, TS roles match SQL, plus Phase 1-2 tests |
| `tsc` / `eslint` / `next build` | 0 errors / 0 problems / succeeds (21 routes) |
| Live server, Supabase unconfigured | Public pages, login, register, reset, contact, privacy all 200; protected pages fail with a clear configuration message |
| Live server, dummy Supabase config | `/dashboard`, `/admin` and sub-paths redirect signed-out users to login with the original path; `/reset-password/update` without a session redirects; `/auth/confirm` with no, bad or unverifiable token redirects safely |

### Defect found and fixed
Permission tests showed that `private.purge_old_contact_messages()` was executable by any signed-in user (created after the privilege lock-down). Fixed in migration 4; a guard test now fails if any internal function is exposed.

### Not tested (be aware)
- **No live Supabase project exists yet**, so sign-up, confirmation email, login, password reset and Supabase's own session handling are **untested end-to-end**. They are verified only up to the Supabase boundary. The database tests use a stand-in for Supabase's `auth` schema, so real-Supabase behaviour (e.g. creating a trigger on `auth.users`, key formats, email templates) is unconfirmed until migrations run on a real project.
- Not viewed in a browser. Phase 2 visual review also still outstanding.
- Keyboard and screen-reader behaviour of the new forms (Phase 7).

### Outstanding
1. Create the Supabase project and run migrations (`docs/SUPABASE_SETUP.md`), then report any errors.
2. Set up SMTP; without it, students cannot receive confirmation emails.
3. Privacy notice review; retention periods; data-request contact; hosting region.
4. Waitlist promotion on cancellation (Phase 4); scheduling of the 12-month contact purge (Phase 8).
5. Items still pending from earlier phases: logo file, official content, executive consent, Members Coordinator name, visual review.

---

## Phase 4 — Member Portal
**Date:** 11 Nov 2026 · **Status:** Built; verified by typecheck, lint and unit tests; awaiting owner review and a live Supabase project

### Objective
Give every signed-in person a secure area to manage their details, see their membership, take part in events, read member content and keep their certificates.

### Completed
- **Portal shell** (`/dashboard/*`): sidebar on desktop, scrolling tabs on phones, one `<h1>` per page, sign-out and Administration (staff only) always reachable.
- **Overview:** membership status, counts of upcoming events, events attended and certificates, next events and latest announcements.
- **Profile** (`/dashboard/profile`): edit name, phone, registration number, programme and year. Email and role are read-only. Validation mirrors the database CHECK constraints; the database only lets members change those five columns.
- **Membership** (`/dashboard/membership`): current-year status, apply form, history, membership number and expiry.
- **Events** (`/dashboard/events`): upcoming events with Register / Cancel / Register again, waiting-list status, and a record of past participation (attended, registered).
- **Resources** (`/dashboard/resources`): published resources grouped by category; members-only items appear only to approved members (enforced by Row Level Security, not the interface).
- **Announcements** (`/dashboard/announcements`): pinned first, plain text only.
- **Certificates** (`/dashboard/certificates`): own certificates with verification code; revoked ones are hidden by the database.
- **Waiting-list promotion** (migration `20261112090000`): when a confirmed place is freed (cancel or delete), the longest-waiting person is moved up automatically. Closes the Phase 3 outstanding item.
- Forms keep what you typed after an error (React 19 otherwise clears them); server actions never throw on missing Supabase keys or network errors.
- `requireProfile` / `getCurrentUser` are cached per request so layouts and pages share one lookup.

### Tests run
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src tests` | 0 problems |
| Unit tests | **102 passing** across 8 files at the end of Phase 4 (16 new: profile validation, event-ID validation, membership and event helper logic). Run with a stand-in runner because the Vitest binary could not start in the build sandbox; please run `npm test` yourself. |

### Not tested (be aware)
- **`npm run test:db` was not run** (no PostgreSQL in the build sandbox). New file `supabase/tests/t11_waitlist.sql` and migration `20261112090000_waitlist_promotion.sql` are therefore **unverified**. Run `npm run test:db` and report any failure.
- **`next build` was not run** (sandbox could not download the compiler). Run `npm run build` locally.
- **No live Supabase project in the sandbox**, so no screen was exercised end to end and nothing was viewed in a browser. Register, confirm, edit profile, register for an event and cancel, all need checking by hand.
- Keyboard and screen-reader behaviour (formal pass in Phase 7).

### Decisions and trade-offs
- Event and resource lists load up to 200 and 300 rows and filter in code. Fine for an association; revisit with pagination if content grows large.
- Re-registering after cancelling deletes the old cancelled row first (members are allowed to delete their own cancelled rows), because one row per person per event is enforced.
- Resource files (`storage_path`) show a "not available yet" note: the storage bucket and signed downloads belong with secure file uploads in Phase 5/7. Link resources work now.

### Outstanding
1. Run the checks above and the manual test list in `docs/SUPABASE_SETUP.md` section 9 plus: edit profile, register/cancel/re-register, full-event waiting list, members-only resource hidden until approved.
2. Certificate files and public verification page (Phase 6).
3. Email notifications for registration and promotion (needs SMTP, Phase 8).
4. Account deletion and data-export requests currently go through the contact page; consider a self-service flow for the Data Protection Act.
5. Items pending from earlier phases: logo file, official content, executive consent, Members Coordinator name, visual review.

---

## Phase 5 — Administration Portal
**Date:** 11 Nov 2026 · **Status:** Built; verified by typecheck, lint and unit tests; awaiting owner review and a live Supabase project

### Objective
Give the executive committee a protected portal to run the association: approve members, publish content, manage events and certificates, and see what is happening. Permissions are enforced by the database; the interface only hides what a role cannot use.

### Completed (all under `/admin`, staff roles only; no new database migrations)
- **Overview:** counts (accounts, pending and approved applications, upcoming events, announcements, event sign-ups, certificates, new messages) and a bar chart of applications by status. Each role sees only the numbers it is allowed to read.
- **Members:** search by name or email, filter by role, paging, current-year membership badge. **Super Administrator only** can change roles (through the existing `set_user_role` function; nobody can change their own).
- **Applications:** filter by status; Chairperson, Membership Coordinator and Super Administrator approve, reject (reason required, shown to the applicant), suspend, expire or reopen. The database issues membership numbers and stamps the reviewer.
- **Events:** create, edit, delete, Nairobi-time pickers, capacity, deadline, visibility. Leadership also sees each event's registrations (registered, waitlisted, cancelled) and marks attendance.
- **Announcements, Learning resources, Publications, Opportunities, Executive committee:** one shared form and list driven by `src/lib/admin/content-config.ts`, so all five behave the same and validate the same way.
- **Certificates:** issue by holder email (optionally linked to an event), revoke with a reason (Super Administrator and Chairperson).
- **Contact messages:** read and mark new / read / replied / spam (Secretary and Super Administrator update).
- **Audit log:** latest 100 entries with who, what and status or role changes, filterable by area; leadership only.
- **Role rules:** `src/lib/auth/permissions.ts` mirrors the SQL policies. A unit test reads the SQL and fails if they drift, and another checks every form field is a real database column.
- Security notes: forms can only write the columns listed in each definition (no `created_by`, `role`, etc.); content is rendered as plain text; links must be http(s); content editors can only save drafts and cannot touch published items; deleting asks for confirmation.

### Tests run
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src tests` | 0 problems |
| Unit tests | **119 passing** across 9 files (17 new). Run with a stand-in runner because the Vitest binary could not start in the build sandbox; please run `npm test`. |

### Not tested (be aware)
- **No page was opened in a browser and nothing ran against Supabase.** Every database query, the Supabase embeds used for names (for example the applicant on a membership), the role-change function call and the permission refusals still need a live check.
- `npm run build` and `npm run test:db` were not run (no network or PostgreSQL in the build sandbox). Phase 5 adds no migrations, but please run both.

### Decisions and trade-offs
- Content types share one generic form instead of five hand-written ones: far less code to maintain and consistent behaviour. A type that later needs special fields (for example file upload) gets its own page.
- Resources are links only for now. Secure file upload and download needs a Supabase Storage bucket with policies, and is better done together in Phase 7 with the upload security review.
- Statistics use plain count queries and CSS bars (no charting library) to keep dependencies minimal. Recharts can be added in Phase 6 for the economic dashboard.
- The Treasurer can read content and certificates but has no financial tools; none exist in the requirements yet.

### Outstanding
1. **The public website still shows sample content** (`src/config/sample-content.ts`). Events, announcements, resources, research, opportunities and committee entries published in the admin portal do not appear on the public pages yet. Connecting them to the database is the next logical piece of work; I suggest doing it before Phase 6.
2. Committee entries are stored with a public-consent flag, but the public About page still uses the website setting `showExecutiveNames`.
3. Secure file uploads (resource files, publication PDFs, officer photos, certificate PDFs).
4. Email notifications (approval, rejection, event reminders, waiting-list promotion).
5. Everything listed as outstanding in Phase 4, and the earlier owner-supplied items (logo, official content, executive consent, Membership Coordinator name).

---

## Phase 6 — Advanced Features
**Date:** 12 Nov 2026 · **Status:** Built; verified by typecheck, lint and unit tests; awaiting owner review and a live Supabase project

### Objective
Add only the advanced features that have a clear purpose, can be maintained by a student committee, and need no outside accounts or invented data.

### Chosen, with reasons
| Feature | Why it is in |
|---|---|
| **Digital certificates with verification** | Certificates are only worth something if a third party (an employer, a lecturer) can check them. Public `/verify` and `/verify/<code>` pages; members can print or save their certificate as a PDF from `/dashboard/certificates/<id>`. |
| **Student research submissions** | Directly serves the "student research" part of the brief and feeds the Research page. Approved members submit at `/dashboard/research`; the committee reviews and publishes in the existing admin Publications screen. |
| **Advanced analytics** | The committee can see membership growth, event attendance and who the members are (year, programme) at `/admin/analytics`, using only data the platform already holds. |
| **Research page now reads the database** | Needed so published student work actually appears. `/research` and `/research/<slug>` show real published work when Supabase is configured, and clearly labelled sample content when it is not. |

### Deliberately not built (and what I need from you)
| Feature | Why not yet |
|---|---|
| Economic intelligence dashboard / interactive economic charts | It needs a trustworthy data source (for example CBK or KNBS series) and a decision about licensing and who keeps it up to date. I will not invent figures. Tell me the indicators you want and where the numbers come from, and I will build it. |
| Newsletter integration | Needs an email service account (Mailchimp, Brevo, Resend...) and your decision on consent wording. |
| Inter-university competitions | Needs your rules: who may enter, team or individual, judging, partner universities. Better designed with the committee than guessed. |

### Completed
- **Verification:** the database function returns status (valid / revoked), title, type, issue date, a masked holder name ("Amina O.") and the event only if it is public. No email, id or revoke reason. Codes are 128-bit random, so they cannot be guessed. Pages are not indexed by search engines and always read the live record.
- **Printing:** a print-only style shows just the certificate on a landscape A4 page, with its verification web address and code. "Save as PDF" in the print window gives a PDF with no extra library. A QR code was left out to avoid a dependency; it is a small addition if wanted.
- **Submissions:** plain text only; the database insists on your own id as author, status "submitted", type student research, an approved membership, never pre-published or pre-reviewed; at most 5 waiting for review (enforced by a trigger so a bulk request cannot exceed it); withdraw until review starts. Published work is shown as plain text, never HTML.
- **Analytics:** one database call returns the numbers (the API only returns 1,000 rows per request, so counting in the app would be wrong for larger data). Charts are plain SVG with a hidden data table for screen readers; no charting library added. Programmes with fewer than 3 members are merged so nobody can be identified. Visible to leadership and the Membership Coordinator only.
- **Migration** `20261113090000_phase6_advanced.sql`: no new tables.

### Tests run
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src tests` | 0 problems |
| Unit tests | **148 passing** across 10 files (29 new: certificate codes, chart scale, analytics parsing, research validation, access rules, and checks on the migration text such as pinned search paths and what visitors may call). Run with a stand-in runner because the Vitest binary could not start in the build sandbox; please run `npm test`. |

### Not tested (be aware)
- **`supabase/tests/t12_phase6.sql` was written but not run** (no PostgreSQL in the build sandbox), and neither was the migration itself. Run `npm run test:db` and report any failure; the earlier `t11` waiting-list test is also unrun.
- **No page was opened in a browser and nothing ran against Supabase.** In particular please check by hand: a certificate verifies and a revoked one says so; print preview looks right; a member submits and withdraws research; staff publish it and it appears on `/research`; the analytics page loads.
- `npm run build` was not run (no network in the build sandbox).

### Outstanding
1. Run the database tests and the manual checks above.
2. **The rest of the public site still shows sample content** (home, events, learning hub, opportunities, about). Research is now live; the same pattern should be applied to the others. Recommended next piece of work before Phase 7.
3. Decisions needed from you for the deferred features above.
4. File uploads (resource files, publication PDFs, officer photos) and email notifications remain open from earlier phases.
5. Earlier owner-supplied items: logo, official content, executive consent, Membership Coordinator name.

---

## Interim change — Master Admin access and visible sessions
**Date:** 12 Nov 2026 · **Requested by the owner during Phase 6 review**

- **Master Admin needs no membership.** Migration `20261114090000_master_admin_access.sql` makes the one database function behind every member-only rule (`private.is_approved_member`) return true for the Super Administrator. That covers members-only announcements, events, resources, event registration and research submission. Other officers are deliberately unchanged (least privilege); extending it is a one-line change if you want it.
- **Status bar.** A slim bar at the top of every page while signed in shows the role (MASTER ADMIN, Treasurer, Chairperson, Member...), the name, links to Administration and the member portal, and Sign out. The header and the floating side menu show "My dashboard" instead of "Member login / Join".
- **Why you kept seeing a login prompt.** The session was being saved, but the site never *showed* it: the header always said "Member login" and `/login` always displayed the form. Both are fixed. The session cookie is now explicit: 400 days, renewed automatically, `Secure` in production.
- **Dashboard for the Master Admin** shows a "Full access" card instead of the membership application.

---

## Phase 7 — Testing and Security Review
**Date:** 12 Nov 2026 · **Status:** Done as far as the build environment allows; awaiting owner review and the manual checks in `docs/TEST_PLAN.md`

### Objective
Find and fix problems before deployment. Full results: `docs/SECURITY_REVIEW.md`. Checklist for what needs a browser or Supabase: `docs/TEST_PLAN.md`.

### How it was applied
Phase 7 was rebuilt as small patches on top of the owner's latest commit (including the KESA affiliation, side dock, landing-page styles and announcement posters). Only the files listed in the hand-over note changed; nothing of the owner's was replaced.

### Completed
- Reviewed all actions, pages, route handlers, clients, proxy and migrations. **11 findings, all fixed or accepted** (see the report). Two stand out: the committed code did not compile (a missing permission, `readAnalytics`, after an older file replaced it), and the Phase 6 chart colours failed accessibility contrast.
- Restored three small Phase 6 pieces that had been lost when local files replaced mine: the analytics permission and menu item, the certificate print rules, and the footer link to the certificate check.
- Hardening: explicit session cookie options, stronger security headers (HSTS, framing/plugin/form restrictions), friendly error pages, `robots.txt`, config guards on the last four actions.
- **New automated tests:** security (secrets, raw HTML, server/client separation, every action, page and route handler checks access, headers, cookies, redirects, SQL safety), quality (links, accessibility basics, error handling, Master Admin) and 10 more colour-contrast pairs.
- Documentation: `SECURITY_REVIEW.md`, `TEST_PLAN.md`; setup guide covers the Master Admin and session settings.

### Tests run
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src tests` | 0 problems |
| Unit tests | **242 passing** across 13 files (includes your poster tests). Run with a stand-in runner because the Vitest binary could not start in the build sandbox; please run `npm test`. |

### Not tested (be aware)
- **Database tests t11, t12, t13 (and the earlier ones) have not been run.** Run `npm run test:db` on Linux or WSL.
- **No browser testing:** responsive layout, keyboard and screen-reader use, Lighthouse performance, real session behaviour across browser restarts, print preview, poster rendering. See `docs/TEST_PLAN.md`.
- `npm run build`, `npm audit`, penetration testing.

### Before deployment (High items from the review)
1. Enable CAPTCHA and review rate limits in Supabase Auth (then the Turnstile widget is added).
2. Set password rules and leaked-password protection in Supabase.
3. Keep email confirmation on.

### Outstanding
Everything under "Open items" in `docs/SECURITY_REVIEW.md`, plus: the rest of the public pages still show sample content; file uploads; email notifications; the owner-supplied items (logo files, official content, executive consent).

---

## Content pass — official wording and live public content
**Date:** 12 Nov 2026 · **Requested by the owner:** write the draft content as the executive committee would, remove anything ambiguous, use the association email as the contact.

### What changed
- **Contact.** The association email, `mkueconclub@gmail.com`, is now the official contact. It is stored once (`contact.email` in `src/config/association.ts`) and shown on the Contact page, the footer, the About page, the Membership page and the Privacy notice. No phone number, office or social link is published, because none has been supplied.
- **Removed as ambiguous:** every "to be supplied", "draft for confirmation", "sample", "placeholder" and "to be announced" notice; the empty About sections (history, objectives, constitution and governance); the Membership "Requirements" section (no eligibility or fee rules have been supplied); the sample events, announcements, resources, publications and opportunities.
- **Rewritten in an official tone** (only what is true of the platform, nothing invented): the Membership benefits and steps, the About page, the Contact page and the Privacy notice (now version 1.0, with a contact for data requests; the line about an unstated hosting region was removed).
- **Executive committee:** the About page now lists the five offices and prints a name only when the owner switches `showExecutiveNames` on (officer consent). It never prints "To be announced".
- **Public pages now show real content.** Events (list and detail), Learning Hub, Opportunities and the home page read what the committee publishes in the admin portal (published and public items only). Sections with nothing to show are left out or show a plain message. Closed opportunities (deadline passed) are hidden automatically.
- **Bug fixed on the way:** the public Research page used publication type names that did not match the database (`analysis` and `association` against `economic_analysis` and `association_publication`), so published economic analyses and association publications would never have appeared. A new test compares the page's categories with the database enums.
- Deleted `src/config/sample-content.ts` and the unused `page-placeholder.tsx`.

### Tests run
| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src tests` | 0 problems |
| Unit tests | **252 passing** across 13 files. New: a test that fails if any placeholder or draft wording returns to a public page, tests that the email lives in one place and appears on the right pages, category-to-database checks, and tests for the list helpers. |

### Not tested (be aware)
- Nothing was viewed in a browser or run against Supabase. Please look at Home, About, Membership, Events, Learning Hub, Opportunities, Contact and Privacy on a phone and a laptop.
- With an empty database the home page now shows only the hero, mission, values and membership steps, and the Events, Learning Hub and Opportunities pages show a short plain message. Publish at least one event, announcement, resource and opportunity in **Administration** to see them filled.

### For the committee to decide (not changed)
1. **Officer names.** Set `showExecutiveNames = true` in `src/config/association.ts` once each officer has agreed in writing to be named. The Membership Coordinator's name has still not been supplied.
2. **Privacy notice.** It now reads as final. Have the university's legal or ICT office confirm it before launch, and add retention periods when decided.
3. **Membership rules.** If there are eligibility rules or fees, send the exact wording and an Requirements section can be added back.
4. **History, objectives and constitution.** Send the official text (or the constitution PDF) and the About page can carry them.


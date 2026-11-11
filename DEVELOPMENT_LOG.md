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
| Unit tests | **102 passing** across all 8 files (16 new: profile validation, event-ID validation, membership and event helper logic). Run with a stand-in runner because the Vitest binary could not start in the build sandbox; please run `npm test` yourself. |

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


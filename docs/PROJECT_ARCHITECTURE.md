# MKUESA Digital Platform — Project Architecture

**Status:** Phases 0-3 approved. Phase 4 (Member portal) built, awaiting review.
**Last updated:** 10 November 2026

> Content marked **[SAMPLE]** or **[TO BE SUPPLIED]** is not official. No association history, names, leadership or contact details are invented anywhere in this project.

---

## 1. Discovery Findings

| Area | Finding |
|---|---|
| Existing project | None. The folder skeleton exists (empty placeholder files and `.gitkeep` folders). No code, no `package.json` content, no git history. |
| Node.js available (build sandbox) | v22.23 (Next.js 16 requires ≥ 20.9). **Your own machine must also run Node ≥ 20.9; Node 22 LTS recommended.** |
| npm / Git | npm 10.9, Git 2.43 |
| Accounts needed | GitHub, Vercel, Supabase, a transactional email provider, a domain registrar (see §7) |

### Structure change from the original skeleton
`src/middleware.ts` → **`src/proxy.ts`**. Next.js 16 renamed the middleware convention to *proxy*. `middleware.ts` still works but is deprecated and will be removed in a future major version. Building on the deprecated name would create avoidable rework. Behaviour is the same; the exported function is named `proxy`.

---

## 2. Technology Stack and Pinned Versions

Versions checked against the npm registry on 10 Nov 2026.

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.4.x | Node.js runtime for `proxy.ts` |
| UI | React | 19.3.x | |
| Language | TypeScript | **5.9.x (pinned)** | TypeScript 7.0 is out, but `typescript-eslint` (used by `eslint-config-next`) only supports `<6.1`. Pinned to avoid a broken lint pipeline. |
| Styling | Tailwind CSS | 4.3.x | via `@tailwindcss/postcss` |
| Lint | ESLint | **9.39.x (pinned)** | ESLint 10 is out, but `eslint-plugin-import`, `-jsx-a11y` and `-react` do not yet declare support. |
| Backend | Supabase (Postgres, Auth, Storage) | `@supabase/supabase-js` 2.119, `@supabase/ssr` 0.12 | `@supabase/ssr` handles cookie-based sessions in Next.js |
| Forms | React Hook Form + Zod | 7.91 / 4.6 (+ `@hookform/resolvers` 7.0) | Same Zod schemas validate on client **and** server |
| Icons | lucide-react | 1.71 | |
| Charts | Recharts | 3.10 | **Installed only in Phase 6**, not before |
| Unit tests | Vitest | 5.x | Phase 1 |
| E2E tests | Playwright | 1.65 | Phase 7 |
| Supabase CLI | supabase | 3.x | dev dependency; runs migrations and local Postgres |

Exact versions are locked by `package-lock.json` at Phase 1. Re-verify peer dependencies when upgrading.

**Not included on purpose:** Redux or other state libraries, a UI kit (shadcn, MUI), an ORM (Prisma/Drizzle), a CMS. The database is accessed through the Supabase client with generated TypeScript types; this keeps the dependency count low.

**One justified addition (Phase 3):** rate limiting. Recommended: Cloudflare Turnstile (free CAPTCHA) on public forms plus `@upstash/ratelimit` for API routes. Supabase Auth has its own built-in limits for sign-in and email flows.

---

## 3. Architecture

```
 Browser
   │
   ▼
 Vercel (Next.js 16)
   ├── proxy.ts ............. session refresh + coarse route gating (UX only, NOT the security boundary)
   ├── Server Components .... read data with the user's own session
   ├── Server Actions / API . validate with Zod, write data, write audit logs
   └── Static assets ........ /public
   │
   ▼
 Supabase
   ├── Auth ................. email/password (+ email verification)
   ├── Postgres ............. tables + Row Level Security  ← the real security boundary
   └── Storage .............. private buckets + storage policies
```

### Security principle (enforces your requirement §4)
**The database decides who can do what.** Route guards and hidden buttons are only convenience. Every table has Row Level Security (RLS). Admin actions are checked by SQL policies and helper functions, so a user who calls the API directly still cannot exceed their role.

- The **anon/public key** is used in the browser. It is safe *only because* RLS is on.
- The **service-role key** bypasses RLS. It is used **only** in server code (never prefixed `NEXT_PUBLIC_`), only for narrow jobs (e.g. writing audit logs, sending certificates), and never committed.
- `proxy.ts` is not enough on its own, because Server Actions are separate endpoints. Every Server Action re-checks the user and role itself.

### Folder responsibilities

| Path | Responsibility |
|---|---|
| `src/app/(public)` | Public pages, no login |
| `src/app/(auth)` | Login, register, reset password |
| `src/app/dashboard` | Member portal (login required) |
| `src/app/admin` | Admin portal (role required) |
| `src/app/api` | Only what Server Actions can't do (webhooks, public form endpoints) |
| `src/components/{ui,layout,public,dashboard,admin}` | Reusable components. `ui` = generic primitives |
| `src/lib/supabase` | Browser / server / admin client factories |
| `src/lib/auth` | `getCurrentUser()`, `requireRole()` helpers |
| `src/lib/database` | Typed query functions (one file per domain) |
| `src/lib/validation` | Zod schemas shared by client and server |
| `src/lib/utils` | Small pure helpers |
| `src/config` | Site constants, navigation, role/permission map |
| `supabase/migrations` | Versioned SQL; the single source of truth for the schema |

---

## 4. Sitemap

### Public (no login)
```
/                          Home
/about                     History, vision & mission, objectives, constitution, leadership
/membership                Information, benefits, requirements → links to /register
/events                    Upcoming & past
/events/[slug]             Event detail + registration
/learning-hub              Economics, finance & investment, academic materials, courses, videos
/learning-hub/[slug]       Resource detail
/research                  Research, articles, analysis, association publications
/research/[slug]           Publication detail
/opportunities             Internships, scholarships, competitions, conferences, careers
/opportunities/[slug]      Opportunity detail
/contact                   Contact info, form, social links
/verify/[code]             Certificate verification (public, minimal data)   ← Phase 6
```

### Authentication
```
/login   /register   /reset-password
```

### Member portal (login required)
```
/dashboard                 Overview: status, announcements, upcoming registered events
/dashboard/profile         Edit profile
/dashboard/membership      Application / status / renewal
/dashboard/events          My registrations & participation
/dashboard/resources       Member-only resources
/dashboard/certificates    My certificates
```

### Admin portal (role required)
```
/admin                     Statistics overview
/admin/members             Members + application approvals
/admin/events              Events & registrations, attendance
/admin/announcements       Announcements
/admin/resources           Learning resources
/admin/research            Publications (+ review queue for student submissions)
/admin/opportunities       Opportunities          ← required by your spec; added to the skeleton
/admin/certificates        Issue / revoke         ← required by your spec; added to the skeleton
/admin/leadership          Executive committee info ← required by your spec; added to the skeleton
/admin/messages            Contact-form inbox     ← added to the skeleton
/admin/audit-logs          Audit trail            ← added to the skeleton
/admin/settings            Roles, site settings
```
> The skeleton you supplied lacked admin routes for opportunities, certificates, leadership, messages and audit logs. Your requirements call for them, so they are added in Phase 1/5. Nothing existing is removed.

---

## 5. Roles and Permissions

Eight roles, stored on `profiles.role`. Legend: **C** create, **R** read, **U** update, **D** delete/archive, **A** approve/publish, **—** none.

| Capability | Super Admin | Chair | Vice Chair | Secretary | Treasurer | Membership Coord. | Content Editor | Member |
|---|---|---|---|---|---|---|---|---|
| Assign roles / site settings | CRUD | — | — | — | — | — | — | — |
| Members & applications | CRUD+A | R+A | R | R | — (stats only) | CRUD+A | — | own profile |
| Events | CRUD | CRUD | CRUD | CRUD | R | R | CRU | R / register |
| Announcements | CRUD | CRUD+A | CRUD | CRUD | R | R | CRU (draft) | R |
| Learning resources | CRUD | CRUD | CRU | CRU | R | R | CRUD | R (member-only incl.) |
| Research & publications | CRUD | CRUD+A | CRU | CRU | R | R | CRUD+A | R / submit (Ph. 6) |
| Opportunities | CRUD | CRUD | CRU | CRU | R | R | CRUD | R |
| Certificates | CRUD | CRUD+A | CR | CR | R | CR | — | own (R) |
| Executive info | CRUD | CRU | R | CRU | R | R | — | R (public) |
| Contact messages | CRUD | R | R | CRU | — | — | — | — |
| Audit logs & statistics | R | R | R | R | — (stats only) | — (stats only) | — | — |

**This matrix is a proposal.** It is a decision for you (see §9). It is implemented once, as a config map plus matching SQL policies, so changing it later is small and safe. Note: the Treasurer has little to do until payments exist; payments are **out of scope** (see Decisions).

---

## 6. Roadmap

Effort: S ≈ a focused session, M ≈ a few sessions, L ≈ many. Each phase ends with testing, documentation and **your approval**.

| Phase | Outcome | Effort |
|---|---|---|
| 0 | This document set | S (done) |
| 1 | Next.js, TS, Tailwind, design tokens, fonts, navbar, footer, UI primitives, `proxy.ts` stub, lint/test setup | M |
| 2 | All 8 public pages with clearly labelled sample content | L |
| 3 | Supabase project, migrations, Auth, profiles, membership applications, roles, RLS, **permission tests** | L |
| 4 | Member dashboard, profile, status, event registration, resources, announcements, certificates | L |
| 5 | Admin portal: members/approvals, content CRUD, certificates, statistics, audit logs | L |
| 6 | Optional: charts, research submissions, certificate verification, newsletter | M each |
| 7 | Responsiveness, accessibility (WCAG AA), RLS and security review, performance | M |
| 8 | GitHub, Vercel, production Supabase, domain, backups, deployment docs | M |

Phase 6 items are only built where they have a clear purpose and an owner to maintain them.

---

## 7. Required Accounts and Configuration

| Item | Purpose | Who | Needed by |
|---|---|---|---|
| GitHub account/org | Version control | Owner | Phase 1 |
| Supabase account | Backend | Owner (as owner of record) | Phase 3 |
| Vercel account | Hosting | Owner | Phase 8 (earlier for previews) |
| Email provider (e.g. Resend, Brevo) | Auth emails, notifications. Supabase's default sender is heavily rate-limited and unsuitable for production | Owner | Phase 3 |
| Cloudflare Turnstile | Free CAPTCHA for forms | Owner | Phase 3 |
| Upstash Redis (free tier) | Rate limiting | Owner | Phase 3 |
| Domain + DNS access | Custom domain | Owner | Phase 8 |
| Local tools | Node 22 LTS, Git, a code editor | Developer | Phase 1 |

**Account ownership:** create accounts under an association-controlled email, not a single student's personal address, with a second administrator. Leadership changes every year; accounts shouldn't leave with a graduate.

---

## 8. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **RLS misconfiguration leaks member data or lets users escalate roles** | Medium | Critical | RLS enabled by default on every table; automated permission tests per role in Phase 3 and 7; `role` column not writable by users |
| R2 | Service-role key exposed | Low | Critical | Server-only env var; never `NEXT_PUBLIC_`; secret scanning on GitHub; rotate if ever exposed |
| R3 | **Kenya Data Protection Act, 2019** compliance gaps (consent, minimisation, retention, cross-border hosting) | Medium | High | Collect minimum data; privacy notice with consent timestamp; retention rules; confirm with the ODPC whether the association/university must register as a data controller. Not legal advice — have the university's legal or ICT office review |
| R4 | Student data processed outside Kenya (Vercel/Supabase servers) | Certain | Medium | Choose the nearest suitable Supabase region at project creation; disclose in the privacy notice; confirm DPA cross-border requirements |
| R5 | **Leadership turnover** — platform becomes unmaintained | High | High | Role-based admin (no shared logins), documentation, accounts under association email, handover checklist in `DEPLOYMENT.md` |
| R6 | Free-tier limits: Supabase free projects pause when inactive, and Vercel's free (Hobby) tier has usage restrictions. Verify the current terms before launch | Medium | Medium | Decide hosting plan before Phase 8; keepalive or paid tier for production |
| R7 | Auth email deliverability and rate limits | High | Medium | Custom SMTP from Phase 3 |
| R8 | Dependency drift: Next.js 16 `proxy` rename, TypeScript 7 and ESLint 10 not yet tool-compatible | Realised | Low | Versions pinned in §2; upgrade deliberately |
| R9 | Spam / abuse on contact and registration forms | High | Low | Turnstile + rate limit + server validation |
| R10 | Misuse of university branding or unofficial content | Medium | Medium | Official branding/approval requested before launch; sample content labelled |
| R11 | Scope creep from Phase 6 | Medium | Medium | Each Phase 6 item needs an owner and a purpose before it starts |
| R12 | File upload abuse (malware, oversized files) | Medium | Medium | Private buckets, MIME/size limits, server-side checks, no public write |

---

## 9. Decisions Requiring Your Approval

My recommendation is stated for each. Where I can decide as technical lead, I already have.

1. **Roles on `profiles.role`** (single role per person) vs a separate roles table. *Recommend single column*: committee members hold one system role; fewer tables, simpler RLS.
2. **Permission matrix in §5.** Please review and adjust.
3. **Sign-in method.** *Recommend email + password with email verification.* Do you want to restrict registration to university email addresses (and which domain)? I will not assume the domain.
4. **Event registration for non-members.** *Recommend: signed-in users only* (members and applicants). Guest registration needs another table and more spam/data-protection work.
5. **Registration number / student ID collection.** Useful for verifying students, but it is personal data. *Recommend: collect it, store it restricted to membership staff, make it optional until you confirm it is needed.*
6. **Payments / membership fees.** *Recommend: out of scope for the first release.* Adds financial and compliance risk (M-Pesa integration, reconciliation). Revisit after launch.
7. **Public leadership page and photos.** Executive names/photos are published only with each person's consent.
8. **Hosting region and plan** (R4, R6).
9. **Phase 1 foundation:** use `create-next-app` inside the existing folder, keeping your structure (see §10).

### Information I need from you (I will not invent any of it)
- Official name and any acronym usage (MKUESA = Mount Kenya University Economics Students Association).
- Official logo and brand guidelines, or confirmation that the colour palette in your brief is final.
- Executive committee names, positions, and consent to publish.
- Constitution and membership requirements.
- Official contact details and social media links.
- Intended domain name.
- Whether MKU's Student Affairs or ICT office must approve the site or branding.

---

## 10. Exact Next Steps for Phase 1 (after you approve)

1. Confirm Node ≥ 20.9 on your machine (`node -v`).
2. Scaffold Next.js 16 + TypeScript + Tailwind 4 + ESLint into the existing folder without overwriting the structure.
3. Pin TypeScript 5.9.x and ESLint 9.39.x; commit `package-lock.json`.
4. Add design tokens from your palette (Navy `#101B2D`, Gold `#D5AF64`, Forest Green `#1F7558`, Ivory `#F4F0E7`, Slate `#667085`) and check colour contrast against WCAG AA. Gold-on-ivory text will not pass for body copy; gold is reserved for accents and large text.
5. Choose and load typography (a serif display face plus a clean sans for body; proposed in Phase 1).
6. Build the responsive navbar, footer, `layout.tsx`, `not-found.tsx`, and base UI primitives (Button, Container, Section, Card, Input).
7. Add the Vitest harness and an initial smoke test; run lint, type-check and build.
8. Update `DEVELOPMENT_LOG.md`, then present for your review.


---

## 11. Owner Decisions Recorded (10 Nov 2026)

The owner approved all recommended answers in §9, and chose the **brand-led palette** (Option 1):
single role per person · email + password with verification · signed-in-only event registration · optional, restricted registration number · no payments in v1 · executive names/photos public only with consent.

Still outstanding from the owner: university-email domain restriction (if any), hosting region/plan, official contact details and social links, constitution and membership requirements, domain name, Members Coordinator name, high-resolution logo (SVG or transparent PNG), MKU approval requirements, and written consent from each executive to publish their name.

## 12. Design System (Phase 1)

Tokens live in `src/app/globals.css` (`@theme`) and are the single source of truth. Brand purple `#9006BF` and orange `#E26716` were sampled from the supplied logo.

| Token family | Use |
|---|---|
| `brand-50…950` (purple) | Primary actions, links, dark sections (`brand-950`) |
| `accent-100…800` (orange) | Accents and fills with **dark ink text**. Never orange text on light backgrounds (3.4:1, fails AA); use `accent-700` for text |
| `ivory`, `paper`, `ink`, `muted`, `slate` | Page background, cards, body text, secondary text. `muted` (not `slate`) is used for secondary text on ivory |
| Fonts | Newsreader (display, serif) + Public Sans (body), self-hosted via Fontsource so no request goes to Google |

`tests/contrast.test.ts` reads the tokens and fails the build if any UI colour pair drops below WCAG AA (22 pairs checked).

## 13. Content Rules (Phase 2)

- **Official content** lives only in `src/config/association.ts` (mission, vision, core values, executive committee).
- **Sample content** lives only in `src/config/sample-content.ts`. Every item is typed `sample: true`, and each page shows a "Sample content" badge or notice. Tests enforce this.
- **Missing official information** (history, objectives, constitution, membership requirements, contact details, social links) is shown as a dashed **"To be supplied"** notice. Nothing is invented.
- **Executive names** are hidden until `showExecutiveNames` is set to `true` (consent decision from Phase 0).
- Detail pages for resources, publications and opportunities are deferred to Phases 3-5, when real database content exists. Event detail pages (`/events/[slug]`) are built because registration depends on them.

## 14. Phase 3 Decisions and Deviations

- **Supabase account** is owned by `mkueconclub@gmail.com` (association-controlled, per Phase 0 advice).
- **Registration accepts any email address** (owner decision). Spam protection relies on mandatory email confirmation and Supabase's built-in rate limits.
- **Treasurer** sees no individual member data (data minimisation); aggregate statistics arrive in Phase 5.
- **React Hook Form was not installed.** Server Actions with Zod validation and native form attributes cover every form so far. Reconsider in Phase 5 if forms grow complex.
- **Turnstile and Upstash were deferred to Phase 7.** The contact form is protected by a hidden honeypot plus database throttling, which needs no extra accounts. Reconsider if abuse appears.
- **Key naming:** Supabase now issues *publishable* keys (`sb_publishable_...`) in place of the legacy anon key. The code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

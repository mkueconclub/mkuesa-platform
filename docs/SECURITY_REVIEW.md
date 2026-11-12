# Security and Quality Review (Phase 7)

**Scope:** the whole codebase as of Phase 7, reviewed by reading the code and by automated tests that run on every `npm test`.
**Not covered by this review (needs your environment):** a live browser, a live Supabase project, load testing, penetration testing. Section 5 lists exactly what to run and check.

## 1. Method
1. Read every Server Action, route handler, proxy, auth helper, Supabase client and all database migrations.
2. Added automated checks (`tests/security.test.ts`, `tests/quality.test.ts`, extended `tests/contrast.test.ts`) so the same problems cannot return unnoticed. 242 unit tests pass across 13 files.
3. Fixed every finding rated Critical or High, and the Medium findings that were cheap to fix.

## 2. Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | High | **Chart colours failed accessibility contrast.** The lighter bars in the Phase 6 analytics charts were 2.6:1 against the card (WCAG needs 3:1 for graphics). Also the horizontal bars against their track were 1.6:1. | Fixed. Darker palette; 6 new contrast tests |
| 2 | Medium | **Four actions crashed instead of answering** when Supabase keys were missing (password reset request, password update, membership application, contact form). The sign-in and sign-up actions had been fixed earlier. | Fixed |
| 3 | Medium | **Session cookie had no explicit security settings.** Library defaults applied. | Fixed. Now `Secure` in production, `SameSite=Lax`, 400-day lifetime, one shared definition used by browser, server and proxy clients; tests enforce it |
| 4 | Medium | **Security headers incomplete.** No HSTS, no framing/plugin/form-target restrictions. | Fixed. Added HSTS (1 year, this host only), a safe Content-Security-Policy subset (`frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`), COOP, cross-domain policy block |
| 5 | Medium | **No error pages.** An unexpected failure showed the framework default. | Fixed. Friendly `error.tsx` and `global-error.tsx` that never print technical details |
| 6 | Low | **No `robots.txt`.** Private areas were only protected by login. | Fixed. `/admin`, `/dashboard`, `/verify`, `/login`, `/register`, `/auth` disallowed |
| 7 | Low | Member search sanitiser lived inside a page file and could not be unit-tested. | Fixed. Moved to `lib/admin/search.ts`; tested against filter-injection strings |
| 8 | Low | A signed-in person who opened `/login` saw the login form again, and the header always said "Member login", which made it look as if the session was lost. | Fixed. Redirect when signed in (no loop when an error is shown); status bar and header now reflect the session |
| 10 | High (repo health) | **The committed code did not compile.** `can.readAnalytics` was missing from `permissions.ts` (an older local copy had replaced the file), so `/admin/analytics` and one test failed typechecking. Two other small pieces were also lost the same way: the certificate print rules in `globals.css` and the *Verify a certificate* footer link. | Fixed. Restored without touching the poster feature, the landing-page styles or the footer affiliation |
| 11 | Info | **Announcement poster download** (`/admin/announcements/[id]/poster`, added by the owner) was reviewed: requires the Chairperson or Treasurer role, the signature always comes from the signed-in officer's own name and title, the file name is reduced to letters, digits and hyphens (no header injection), responses are `private, no-store`. | Sound. Two tests added so any future route handler must check the caller's role |
| 9 | Info | Session cookie is readable by JavaScript. This is how `@supabase/ssr` keeps sessions fresh in the browser. It is acceptable only because the app never renders untrusted HTML. | Accepted, guarded by test: no `dangerouslySetInnerHTML`, `innerHTML`, `eval` anywhere; all user content is rendered as plain text |

### Open items (not fixed in code; need a decision or your environment)
| # | Severity | Item | What to do |
|---|---|---|---|
| A | **High, before launch** | **Sign-in and sign-up rate limiting and bot protection.** The app relies on Supabase Auth's built-in limits. | In Supabase: **Authentication > Attack Protection > enable CAPTCHA (Cloudflare Turnstile)**; review **Rate Limits**. Then tell me and I will add the Turnstile widget to the forms (needs your site key) |
| B | **High, before launch** | **Leaked-password protection and password rules.** | Supabase **Authentication > Sign In / Providers > Password**: minimum length 10, require letters and digits, and enable leaked-password protection if your plan has it (Pro) |
| C | Medium | **Full Content-Security-Policy for scripts and styles** needs per-request nonces and a real browser test; a wrong policy blanks the site. | Do in Phase 8 on the Vercel preview deployment, starting in report-only mode |
| D | Medium | **File uploads are not built** (resource files, publication PDFs, officer photos). There is nothing to attack yet, but when they are added they need: private bucket, size and type limits, server-side type check (not the file extension), random file names, signed download links. | Design together before building |
| E | Medium | **Email confirmation must stay on** in Supabase (Authentication > Sign In / Providers > Email > Confirm email). The Master Admin role depends on the registered address being owned by the person. | Verify before launch |
| F | Low | `npm audit` and dependency updates could not be run offline. | Run `npm audit` and keep `next`, `react`, `@supabase/*` current |
| G | Low | Password longer than 72 **bytes** (not characters) is rejected by Supabase; a password made of many accented or emoji characters could pass our 72-character check and fail later with a generic message. | Cosmetic; can be tightened |

## 3. What was verified as sound
- **No secrets in source.** No service-role or secret key anywhere; only the publishable key reaches the browser; `.env.local` is git-ignored; `.env.example` holds no values. (Automated test.)
- **Access control is enforced by the database**, not the interface: every table has Row Level Security; visitors can only read published public content; members cannot write role, email or status columns; staff powers follow a single role matrix that a test compares with the SQL.
- **Every Server Action checks who is calling**, and every admin action also checks the role. Every dashboard and admin page re-checks access itself, not just the layout. (Automated tests.)
- **Mass assignment is not possible.** Admin forms write only the columns listed in each content definition; member forms write only their own five profile fields or their own research fields.
- **Injection.** Database access goes through the Supabase query builder (parameterised); the one place a search string enters a filter is sanitised and tested; no raw SQL from the app.
- **Open redirects.** `next` parameters are restricted to same-site paths (tested against 20+ attack strings).
- **Information leaks.** Login failure messages do not reveal whether an email exists; the public certificate check returns a masked name and no email, id or revoke reason; analytics merge small groups.
- **Cross-site request forgery.** Server Actions use Next.js origin checking, and the cookie is `SameSite=Lax`.
- **Audit trail.** Important admin changes are written by database triggers and cannot be edited from the website.
- **Throttling.** The contact form is limited in the database (3 per email per hour, 30 per hour overall).

## 4. The Master Admin change (requested during Phase 7)
- The database function behind every member-only rule now returns true for the Super Administrator (migration `20261114090000_master_admin_access.sql`). It names only `super_admin`, which a test enforces. Other officers are unchanged.
- This is a deliberate widening of one account's power. The protection is that the role can only be given by an existing Super Administrator or with direct database access, and that confirmed email is required to register. Use a strong, unique password and, when your plan allows, multi-factor authentication for that account.
- The Master Admin still cannot change their own role (to prevent accidental lock-out).

## 5. Manual checks for you (I could not run these)
See `docs/TEST_PLAN.md` for the full checklist. The ones that matter most before launch: the database tests (`npm run test:db` in WSL or Linux), a walk through each role, the responsive check at phone width, a keyboard-only pass, and a Lighthouse run.

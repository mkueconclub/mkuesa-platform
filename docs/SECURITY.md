# MKUESA Digital Platform — Security

**Status:** Updated in Phase 3. Formal review in Phase 7.

## Principles
1. **The database is the security boundary.** Row Level Security on every table; UI hiding is only a convenience.
2. **Least privilege.** Eight roles; each gets only what it needs (see `PROJECT_ARCHITECTURE.md` §5).
3. **Secrets never reach the browser or GitHub.** Only `NEXT_PUBLIC_SUPABASE_URL` and the anon key are public. The service-role key is server-only.
4. **Validate on the server.** Zod schemas are shared, but the server always re-validates.
5. **Re-check inside every Server Action.** `proxy.ts` gating is not sufficient.
6. **Audit what matters.** Approvals, role changes, publishing, certificate issue/revoke, deletions.
7. **Collect less.** Kenya Data Protection Act, 2019: minimisation, consent, retention.

## Planned controls
| Area | Control | Phase |
|---|---|---|
| Authentication | Supabase Auth, email verification, password reset, strong password policy | 3 |
| Authorisation | RLS + role helper functions; role column not user-writable | 3 |
| Rate limiting | Supabase Auth limits, Turnstile, Upstash on public endpoints | 3 |
| Uploads | Private buckets, MIME/size allow-list, server-side checks | 4–5 |
| Headers | CSP, HSTS, X-Content-Type-Options, Referrer-Policy via `next.config.ts` | 1 / 7 |
| Dependencies | Pinned versions, `npm audit`, GitHub Dependabot and secret scanning | 1, 8 |
| Backups | Supabase backups + periodic export | 8 |

## Secret handling rules
- `.env.local` is git-ignored and never shared in chat, email or screenshots.
- `.env.example` lists variable **names only**.
- If a key is ever exposed, rotate it immediately in the Supabase dashboard.

## Findings log
| Date | Finding | Severity | Status |
|---|---|---|---|
| 2026-11-10 | `middleware.ts` deprecated in Next.js 16; auth gating moved to `proxy.ts` | Low | Resolved in skeleton |

## Implemented in Phase 3

| Control | How | Verified by |
|---|---|---|
| Row Level Security on all 12 tables, default deny | Migration 3 | `t01_structure`: RLS on every table, every table has a policy |
| Least-privilege grants | Everything revoked from `anon`/`authenticated`, then granted per table and per column | `t01`: no write privileges for anon; no truncate/trigger/references |
| Role escalation blocked | Column privileges + RLS + trigger; only `set_user_role` by Super Admin | `t03`, `t05` (and a deliberate-break check showing the trigger still holds if a privilege is mis-granted) |
| Sign-up cannot grant roles or skip consent | Trigger reads a whitelist of metadata keys; refuses without consent | `t02` |
| Contact form abuse | Honeypot, validation, 3/email/hour and 30/hour limits in the database | `t09` |
| Audit log tamper-proof | Trigger-written; no client insert/update/delete | `t10` |
| Internal functions not callable by users | `private` schema, execute revoked | `t01`, `t10` |
| SECURITY DEFINER functions pin `search_path` | All of them | `t01` |
| Open-redirect protection on login `next` | `safeNext()` allows only same-site relative paths | `tests/redirect.test.ts` |
| No account enumeration | Identical response for registered and unregistered emails on sign-up and password reset | By design (not testable without a live project) |
| Server-side route gating | `/admin` layout calls `requireRole`; role read from the database, not from the token | Live server: signed-out requests redirect to login |
| Passwords | 10-72 characters; hashing and breach handling by Supabase Auth | Validation tests |

## Not yet covered
- Content Security Policy (Phase 7).
- CAPTCHA on registration and contact (deferred; add if abuse appears).
- Leaked-password protection is a paid Supabase feature; not available on the free plan.
- Live end-to-end sign-up, confirmation email and login against a real Supabase project: **requires the account to be created** (`docs/SUPABASE_SETUP.md`). Until then these flows are tested only up to the Supabase boundary.

## Findings log (additions)
| Date | Finding | Severity | Status |
|---|---|---|---|
| 2026-11-10 | `private.purge_old_contact_messages()` was created after the privilege lock-down, so any signed-in user could execute it (it deletes only messages older than 12 months). Caught by the permission tests | Medium | Fixed in migration 4; guard test added so any new private function left open fails the build |

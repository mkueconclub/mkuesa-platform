# MKUESA Digital Platform — Security

**Status:** Phase 0 baseline. Expanded in Phases 3 and 7.

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

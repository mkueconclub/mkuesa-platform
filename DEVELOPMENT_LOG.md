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

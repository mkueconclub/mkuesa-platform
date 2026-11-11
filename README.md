# MKUESA Digital Platform

Official digital platform for the **Mount Kenya University Economics Students Association (MKUESA)**: a public website, member portal and administration dashboard.

**Current status:** Phase 3 (database and authentication) built and tested; awaiting owner review and Supabase project creation. Public pages use official mission, vision and values plus clearly labelled sample content.

## Planned stack
Next.js 16 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel · GitHub

## Documentation
| File | Contents |
|---|---|
| `docs/PROJECT_ARCHITECTURE.md` | Architecture, sitemap, roles, roadmap, risks, decisions |
| `docs/DATABASE_SCHEMA.md` | Database design and RLS approach |
| `docs/SECURITY.md` | Security principles and controls |
| `docs/SUPABASE_SETUP.md` | **Step-by-step Supabase setup** |
| `docs/DEPLOYMENT.md` | Deployment plan (completed in Phase 8) |
| `DEVELOPMENT_LOG.md` | Record of completed and pending work |

## Requirements
- Node.js **≥ 20.9** (22 LTS recommended)
- npm 10+
- Git

## Getting started
```bash
npm install                  # installs pinned dependencies
cp .env.example .env.local   # fill in Supabase values: see docs/SUPABASE_SETUP.md
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest (validation, redirects, roles, navigation, contrast, content) |
| `npm run test:db` | Database security tests on a local PostgreSQL (Linux/macOS/WSL) |

## Security
Never commit `.env.local` or any secret. Only variable *names* belong in `.env.example`.

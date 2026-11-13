# MKUESA Member Dashboard Upgrade

This is a focused overlay update for the existing MKUESA Next.js project.

## Install
1. Back up your current project or commit your work to Git.
2. Extract this ZIP into the project root (the directory containing `package.json`).
3. Allow the three included files to overwrite their existing counterparts.
4. Run `npm run typecheck`, `npm run lint`, and `npm run build` in your project environment.

## Updated files
- `src/app/dashboard/page.tsx` — refreshed member overview, live membership/event/certificate stats, shortcuts, upcoming events and announcements.
- `src/app/dashboard/layout.tsx` — premium responsive member workspace shell and profile sidebar.
- `src/components/layout/portal-nav.tsx` — refined active states and navigation styling shared with the portal navigation component.

No database schema, Supabase query, authentication rule, or member permission has been changed. Existing page routes and server-side data retrieval remain in place.

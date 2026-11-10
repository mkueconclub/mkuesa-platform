# MKUESA Digital Platform — Deployment

**Status:** Placeholder. Completed in Phase 8.

## Targets
- Source: GitHub (private repository)
- Hosting: Vercel (preview deployments per branch, production from `main`)
- Backend: Supabase (separate **development** and **production** projects)

## Environment variables (names only)
See `.env.example`. Production values are stored in Vercel and Supabase, never in the repository.

## Phase 8 checklist (to be completed)
- [ ] Private GitHub repo, branch protection on `main`
- [ ] Production Supabase project and region chosen
- [ ] Migrations applied to production via Supabase CLI
- [ ] Custom SMTP configured and tested
- [ ] Vercel project linked; env vars set for Preview and Production
- [ ] Custom domain + DNS + HTTPS verified
- [ ] Backup and restore tested
- [ ] Admin accounts created; Super Admin has a second holder
- [ ] **Handover checklist** for each leadership change (transfer account ownership, rotate keys, review admin roles)

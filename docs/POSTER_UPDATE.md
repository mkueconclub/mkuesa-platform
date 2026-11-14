# Poster update: share announcements, events and opportunities on social media

Every administrator can now turn an **announcement, event or opportunity** into a branded MKUESA poster,
signed with their own name and title, in the right size for each platform.

## How to use it
1. Open **Administration → Announcements / Events / Opportunities** and click the item (or click **Poster** in the list).
2. Scroll to **Share as a poster** and pick a size. **Preview** opens it in a new tab, **Download** saves the PNG.

| Size | Pixels | Use for |
|---|---|---|
| Portrait 4:5 | 1080 × 1350 | Instagram feed, WhatsApp groups, Facebook and LinkedIn posts |
| Story 9:16 | 1080 × 1920 | WhatsApp Status, Instagram and Facebook Stories |
| Square 1:1 | 1080 × 1080 | Instagram, WhatsApp, LinkedIn, Facebook |
| Landscape 16:9 | 1600 × 900 | X (Twitter), LinkedIn link posts |
| Official A4 | 1240 × 1754 | Printing, noticeboards, email (the original poster, now with details and seal) |

## What is on a poster
- MKUESA logo, name and "Economists Unite", in the brand purple and orange.
- A label (Official Announcement, Upcoming Event, Career Opportunity ...), the title and a short excerpt of the text.
- **Events:** date, time (Nairobi), venue, registration deadline. **Opportunities:** organisation, type, location, deadline.
- A link line (for example `yoursite/events/careers-panel`) so people know where to register.
- A signature card: the downloader's name in handwriting style with a flourish, their printed name and office, an
  "Official MKUESA" seal, a reference number (MKUESA/EVT/2026/A1B2C3) and the date it was signed.
- Unpublished items carry a faint DRAFT mark. Members-only items show a reminder before you share them publicly.

## Who can download
Every staff role (Super Administrator, Chairperson, Vice Chairperson, Secretary, Treasurer, Membership Coordinator,
Content Editor). The signature always comes from the signed-in person's account; the request cannot change it.
To restrict it again, edit `posterSignerRoles` in `src/lib/auth/permissions.ts`.

## Files
New: `src/lib/poster/handler.ts`, `src/lib/poster/source.ts`, `src/components/admin/poster-card.tsx`,
`src/app/admin/events/[id]/poster/route.ts`, `src/app/admin/opportunities/[id]/poster/route.ts`.
Changed: `src/lib/poster/layout.ts`, `src/lib/poster/poster.tsx`, `src/app/admin/announcements/[id]/poster/route.ts`,
`src/lib/auth/permissions.ts`, `src/components/admin/content-pages.tsx`, `next.config.ts`,
`tests/poster.test.ts`, `tests/security.test.ts`.
No database change and no new packages.

## Checks run
`tsc --noEmit`: 0 errors. `next build`: succeeds. `tests/poster.test.ts`: 36 passing (every size, with typical,
worst-case and draft content). `eslint`: no errors. The full suite has 14 failing tests that fail the same way on the
repository before this change (alumni and Google sign-in code that the older tests do not cover yet); none are poster related.
Not tested: real Supabase data and a browser; I rendered sample posters only.

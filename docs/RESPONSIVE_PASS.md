# Responsive pass (13 Nov 2026)

Goal: public site, member portal, admin and alumni portal work on phones (320px+), tablets and large screens.

## What changed
- **Member + admin navigation** (`components/layout/portal-nav.tsx`, new): on phones and tablets it is one menu button that shows the current section and opens a grid of links; from `lg` it is the sidebar. Replaces the long sideways-scrolling tab strip.
- **Admin / member sidebar** no longer gets cut off on short laptop screens (it scrolls inside itself when taller than the window). Buttons sit in a tidy two-column row on phones.
- **Alumni portal**: compact top block on phones (user card hidden below `sm`, buttons in one row), sidebar scrolls on short screens, content capped at a readable width on ultra-wide monitors, Alumni Connect tabs fit narrow screens.
- **Header**: logo text truncates instead of pushing the menu button off a 320px screen; the mobile menu scrolls when taller than the screen (landscape phones) and uses two columns from `sm`.
- **Side dock** (desktop floating menu) now starts collapsed on 1280-1535px screens so it does not cover page content; it still opens by itself from 1536px, and the toggle works as before.
- **Home page**: hero heading steps down on very small phones; quick-link cards are one column below 460px.
- **Footer**: two-column link groups on phones, three on tablets; email address wraps.
- **Sign-in / register card**: less padding on small phones.
- **Tables** (admin lists, audit log, event registrations): scroll sideways inside their box with edge shadows that show there is more.
- **Touch targets**: "Mark attended" is 44px tall on phones.
- **Global CSS**: no accidental sideways page scroll, long words/emails wrap, images never exceed their box, no tap delay on links/buttons, anchors stop below the sticky header.

## Checked
`tsc --noEmit`: 0 errors. `eslint`: 0 errors (8 old warnings in `alumni/ui.tsx`, untouched). `next build`: succeeds.
`vitest`: the same 14 tests fail before and after this change (they were already failing on the repository as received).

## Not checked
Nothing was opened in a real browser or against Supabase. Please look at Home, the admin menu and a table, the member menu, the alumni portal, and the footer on a phone (or browser devtools at 360px and 768px) and a laptop.

# Test Plan (Phase 7)

Legend: ✅ automated and passing in `npm test` · 🔶 needs you (browser or Supabase) · ⛔ not applicable yet

## 1. Automated (run `npm test`)
| Area | What is checked | State |
|---|---|---|
| Validation | Registration, login, profile, research, contact, content forms, dates, links, tags | ✅ |
| Roles and permissions | Permission table equals the SQL policies; each role sees the right sections; Master Admin shortcut limited to one role | ✅ |
| Security | No secrets, no raw HTML, safe links, server/client separation, every action and page checks access, headers, cookie settings, redirect and search sanitising, SQL safety rules | ✅ |
| Navigation | Every fixed internal link points to a page that exists | ✅ |
| Accessibility (static) | One main heading per page, labelled form controls, alt text, language, skip link, 40+ colour-contrast pairs | ✅ |
| Error handling | Friendly error and not-found pages, nothing technical shown | ✅ |

## 2. Database tests (run `npm run test:db` on Linux or WSL; see the earlier instructions) 🔶
`t01` structure and privileges · `t02` sign-up · `t03` to `t10` roles, memberships, content, registrations, certificates · `t11` waiting list · `t12` Phase 6 · `t13` Master Admin.
Expect `0 test files failed`. Send me any `FAIL` lines.

## 3. Walk through each role 🔶
Create one test account per role (set roles from Administration > Members). For each, check the status bar shows the right title and that this matrix holds:

| Role | Can open | Must NOT be able to |
|---|---|---|
| Member (approved) | Dashboard, resources, events, research | Open /admin (sent back to dashboard) |
| Member (no application) | Dashboard, public content | See members-only resources or register for members-only events |
| Content Editor | Content lists; create **drafts** of announcements | Publish an announcement; see Members, Certificates, Audit |
| Treasurer | Overview, content lists (read only), Certificates (read) | Edit anything; see Members or Messages |
| Membership Coordinator | Members, Applications, Analytics | Publish content; change roles |
| Secretary | Content, Messages (update), Members (read) | Approve applications; change roles |
| Chairperson | Approve applications, revoke certificates, audit | Change roles |
| Master Admin | Everything; no membership needed | Change own role |

## 4. Authentication and session 🔶
- [ ] Register, confirm by email, sign in
- [ ] Close the browser, reopen the site: still signed in; the top bar shows your role
- [ ] Open /login while signed in: you are sent on to the dashboard
- [ ] Sign out from the top bar: bar disappears at once; /dashboard sends you to login
- [ ] Wrong password shows a generic message; an unconfirmed account shows the confirm-email message
- [ ] Password reset email arrives and works

## 5. Responsive (use browser developer tools, device toolbar) 🔶
Check at **360 px, 768 px, 1280 px** on: home, events, research, login, dashboard (all tabs), admin overview, admin members, one admin form, certificate print preview, verify page.
- [ ] No sideways scrolling; tables scroll inside their box
- [ ] Menus and tabs reachable; buttons at least 44 px tall
- [ ] Top status bar wraps cleanly on a phone

## 6. Accessibility (manual) 🔶
- [ ] Keyboard only: Tab through the home page, login, a dashboard form and an admin form; focus is always visible and never trapped
- [ ] Screen reader (NVDA on Windows is free): headings list makes sense; form errors are announced; charts have a readable data table
- [ ] Zoom the browser to 200% and 400%: nothing is cut off
- [ ] Run Lighthouse Accessibility on 5 key pages: aim for 95+

## 7. Performance 🔶
- [ ] `npm run build` completes without errors or warnings
- [ ] Lighthouse Performance on home, events and research (mobile): aim for 85+; note anything below 70 for me
- [ ] Public research and verify pages read live data on every visit (intended); check they feel quick

## 8. File uploads ⛔
Not built yet. See SECURITY_REVIEW.md item D before adding any.

## 9. Penetration checks (simple, you can do these) 🔶
- [ ] While signed out, open /admin, /dashboard, /admin/members: redirected to login
- [ ] As a plain member, open /admin and /admin/audit: sent to the dashboard
- [ ] In the browser address bar try `/login?next=https://example.com`: after login you stay on this site
- [ ] Contact form: submit 4 messages with one email within an hour: the 4th is refused
- [ ] Certificate check with a made-up code: "No certificate found", never an error page
- [ ] Look at the browser's Network tab on any page: no request carries a secret key

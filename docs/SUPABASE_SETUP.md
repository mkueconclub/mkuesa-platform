# Supabase Setup Guide (Phase 3)

Follow these steps in order. Steps 1-2 need you (accounts cannot be created for you). **Never paste the database password or any secret key into chat, email or GitHub.**

Time needed: about 45 minutes.

---

## 1. Create the Supabase account
1. Go to **supabase.com** → **Start your project** → sign up with **mkueconclub@gmail.com** (email and password, not a personal GitHub login, so the account belongs to the association).
2. Confirm the email, then turn on **two-factor authentication** (account menu → Account preferences → Security).
3. Create an **organization** named `MKUESA` (Free plan).
4. Add a second administrator later (Organization → Team) so the account survives leadership changes.

## 2. Create the project
1. **New project** → name `mkuesa-platform`.
2. **Database password:** click *Generate a password*, then save it in a password manager. You will rarely need it.
3. **Region:** choose the closest to Kenya. If *Africa (Cape Town)* is offered, pick it; otherwise pick a European region. Write down which one you chose (the privacy notice must state it).
4. Wait about two minutes for the project to start.

## 3. Connect the website to it
1. Open **Project Settings → API Keys** (or the **Connect** button at the top).
2. Copy the **Project URL** and the **Publishable key** (`sb_publishable_...`). If no publishable key exists, click *Create new API keys*.
3. In the project folder, copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
4. Do **not** copy the *secret* key anywhere. The website does not need it yet.

## 4. Create the database
Open **SQL Editor → New query**. For each file below, in this order: open it on your computer, copy everything, paste, click **Run**, and wait for *Success*:

1. `supabase/migrations/20261110090000_schema.sql`
2. `supabase/migrations/20261110090100_helpers_and_triggers.sql`
3. `supabase/migrations/20261110090200_rls_and_privileges.sql`
4. `supabase/migrations/20261110090300_public_functions.sql`
5. `supabase/migrations/20261111090000_auth_trigger_grants.sql`
6. `supabase/migrations/20261112090000_waitlist_promotion.sql`
7. `supabase/migrations/20261113090000_phase6_advanced.sql`

If any file shows an error, **stop and send me the exact message** before running anything again.

Check: **Table Editor** should list 12 tables (profiles, memberships, announcements, events, …) and each should show an **RLS enabled** badge.

> Later, once comfortable, you can use the Supabase CLI instead (`npx supabase login`, `npx supabase link`, `npx supabase db push`), which also tracks which migrations have run.

## 5. Sign-in settings
**Authentication → Sign In / Providers → Email**
- Email provider: **on**
- **Confirm email: on** (the site relies on this)
- Minimum password length: **10**

**Authentication → URL Configuration**
- Site URL: `http://localhost:3000` (change to the real domain at launch)
- Redirect URLs: add `http://localhost:3000/**`

## 6. Email templates (required)
**Authentication → Email Templates.** Replace the link in each template so it goes through the website:

*Confirm sign up*
```html
<h2>Confirm your email</h2>
<p>Welcome to MKUESA. <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Confirm your email address</a></p>
```
*Reset password*
```html
<h2>Reset your password</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/update">Choose a new password</a></p>
<p>If you did not ask for this, ignore this email.</p>
```

## 7. Outgoing email (required before students can register)
Supabase's built-in email sender only delivers to your own team members, so students would never receive confirmation emails.

**Authentication → Emails → SMTP Settings → Enable custom SMTP.** Simplest free option for a pilot, using the association Gmail:
1. In the Google account for mkueconclub@gmail.com turn on **2-Step Verification**, then create an **App password** (Google Account → Security → App passwords).
2. Fill in: Host `smtp.gmail.com` · Port `465` · Username `mkueconclub@gmail.com` · Password: the 16-character app password · Sender email `mkueconclub@gmail.com` · Sender name `MKUESA`.
3. Gmail allows roughly 500 emails a day, which is enough for a pilot. Once the association has a domain, move to a dedicated sender (Brevo or Resend).

## 8. Make yourself Super Administrator
1. Run the site (`npm run dev`), open `/register` and create **your own account**. Open the confirmation email and click the link.
2. In **SQL Editor** run (put your registered email in):
   ```sql
   update public.profiles set role = 'super_admin' where lower(email) = lower('YOUR-REGISTERED-EMAIL');
   ```
3. Sign in and open `/admin`; it should show your name and "Super Administrator".
4. Other officers: after they register, assign roles the same way (`'chairperson'`, `'vice_chairperson'`, `'secretary'`, `'treasurer'`, `'membership_coordinator'`, `'content_editor'`). A role-management screen arrives in Phase 5.

## 9. Check that it works
- [ ] Register a second test account → confirmation email arrives → link opens the dashboard
- [ ] Dashboard shows *Apply for 2026/2027* → submit → status shows **pending**
- [ ] `/admin` as that test account bounces back to the dashboard
- [ ] `/admin` as you shows the pending-applications count
- [ ] Reset-password email arrives and the new password works
- [ ] `/contact` message appears in Table Editor → `contact_messages`
- [ ] Approve the test application: Table Editor → `memberships` → set `status` to `approved`; the dashboard shows the membership number

## 10. Keep safe
- Turn on 2FA for Supabase, GitHub and Gmail.
- Share project access by adding people to the organization, never by sharing the password.
- Free projects are **paused after a period of inactivity** (about a week at the time of writing; verify). Visit the site weekly during development, and decide the production plan before launch.
- If a secret key ever leaks, rotate it immediately (Project Settings → API Keys).

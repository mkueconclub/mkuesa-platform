# Executive profiles and direct messages

**What it does**

1. The Chairperson, Secretary or Super Administrator creates a committee entry as before (**Administration > Committee**).
2. **Only the Super Administrator approves it.** On the entry, under **Approval**, choose the officer's account and press *Approve officer*. The account must already have an officer role (give it under Members first).
3. The officer signs in, opens **My officer profile** and adds their **contact email** (and may edit their bio). Until they do, their card on the About page is shown but cannot be opened.
4. On **About > Executive committee** the card becomes a link. The profile page (`/about/executives/<id>`) shows the officer's name, position, bio and email, and a message form.
5. The message goes to **that officer only**. They read it in **My inbox**, reply by email, and mark it Replied, Spam, or delete it.

**Privacy and security**

- The officer's email is public on their profile; the form tells them so.
- Messages can be read only by the officer they were sent to (database policy). Not even the Super Administrator or other officers can read them.
- Visitors write through `submit_executive_message()` only: 3 messages per sender address, 5 per officer, 60 overall per hour, plus a hidden honeypot field.
- Approval and account linking are enforced in the database (trigger `guard_executive_entry`), not only in the interface. Withdrawing approval hides the officer and stops messages immediately.
- The old "consented to publication" tick box in the committee form is gone: approval is done on the Approval card. `showExecutiveNames` in `src/config/association.ts` now only affects offices that have no approved officer yet.

**To deploy**

1. Run the new migration `supabase/migrations/20261116090000_executive_profiles.sql` (`supabase db push`).
2. Approve each officer (step 2 above).

**Not included (deliberately)**

- No email is sent to the officer when a message arrives: the project has no email service yet. Messages appear in My inbox. When email delivery is added, hook it to inserts on `executive_messages`.
- Messages older than 12 months can be purged with `private.purge_old_executive_messages()`; schedule it with the other purge job.

**Tests**: `tests/executive.test.ts` (17 unit tests) and `supabase/tests/t14_executive_profiles.sql` (37 database assertions, all passing).

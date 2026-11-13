# MKUESA landing page refresh

This is an overlay patch for the existing MKUESA Next.js project. It redesigns the public landing page and refines the shared public navigation without changing authentication, Supabase policies, database schema, member pages, or admin pages.

## Files included

- `src/app/(public)/page.tsx` — redesigned public homepage, responsive sections, clear calls to action, page metadata, and existing MKUESA mission, vision and values.
- `src/components/layout/site-header.tsx` — refined sticky header, responsive navigation breakpoint and mobile menu styling.
- `src/components/layout/side-dock.tsx` — aligns the desktop side dock with the large-screen navigation breakpoint.
- `src/app/globals.css` — landing-page background and grid treatment.
- `public/images/mkuesa-student-collaboration.webp` — locally hosted generated hero image, optimised as WebP.

## Apply the patch

1. Make a backup or commit your current project before replacing files.
2. Extract this ZIP into the project root — the folder containing `package.json` — and allow the files to merge/overwrite.
3. Install dependencies if needed:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and check the homepage at mobile, tablet, laptop and wide-desktop widths.

## Important content note

The repository's existing announcement, event and learning-resource records are sample placeholders. The homepage continues to label these as sample/illustrative content rather than presenting them as confirmed association activities. Replace them with approved live content before launch.

## Validation note

The changed TSX files were syntax-parsed successfully. A full Next.js build, lint run and browser/device visual test were not completed in this environment because dependency installation did not finish. Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` locally after applying the patch.

# IMPLEMENTATION_STATUS.md

Legend: `[x]` completed and tested, `[~]` done with caveats, `[ ]` not started.
Details live in `AI_HANDOFF.md`. Update both after every checkpoint.

- [~] CP0 baseline: `npm run build` PASSES; `npm run lint` FAILS with 2 pre-existing errors
      (`react-hooks/set-state-in-effect` in `src/pages/Home.jsx:13` and `src/pages/ListTrip.jsx:22`).
      Owner decision: leave them for the CP3/CP4 rewrites.
- [x] CP1 Supabase schema: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example` written and verified on a local
      PostgreSQL 16 (tables, FKs, defaults, checks, RLS, anon read/insert allowed, anon update/delete refused, seed = 10 trips,
      re-runnable). Now also verified against the REAL hosted Supabase project by the owner: `schema.sql` ran successfully in
      the SQL Editor; `seed.sql` ran successfully; the seed verification query returned 10 rows and 7 columns (10 seeded trips
      present); a test INSERT into `public.trips` succeeded. The test insert was run only in the SQL Editor, is not part of
      `supabase/seed.sql`, and changed no source files. Not recorded as checked live: the RLS policy list, a `ride_requests` insert,
      and access through the anon key / API (the latter happens when CP3 is tested).
- [x] CP2 API/data layer: COMPLETE (CP2.1 `src/lib/supabase.js`, CP2.2 `src/lib/identity.js`, CP2.3 `src/lib/api.js`,
      CP2.4 `@supabase/supabase-js` added to `package.json` / `package-lock.json`). Verified locally by the owner:
      `npm run build` passes; `npm run lint` shows only the same 2 pre-existing errors; committed as `a7f1fd4 Add Supabase API layer`;
      working tree clean. Caveat: the API functions are not recorded as exercised against a real Supabase project yet, and no
      page uses them (CP3 does).
- [ ] CP3 Supabase trip reads
- [ ] CP4 trip creation
- [ ] CP5 ride requests
- [ ] CP6 driver inbox
- [ ] CP7 deployment
- [ ] CP8 optional polish

Current state: CP1 is fully verified (local PostgreSQL and the real hosted Supabase project). CP2 is complete and committed
locally (`a7f1fd4`). CP3 has NOT started. The React pages still use local/browser data for trips (`localStorage` plus
`src/data/trips.js`), so the demo flow (A lists -> B finds -> B requests -> A sees) is NOT working yet. The next checkpoint is CP3
(waiting for the owner's approval).

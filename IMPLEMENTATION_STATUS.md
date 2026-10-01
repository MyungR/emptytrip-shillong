# IMPLEMENTATION_STATUS.md

Legend: `[x]` completed and tested, `[~]` done with caveats, `[ ]` not started.
Details live in `AI_HANDOFF.md`. Update both after every checkpoint.

- [~] CP0 baseline: `npm run build` PASSES; `npm run lint` FAILS with 2 pre-existing errors
      (`react-hooks/set-state-in-effect` in `src/pages/Home.jsx:13` and `src/pages/ListTrip.jsx:22`).
      Owner decision: leave them; they are intentionally deferred to the CP4/CP5 rewrites of ListTrip and Home. CP3 only touched
      `FindRide.jsx`, so both errors remain (confirmed after CP3: lint shows exactly these 2).
- [x] CP1 Supabase schema: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example` written and verified on a local
      PostgreSQL 16 (tables, FKs, defaults, checks, RLS, anon read/insert allowed, anon update/delete refused, seed = 10 trips,
      re-runnable). Now also verified against the REAL hosted Supabase project by the owner: `schema.sql` ran successfully in
      the SQL Editor; `seed.sql` ran successfully; the seed verification query returned 10 rows and 7 columns (10 seeded trips
      present); a test INSERT into `public.trips` succeeded. The test insert was run only in the SQL Editor, is not part of
      `supabase/seed.sql`, and changed no source files. Not recorded as checked live: the RLS policy list and a `ride_requests`
      insert. Reads through the anon key / API were later confirmed live by the CP3 `/find` test.
- [x] CP2 API/data layer: COMPLETE (CP2.1 `src/lib/supabase.js`, CP2.2 `src/lib/identity.js`, CP2.3 `src/lib/api.js`,
      CP2.4 `@supabase/supabase-js` added to `package.json` / `package-lock.json`). Verified locally by the owner:
      `npm run build` passes; `npm run lint` shows only the same 2 pre-existing errors; committed as `a7f1fd4 Add Supabase API layer`;
      working tree clean. Caveat: of the API functions, only `listTrips()` is confirmed against the real Supabase project (via the
      CP3 `/find` test). `createTrip`, `createRequest` and `listRequestsForDriver` have not been exercised live yet (CP4-CP6).
- [x] CP3 Supabase trip reads: COMPLETE. `src/pages/FindRide.jsx` now imports `listTrips` from `src/lib/api.js`; `handleSearch()` is
      async and calls `await listTrips()` instead of merging the static `trips` array with `localStorage["emptyTripListings"]`.
      The existing filters (from/to, max fare, min seats, min rating) are unchanged. Added a `loading` state (search button is
      disabled and shows "Searching...") and an `error` state (Supabase read errors are shown in an inline alert; a failed search
      is not shown as "No return trips found"). `confirmRequest()`, `emptyTripRequests`, the cards, modal and map are unchanged.
      Verified by the owner: live `/find` search works against the hosted Supabase database; `npm run build` passes;
      `npm run lint` shows exactly the 2 known pre-existing errors (`Home.jsx:13`, `ListTrip.jsx:22`). Committed as
      `eaa0746 Read trips from Supabase on Find Ride`; working tree clean. Only `FindRide.jsx` changed. Scope note: Home and
      ListTrip still read trips from `localStorage`/static data (CP4/CP5), so a trip listed on `/list` does NOT appear on `/find` yet.
- [ ] CP4 trip creation
- [ ] CP5 ride requests
- [ ] CP6 driver inbox
- [ ] CP7 deployment
- [ ] CP8 optional polish

Current state: CP1 is fully verified (local PostgreSQL and the real hosted Supabase project). CP2 is complete (`a7f1fd4`).
CP3 is complete (`eaa0746`): `/find` reads trips from Supabase. CP4 has NOT started. `/list` (ListTrip) still saves trips to
`localStorage["emptyTripListings"]`, and Home still reads static trips plus local listings and `emptyTripRequests`; request
writing (`confirmRequest`) is still local. The demo flow (A lists -> B finds -> B requests -> A sees) is therefore NOT working
yet: step 1 (a listing visible to other browsers) needs CP4. The next checkpoint is CP4 (waiting for the owner's approval).

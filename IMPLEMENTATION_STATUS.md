# IMPLEMENTATION_STATUS.md

Legend: `[x]` completed and tested, `[~]` done with caveats, `[ ]` not started.
Details live in `AI_HANDOFF.md`. Update both after every checkpoint.

- [~] CP0 baseline: `npm run build` PASSES (baseline); `npm run lint` had 2 pre-existing errors (`react-hooks/set-state-in-effect` in
      `src/pages/Home.jsx:13` and `src/pages/ListTrip.jsx:22`). Owner decision: leave them; they were intentionally deferred to the CP4/CP5
      rewrites of ListTrip and Home. CP3 only touched `FindRide.jsx`, so both remained after CP3. CP4-B rewrote `ListTrip.jsx`, which removed
      the `ListTrip.jsx:22` error. As reported by the owner, exactly 1 pre-existing lint error remains: `src/pages/Home.jsx:13`
      (`react-hooks/set-state-in-effect`, `setMyRequests(requestedTrips)`). It stays deferred to the CP5 rewrite of Home, so CP0 remains `[~]`.
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
      working tree clean. Caveat at CP2 time: nothing used the layer yet. Since then `listTrips()` was confirmed live (CP3 `/find` test), and `createTrip()` and
      `listMyTrips()` (added in CP4-A) were confirmed live in the CP4 tests. `createRequest` and `listRequestsForDriver` have not been exercised
      live yet (CP5/CP6).
- [x] CP3 Supabase trip reads: COMPLETE. `src/pages/FindRide.jsx` now imports `listTrips` from `src/lib/api.js`; `handleSearch()` is
      async and calls `await listTrips()` instead of merging the static `trips` array with `localStorage["emptyTripListings"]`.
      The existing filters (from/to, max fare, min seats, min rating) are unchanged. Added a `loading` state (search button is
      disabled and shows "Searching...") and an `error` state (Supabase read errors are shown in an inline alert; a failed search
      is not shown as "No return trips found"). `confirmRequest()`, `emptyTripRequests`, the cards, modal and map are unchanged.
      Verified by the owner: live `/find` search works against the hosted Supabase database; `npm run build` passes;
      `npm run lint` shows exactly the 2 known pre-existing errors (`Home.jsx:13`, `ListTrip.jsx:22`). Committed as
      `eaa0746 Read trips from Supabase on Find Ride`; working tree clean. Only `FindRide.jsx` changed. Scope note at CP3 time: Home and
      ListTrip still read trips from `localStorage`/static data, so a trip listed on `/list` did NOT appear on `/find` yet (resolved by CP4).
- [x] CP4 trip creation: COMPLETE, in two steps.
      CP4-A: added `listMyTrips()` to `src/lib/api.js` (returns the trips whose driver key matches this browser's driver key, newest first).
      Committed as `bf9befb Add driver trip listing API`.
      CP4-B: migrated `src/pages/ListTrip.jsx` from `localStorage` to Supabase. It now imports `createTrip` and `listMyTrips` from
      `src/lib/api.js`; the old `emptyTripListings` localStorage flow was removed from this file; existing UI/styling preserved.
      `createTrip()` inserts the trip into Supabase; "Your Listed Trips" now loads from `listMyTrips()`. Added loading/saving/error states:
      the submit button is disabled and shows "Listing..." while saving, and the form is cleared only after a successful Supabase insert.
      Committed as `7673e15 Migrate trip listing to Supabase`.
      Functional testing by the owner (local Vite server only; LAN access from a phone): (1) created a new trip successfully;
      (2) it appeared under "Your Listed Trips"; (3) it remained after a full page refresh; (4) it appeared in Find Ride; (5) the same trip was
      visible from a separate phone/browser reaching the local Vite server over the LAN, confirming the data is shared through Supabase and
      not browser `localStorage`. Not deployed publicly; not pushed to GitHub. Only `src/lib/api.js` (CP4-A) and `src/pages/ListTrip.jsx`
      (CP4-B) were changed for the code. Not covered by these tests: request creation and the driver inbox (CP5/CP6).
- [ ] CP5 ride requests
- [ ] CP6 driver inbox
- [ ] CP7 deployment
- [ ] CP8 optional polish

Current state: CP1 is fully verified (local PostgreSQL and the real hosted Supabase project). CP2 is complete (`a7f1fd4`).
CP3 is complete (`eaa0746`): `/find` reads trips from Supabase. CP4 is complete (`bf9befb` CP4-A, `7673e15` CP4-B): `/list` creates trips in
Supabase and loads "Your Listed Trips" from Supabase, and a listed trip is visible from another device (tested locally over the LAN).
Working tree was clean after `7673e15`; the local branch is 8 commits ahead of `origin/main` (nothing has been pushed).
Still local-only: request creation (`confirmRequest` in `FindRide.jsx` still saves ids to `localStorage["emptyTripRequests"]`) and
Home ("Your Requests" still reads `emptyTripRequests` and `localStorage["emptyTripListings"]`). There is no driver page yet. The demo flow
(A lists -> B finds -> B requests -> A sees) is therefore still NOT fully working: steps 1-2 work through Supabase; steps 3-4 need CP5
and CP6. CP5 has NOT started and is waiting for the owner's approval.

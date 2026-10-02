# IMPLEMENTATION_STATUS.md

Legend: `[x]` completed and tested, `[~]` done with caveats, `[ ]` not started.
Details live in `AI_HANDOFF.md`. Update both after every checkpoint.

- [x] CP0 baseline: `npm run build` PASSES (baseline); `npm run lint` had 2 pre-existing errors (`react-hooks/set-state-in-effect` in
      `src/pages/Home.jsx:13` and `src/pages/ListTrip.jsx:22`). Owner decision: leave them; they were intentionally deferred to the CP4/CP5
      rewrites of ListTrip and Home. CP3 only touched `FindRide.jsx`, so both remained after CP3. CP4-B rewrote `ListTrip.jsx`, which removed
      the `ListTrip.jsx:22` error. CP5-C rewrote `Home.jsx`, which removed the `Home.jsx:13` error. The owner reported `npm run build` passing and
      `npm run lint` with 0 errors after CP5-D. CP0 was `[~]` while those errors remained; it is now `[x]`.
- [x] CP1 Supabase schema: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example` written and verified on a local
      PostgreSQL 16 (tables, FKs, defaults, checks, RLS, anon read/insert allowed, anon update/delete refused, seed = 10 trips,
      re-runnable). Now also verified against the REAL hosted Supabase project by the owner: `schema.sql` ran successfully in
      the SQL Editor; `seed.sql` ran successfully; the seed verification query returned 10 rows and 7 columns (10 seeded trips
      present); a test INSERT into `public.trips` succeeded. The test insert was run only in the SQL Editor, is not part of
      `supabase/seed.sql`, and changed no source files. Reads through the anon key / API were later confirmed live by the CP3 `/find` test, and
      `ride_requests` inserts by the CP5-B test. The dashboard policy list check was not recorded. CP1 originally refused all anon UPDATEs; CP5-E later added one status-only UPDATE (see CP5).
- [x] CP2 API/data layer: COMPLETE (CP2.1 `src/lib/supabase.js`, CP2.2 `src/lib/identity.js`, CP2.3 `src/lib/api.js`,
      CP2.4 `@supabase/supabase-js` added to `package.json` / `package-lock.json`). Verified locally by the owner:
      `npm run build` passes; `npm run lint` shows only the same 2 pre-existing errors; committed as `a7f1fd4 Add Supabase API layer`;
      working tree clean. Caveat at CP2 time: nothing used the layer yet. Since then `listTrips()` was confirmed live (CP3 `/find` test), `createTrip()` and
      `listMyTrips()` (added in CP4-A) in the CP4 tests, and `createRequest()` (CP5-B), `listRequestsForDriver()` (CP5-D) in the CP5 tests.
      `listMyRequests()` (CP5-C), `updateRequestStatus()` and `listAcceptedSeats()` (CP5-E) were added to the same file later.
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
- [x] CP5 ride requests: COMPLETE (CP5-A to CP5-E, live-tested as described below). CP5-E is NOT committed yet.
      CP5-A: inspection/planning only; the existing request flow was inspected and the migration scope approved (no code).
      CP5-B (`847e56c Migrate ride requests to Supabase`): `src/pages/FindRide.jsx` creates requests through `createRequest()`; the modal collects
      passenger name, phone and seats requested; async submit with loading/error handling; no `localStorage`/`sessionStorage` request writing left in FindRide.
      Live test passed: a passenger submitted a request from another device/browser and saw `✓ Request Sent`.
      CP5-C (`6ef0351 Add passenger request lookup`): added `listMyRequests()` to `src/lib/api.js`; `src/pages/Home.jsx` loads "Your Requests" from
      Supabase and shows the status from the database. Live test passed: after submitting on the phone, refreshing Home showed the request. Home's old lint error was removed.
      CP5-D (`e1b05be Add driver ride requests inbox`): `src/pages/ListTrip.jsx` loads `listRequestsForDriver()` and shows a "Ride Requests" section (route,
      passenger name, phone, seats requested, status); no Accept/Decline yet. Live two-device test passed (Driver A listed on a phone, Passenger B requested on a desktop,
      Driver A refreshed `/list` and saw the request). `npm run build` and `npm run lint` (0 errors) passed after CP5-D; working tree clean.
      CP5-E (code present, NOT committed, no hash): added `updateRequestStatus(requestId, status)` (only `accepted`/`declined`, only on `pending` requests, scoped to
      trips with this browser's `driver_key`) and `listAcceptedSeats()` to `src/lib/api.js`. `/list` shows Accept/Decline for pending requests ("Accepting..." /
      "Declining..." while updating; UI updates on success; error shown on failure). `FindRide` computes available seats from accepted requests in Supabase and the request
      modal blocks requesting more seats than are available. Seat rules: pending = 0 seats, declined = 0, accepted = actual `seats_requested`, accepted requests are summed, never below 0.
      Supabase RLS: the live project lacked UPDATE permission on `ride_requests`; this SQL was run successfully in the real SQL Editor (`Success. No rows returned`) and
      written into `supabase/schema.sql`: `revoke update on public.ride_requests from anon, authenticated; grant update (status) on public.ride_requests to anon, authenticated;`
      then `drop policy if exists "ride_requests_update_status" ...; create policy "ride_requests_update_status" on public.ride_requests for update to anon, authenticated
      using (status = 'pending') with check (status in ('accepted', 'declined'));`.
      Live Accept test passed: the driver saw a pending request for 2 seats, clicked Accept and saw `Status: Accepted`; the passenger saw `Accepted`; Find Ride then showed
      `Seats available 0` for that trip. The same implementation supports Decline, but the documented live test was the Accept path only. Build/lint results for CP5-E were not reported.
      SECURITY: there is no real authentication. `driver_key` / `passenger_key` are random browser-local ids, not trusted identities, so the RLS policy cannot prove the caller is the real
      driver; the `driver_key` scoping in `updateRequestStatus()` is application-side only. Demo-grade security, not production-grade authorization.
- [ ] CP6 driver inbox: NOT started. There is still no separate `/driver` page; the driver request inbox (with Accept/Decline) currently lives in `/list`.
- [ ] CP7 deployment
- [ ] CP8 optional polish

Current state: CP0 to CP5 are complete (CP0 `[x]` since the lint errors are gone). CP1 verified on local PostgreSQL and the real hosted Supabase project. CP2 `a7f1fd4`. CP3 `eaa0746`.
CP4 `bf9befb` + `7673e15`. CP5-B `847e56c`, CP5-C `6ef0351`, CP5-D `e1b05be`. CP5-E is implemented and live-tested for Accept, but NOT committed (no hash yet).
The demo flow now works through Supabase (tested by the owner locally, phone + desktop; not deployed): driver lists a trip on `/list` -> passenger finds it on `/find` -> passenger requests it
(name, phone, seats) -> driver sees the request in the `/list` "Ride Requests" inbox -> driver accepts or declines -> passenger sees the status on Home -> accepted seats reduce the seats shown on `/find`.
CP6 has NOT started (no separate `/driver` page). Known limitations after CP5-E: no real authentication (browser-local `driver_key`/`passenger_key` are not trusted identities, so the status-update
policy is demo-grade and the `driver_key` filter is not a security boundary); no realtime/polling (data refreshes when fetched; Find Ride accepted-seat data refreshes on search); seat capacity is not checked
in the database (concurrent requests could overbook, and accepting is not checked against remaining seats); the passenger `requested` state in Find Ride is in-memory only; duplicate requests are not
prevented; the duplicate destination map marker remains. Details are in `AI_HANDOFF.md` section 11.

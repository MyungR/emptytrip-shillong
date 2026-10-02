# AI_HANDOFF.md

Last updated: after CP5-E (ride requests, passenger lookup, driver inbox and accept/decline all run through Supabase). CP5-E is NOT committed yet. Update this file after every checkpoint.

> Work so far was done in a sandbox clone of the public GitHub repo (base commit `2fc1301`,
> "EmptyTrip Shillong prototype"). The owner keeps the real local repo and copies files across.
> If the local repo differs from `2fc1301`, verify before continuing.

## 1. Project purpose and intended demo flow

EmptyTrip Shillong matches taxis returning empty from places around Shillong (Meghalaya, India) with passengers
heading the same way. It is a competition prototype (about 3 days were left when CP1 was written).

Required demo flow (across two browsers or devices):
1. Browser A: driver lists a return trip (`/list`).
2. Browser B: passenger searches the same route (`/find`) and sees the trip.
3. Browser B: passenger requests the ride.
4. Browser A: driver sees the passenger request. Today this is the "Ride Requests" inbox on `/list`; a separate `/driver` page has NOT been built.
5. (Added by CP5-E) Browser A: driver accepts or declines the request; Browser B: the passenger sees the new status on Home.

**Status: this flow now works end to end through Supabase (demo-grade), tested locally by the owner; it is not deployed.**
- Steps 1-2: after CP3 `/find` searches the trips stored in Supabase, and after CP4 `/list` saves trips to Supabase, so a listed trip is shared
  between browsers/devices (tested including a phone reaching the local Vite server over the LAN).
- Step 3 (CP5-B): `/find` creates the request in Supabase (passenger name, phone and seats requested are collected).
- Step 4 (CP5-D): the driver sees the request in the "Ride Requests" section of `/list`, tested across a phone and a desktop.
- Step 5 (CP5-E): Accept/Decline on `/list` changes the request status in Supabase; Home shows the status; accepted requests reduce the seats
  shown on `/find`. The Accept path was live-tested; the Decline path uses the same code but was not the documented live test (section 7).
- There is no real authentication (section 11 describes the limits). Nothing refreshes automatically (no realtime or polling).

## 2. Current architecture

- Frontend only: React 19 + Vite 8, JavaScript/JSX, npm, `react-router-dom` 7 (`BrowserRouter`).
- Routes (`src/App.jsx`): `/` Home, `/find` FindRide, `/list` ListTrip. There is still no separate `/driver` page; the driver request inbox lives in `/list`.
- Styling: mostly inline `style` objects plus global classes in `src/index.css` / `src/App.css`.
- Maps: `react-leaflet` in the FindRide request modal only.
- No auth (no Supabase Auth). All page data now goes through `src/lib/api.js` to Supabase: `/find` reads trips and accepted-seat totals and creates ride requests
  (CP3, CP5-B, CP5-E); `/list` creates trips, loads "Your Listed Trips", shows the driver's "Ride Requests" inbox and accepts/declines requests (CP4, CP5-D, CP5-E);
  Home loads the passenger's own requests with their status (CP5-C). No page persists trip or request data in `localStorage` or `sessionStorage` any more;
  `localStorage` is used only by `src/lib/identity.js` for the browser-local driver/passenger keys.

Architecture: Supabase (Postgres + `@supabase/supabase-js`) called directly from the frontend through a small data layer
in `src/lib/` (built in CP2). `FindRide` uses it since CP3, `ListTrip` since CP4, and `Home` since CP5-C. Pages must only call `src/lib/api.js`, never the client
directly. Existing frontend structure stays.

## 3. Important files and what they do

| File | Purpose |
|---|---|
| `index.html` | Entry HTML. Loads Inter font and Leaflet CSS from CDNs. Mounts `/src/main.jsx`. |
| `src/main.jsx` | React root, `StrictMode`, imports `index.css`. |
| `src/App.jsx` | Router, inline `Navbar` and `Footer`, three routes. |
| `src/pages/Home.jsx` (about 330 lines after CP5-C) | Landing page. CP5-C: "Your Requests" is loaded from Supabase with `listMyRequests()` (this browser's passenger key) in a `useEffect` with cancel handling and an inline error. Each request shows route, driver, departure, vehicle and the status from the database (`pending` / `accepted` / `declined`, via a small `requestStatusLabel` helper). It loads once on page load (no realtime/polling). No `localStorage`. The old `setMyRequests` lint error was removed by this rewrite. |
| `src/pages/ListTrip.jsx` (about 380 lines after CP5-E) | Driver page. Imports `createTrip`, `listMyTrips`, `listRequestsForDriver`, `updateRequestStatus` from `src/lib/api.js`. CP4-B: submit calls `await createTrip(form)`; "Your Listed Trips" loads from `listMyTrips()`; saving/error states (button disabled and "Listing..." while saving; form cleared only after a successful insert). CP5-D: a "Ride Requests" section from `listRequestsForDriver()` shows route, passenger name, phone, seats requested and status. CP5-E: pending requests show Accept and Decline buttons ("Accepting..." / "Declining..." while updating; all buttons disabled while one update runs; the status updates in the page on success; a failed update shows an inline error under that request; no buttons once a request is not pending). No `localStorage`. |
| `src/pages/FindRide.jsx` (about 484 lines after CP5-E) | Route search (from/to, max fare, min seats, min rating), results, request modal with Leaflet map. CP3: `handleSearch()` reads trips with `listTrips()`. CP5-B: the modal collects passenger name, phone and seats requested; `confirmRequest` is async, validates, calls `createRequest()` and has loading/error handling; no `localStorage`/`sessionStorage` request persistence. CP5-E: `handleSearch()` also loads `listAcceptedSeats()` (in parallel); available seats = trip seats minus accepted seats, never below 0; the modal blocks requesting more seats than are currently available. The `requested` list that drives "Request Sent" is in-memory component state only. |
| `src/data/trips.js` (173 lines) | Exports `locations` (8 names), `locationCoords` (name -> [lat,lng]), `trips` (10 seed trips, ids 1-10, all to Shillong). UNCHANGED; stays as reference data. |
| `src/index.css`, `src/App.css` | Global styles (classes: `page`, `section`, `card`, `btn`, `btn-primary`, `field-input`, `ride-card` ...). |
| `src/assets/*`, `public/*` | `hero.jpg` is used by Home; `react.svg`, `vite.svg`, `hero.png`, `icons.svg` are Vite template leftovers. |
| `vite.config.js`, `eslint.config.js` | Standard Vite React config; ESLint 10 flat config with react-hooks and react-refresh. |
| `.gitignore` | Ignores `node_modules`, `dist`, and `*.local` (so `.env.local` is ignored; `.env.example` is NOT ignored). |
| `supabase/schema.sql` | NEW (CP1). Tables, constraints, indexes, grants, RLS policies. Run first. CP5-E added the `ride_requests` status-only UPDATE grant and policy and the security-limitation comment (section 4). |
| `supabase/seed.sql` | NEW (CP1). Inserts the 10 seed trips with ids 1-10. Run second. |
| `.env.example` | NEW (CP1). Variable names only, no values. |
| `src/lib/supabase.js` | NEW (CP2). Exports `supabase` (`createClient` with the two `VITE_` variables; auth session persistence off). Throws a clear error at import if either variable is missing. |
| `src/lib/identity.js` | NEW (CP2). Exports `getDriverKey()` and `getPassengerKey()`: random per-browser ids (`drv_...` / `pax_...`) created on first call and stored in `localStorage` (`emptyTripDriverKey`, `emptyTripPassengerKey`); in-memory fallback if storage is blocked. Not authentication. |
| `src/lib/api.js` | NEW (CP2). The only module that talks to Supabase. See the API summary below. |

## 4. Supabase tables/schema created so far

**Written as SQL files (CP1) and now run in the real hosted Supabase project by the owner** (`schema.sql`, then `seed.sql`; 10 seeded trips confirmed; see section 15).

### `public.trips`
| Column | Type | Null | Default / constraint | Frontend name / note |
|---|---|---|---|---|
| `id` | bigint | no | identity BY DEFAULT, PK | `trip.id` (seeds keep 1-10; new trips get 11+) |
| `driver` | text | no | | `trip.driver` |
| `phone` | text | no | | `trip.phone` |
| `from_location` | text | no | | `trip.from` (SQL reserved word, so renamed; API layer maps back) |
| `to_location` | text | no | | `trip.to` (same) |
| `date` | date | yes | | ListTrip only; seeds null |
| `departure` | text | no | | text on purpose: seeds "4:30 PM", ListTrip "16:30" |
| `seats` | integer | no | check > 0 | `trip.seats` |
| `vehicle` | text | no | | `trip.vehicle` |
| `fare` | integer | no | check >= 0 | `trip.fare` (rupees per person) |
| `notes` | text | yes | | ListTrip only |
| `rating` | numeric(2,1) | yes | check 0..5 | seeds only |
| `pickup` | text | yes | | seeds only |
| `driver_key` | text | yes | | NEW: random per-browser id; null for seeds; not authentication |
| `created_at` | timestamptz | no | now() | NEW |

Indexes: `trips_route_idx (from_location, to_location)`, `trips_driver_key_idx (driver_key)`.
`fromCoords` / `toCoords` are NOT stored; the frontend derives them from `locationCoords` (they match seeds exactly).

### `public.ride_requests` (all new)
| Column | Type | Null | Default / constraint |
|---|---|---|---|
| `id` | bigint | no | identity BY DEFAULT, PK |
| `trip_id` | bigint | no | FK -> `trips(id)` ON DELETE CASCADE |
| `passenger_name` | text | no | |
| `passenger_phone` | text | no | |
| `seats_requested` | integer | no | default 1, check >= 1 |
| `status` | text | no | default `'pending'`, check in (`pending`,`accepted`,`declined`) |
| `passenger_key` | text | no | random per-browser id (for Home "Your Requests") |
| `created_at` | timestamptz | no | now() |

Indexes: `ride_requests_trip_idx (trip_id)`, `ride_requests_passenger_idx (passenger_key)`.

### API layer summary (`src/lib/api.js`, CP2; `listMyTrips()` CP4-A; `listMyRequests()` CP5-C; `updateRequestStatus()` and `listAcceptedSeats()` CP5-E)
All functions are async and throw an `Error` on a Supabase error (callers must try/catch).
- `listTrips()` -> all trips ordered by `id` ascending, each mapped to the frontend shape: `id, driver, phone, from, to, date,
  departure, seats, vehicle, fare, notes, rating, pickup`, plus `fromCoords`/`toCoords` (from `locationCoords`), `driverKey`, `createdAt`.
- `listMyTrips()` (CP4-A) -> the trips whose `driver_key` equals this browser's driver key (`getDriverKey()`), newest first, mapped to the
  same frontend trip shape as `listTrips()`. Used by `ListTrip` for "Your Listed Trips".
- `createTrip(form)` -> takes the ListTrip form shape (`driver, phone, from, to, date, departure, seats, vehicle, fare, notes`);
  converts `seats`/`fare` to numbers, empty `date`/`notes` to null, attaches `getDriverKey()`; returns the saved trip (mapped).
- `createRequest({ tripId, passengerName, passengerPhone, seatsRequested = 1 })` -> attaches `getPassengerKey()`; returns the saved
  request `{ id, tripId, passengerName, passengerPhone, seatsRequested, status, createdAt }`.
- `listRequestsForDriver()` -> requests for trips whose `driver_key` equals this browser's driver key, newest first, each with a
  `trip` field (mapped trip). Uses an embedded `trips!inner(*)` select.
- `listMyRequests()` (CP5-C) -> requests whose `passenger_key` equals this browser's passenger key (`getPassengerKey()`), newest first, each with a `trip` field
  (mapped trip). Used by Home "Your Requests". Embedded `trips!inner(*)` select.
- `updateRequestStatus(requestId, status)` (CP5-E) -> only accepts `'accepted'` or `'declined'` (throws otherwise). It first reads the ids of the trips whose `driver_key` equals
  this browser's driver key, then updates `ride_requests` where `id` matches, `status = 'pending'` and `trip_id` is in those ids. Returns the updated request with its `trip`;
  throws "Request not found, not yours, or already answered" if nothing matched. The driver-key scoping is application-side filtering, not a security boundary (see Privileges and RLS).
- `listAcceptedSeats()` (CP5-E) -> `{ [tripId]: seats }`, the sum of `seats_requested` of requests with status `accepted`, per trip. Pending and declined requests count as 0 seats.
  Used by Find Ride to compute seats left.

### Privileges and RLS
- RLS enabled on both tables.
- `grant select, insert` on both tables to `anon, authenticated` (plus `usage` on schema `public`).
- Policies (all `to anon, authenticated`): `trips_select_all` (select, true), `trips_insert_all` (insert, true),
  `ride_requests_select_all` (select, true), `ride_requests_insert_all` (insert, true).
- **CP5-E: one UPDATE exception.** `ride_requests` has a column-level `grant update (status)` to `anon, authenticated` and the policy `ride_requests_update_status`
  (`for update to anon, authenticated using (status = 'pending') with check (status in ('accepted', 'declined'))`). So the only permitted update is
  `ride_requests.status` from `pending` to `accepted` or `declined`; other columns cannot be changed, a request cannot be set back to `pending`, and an answered
  request cannot be changed again. The policy list is now five (the four above plus this one).
- **Still no DELETE grants/policies on either table, and no UPDATE grant/policy on `trips`.**
- The live Supabase project initially lacked UPDATE permission on `ride_requests`; the SQL below was run successfully in the real Supabase SQL Editor (result: `Success. No rows returned`),
  and `supabase/schema.sql` was updated to contain the same statements:
  ```sql
  revoke update on public.ride_requests from anon, authenticated;
  grant update (status) on public.ride_requests to anon, authenticated;
  drop policy if exists "ride_requests_update_status" on public.ride_requests;
  create policy "ride_requests_update_status"
    on public.ride_requests for update
    to anon, authenticated
    using (status = 'pending')
    with check (status in ('accepted', 'declined'));
  ```
  The `revoke` comes first so the result does not depend on the project's default privileges.
- **Security limitation (demo-grade, deliberately not hidden):** there is no real authentication. `driver_key` and `passenger_key` are random values each browser makes for itself and are
  NOT trusted identities. The database cannot prove that the caller owns a trip, so the `driver_key` filter in `updateRequestStatus()` is application-side filtering only. Anyone with the
  public anon key who knows (or enumerates; SELECT is open) the id of a pending request can accept or decline it, on any trip. Anyone with the anon key can also read every trip and
  request (including phone numbers) and insert rows. This is acceptable for the classroom/demo prototype only; a production system would need Supabase Auth (or another trusted identity)
  and policies tied to the authenticated user.

### Seed data (`supabase/seed.sql`)
10 trips copied field-for-field from `src/data/trips.js` (generated from the file by script, ids 1-10). Uses
`overriding system value` and `on conflict (id) do nothing`, then `setval` so the next id is 11+. Trip 1 has the
phone number that already exists in `src/data/trips.js` (looks real; see section 14).

### How CP1 was verified
On a throwaway local PostgreSQL 16 with manually created `anon` / `authenticated` roles (NOT on Supabase itself):
schema and seed each ran twice with no errors; 10 seed trips; anon could read and insert a trip (got id 11) and
insert requests for trip 11 and seed trip 1; anon UPDATE/DELETE were refused ("permission denied"); FK violation,
bad status, seats = 0 and negative fare were rejected; deleting a trip cascaded to its requests; RLS enabled on both
tables with the 4 expected policies. Not tested: Supabase's own PostgREST/API layer, the dashboard, or the anon key.
That refusal of anon UPDATE was the CP1 state; CP5-E later added the single status-only UPDATE described above (not re-verified on local PostgreSQL).

## 5. Environment variables required (never commit values)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`.env.example` (names only, created in CP1) is committed. Real values go only in `.env.local` (git-ignored via
`*.local`). Never use or commit the service-role key. `src/lib/supabase.js` (CP2) reads both variables; it throws at import if
either is missing, so a page that imports the API layer needs `.env.local` (restart `npm run dev` after editing it).

## 6. Dependencies added

`@supabase/supabase-js` (added in CP2.4 by the owner with `npm install @supabase/supabase-js`; `package.json` and
`package-lock.json` updated). The exact installed version is recorded in `package.json` / `package-lock.json`.

Other dependencies: leaflet ^1.9.4, lucide-react ^1.47.0, react ^19.2.8, react-dom ^19.2.8,
react-leaflet ^5.0.0, react-router-dom ^7.18.4. Dev: eslint ^10, vite ^8.3.0, @vitejs/plugin-react ^6.1.1,
eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @eslint/js, @types/react, @types/react-dom.

## 7. Checkpoints completed

- CP0 baseline: recorded. Build passed at baseline; lint had 2 pre-existing errors (section 11). No code changed. The `ListTrip.jsx:22` error was removed by the CP4-B rewrite and
  the `Home.jsx:13` error by the CP5-C rewrite of Home. The owner reported `npm run build` passing and `npm run lint` with 0 errors after CP5-D. CP0 is now `[x]` (it was `[~]` while those errors remained).
- CP1 Supabase schema: SQL files and `.env.example` written and verified on local PostgreSQL 16, then **verified live on the
  real hosted Supabase project by the owner** (schema ran, seed ran, 10 rows and 7 columns returned by the seed check, a test
  INSERT into `public.trips` succeeded). Complete (`[x]`).
- CP2 API/data layer: **complete** (CP2.1 to CP2.4). Created `src/lib/supabase.js`, `src/lib/identity.js`, `src/lib/api.js`;
  `@supabase/supabase-js` added to `package.json` / `package-lock.json`. Verified locally by the owner: `npm run build`
  passes; `npm run lint` shows only the same 2 pre-existing errors (no new ones); working tree clean. Committed locally as
  `a7f1fd4 Add Supabase API layer`. At CP2 time nothing used the layer yet; `listTrips()` was later confirmed live in CP3, and `createTrip()` / `listMyTrips()`
  in CP4, and `createRequest()` (CP5-B) and `listRequestsForDriver()` (CP5-D) in the CP5 live tests.
  Note: the assistant's sandbox could not run `npm install` (registry returned 403), so CP2.4 was done by the owner locally,
  and the assistant did not create or inspect the final `package.json` / `package-lock.json`.
- CP3 Supabase trip reads: **complete.** `src/pages/FindRide.jsx` imports `listTrips` from `src/lib/api.js`; `handleSearch()` is async
  and no longer reads `emptyTripListings` or the static `trips` array. Filters (from/to, max fare, min seats, min rating) preserved.
  Added `loading` (button disabled, "Searching...") and `error` (inline alert) handling. Verified by the owner: live `/find` search
  works against the hosted Supabase database; `npm run build` passes; `npm run lint` shows exactly the 2 known errors
  (`Home.jsx:13`, `ListTrip.jsx:22`). Committed as `eaa0746 Read trips from Supabase on Find Ride`; working tree clean.
  `listTrips()` was confirmed live in CP3.
- CP4 Supabase trip creation: **complete** (CP4-A and CP4-B).
  - CP4-A: added `listMyTrips()` to `src/lib/api.js`. Committed as `bf9befb Add driver trip listing API`.
  - CP4-B: migrated `src/pages/ListTrip.jsx` from `localStorage` to Supabase using `createTrip()` and `listMyTrips()`; removed the old
    `emptyTripListings` flow from that file; preserved the existing UI/styling; added loading/saving/error states (button disabled and
    "Listing..." while saving; form cleared only after a successful insert). Committed as `7673e15 Migrate trip listing to Supabase`.
  - Functional testing by the owner (local Vite server; phone over the LAN): (1) created a new trip successfully; (2) it appeared under
    "Your Listed Trips"; (3) it remained after a full page refresh; (4) it appeared in Find Ride; (5) the same trip was visible from a separate
    phone/browser reaching the local Vite server over the LAN, confirming the data is shared through Supabase and not browser `localStorage`.
  - Working tree clean after `7673e15`. The local branch is 8 commits ahead of `origin/main`; nothing has been pushed. CP4 was tested locally/over
    the LAN only; it has not been deployed publicly.
  - `createTrip()` and `listMyTrips()` were confirmed live in the CP4 tests.
- CP5 Ride requests: **complete** (CP5-A to CP5-E, live-tested as described; CP5-E is NOT committed yet).
  - CP5-A: inspection and planning. The existing ride-request flow was inspected and the CP5 migration scope was approved. No code by itself.
  - CP5-B: committed as `847e56c Migrate ride requests to Supabase`. `src/pages/FindRide.jsx` moved from `localStorage` request creation to Supabase using `createRequest()` from `src/lib/api.js`.
    The request modal collects passenger name, phone and seats requested; submission is async with loading/error handling; no `localStorage`/`sessionStorage` request writing remains in FindRide.
    Live test passed: a passenger submitted a request from another device/browser and saw `✓ Request Sent`.
  - CP5-C: committed as `6ef0351 Add passenger request lookup`. Added `listMyRequests()` to `src/lib/api.js` and migrated `src/pages/Home.jsx` to load "Your Requests" from Supabase, showing the request status from the database.
    Live test passed: after submitting a request on the phone, refreshing Home showed the request from Supabase. Home's previous lint error was removed by this rewrite.
  - CP5-D: committed as `e1b05be Add driver ride requests inbox`. `src/pages/ListTrip.jsx` loads driver requests through `listRequestsForDriver()` and shows a "Ride Requests" section (route, passenger name, phone, seats requested, status).
    No Accept/Decline existed yet. Live two-device test passed: Driver A listed a trip on a phone, Passenger B requested it on a desktop, and Driver A refreshed `/list` and saw the request in the inbox.
    The owner reported `npm run build` passing and `npm run lint` with 0 errors after CP5-D, with a clean working tree.
  - CP5-E (code present, NOT committed; no commit hash exists): added `updateRequestStatus()` and `listAcceptedSeats()` to `src/lib/api.js`; `/list` shows Accept/Decline for pending requests
    ("Accepting..." / "Declining..." while updating, immediate UI update on success); `FindRide` computes available seats from accepted requests in Supabase and its modal prevents requesting more seats than are available.
    Seat rules: pending requests take 0 seats, declined requests take 0 seats, accepted requests take their `seats_requested`, multiple accepted requests are summed, and available seats never go below 0.
    Supabase: the status-only UPDATE grant and policy (section 4) were run successfully in the real SQL Editor and written into `supabase/schema.sql`.
    Live Accept test passed: the driver saw a pending request for 2 seats, clicked Accept, then saw `Status: Accepted`; the passenger saw `Accepted`; and Find Ride then showed `Seats available 0` for that trip.
    The same implementation supports Decline, but the live test documented above was the Accept path only. Build/lint results for CP5-E were not part of the information used to update this file.

## 8. Checkpoint in progress

None. CP5 (A to E) is complete. CP5-E is awaiting the owner's own build/lint check and commit (no hash yet). CP6 has NOT started and must not start until the owner approves it.

## 9. Exact files modified/created

CP1 created: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example`.

CP2 created: `src/lib/supabase.js`, `src/lib/identity.js`, `src/lib/api.js`.
CP2 modified: `package.json`, `package-lock.json` (added `@supabase/supabase-js`, by the owner).
CP3 modified: `src/pages/FindRide.jsx` only (commit `eaa0746`).
CP4-A modified: `src/lib/api.js` only (added `listMyTrips()`; commit `bf9befb`).
CP4-B modified: `src/pages/ListTrip.jsx` only (commit `7673e15`).
CP5-B modified: `src/pages/FindRide.jsx` (commit `847e56c`).
CP5-C modified: `src/lib/api.js` (added `listMyRequests()`) and `src/pages/Home.jsx` (commit `6ef0351`).
CP5-D modified: `src/pages/ListTrip.jsx` (commit `e1b05be`).
CP5-E modified, NOT committed: `src/lib/api.js` (`updateRequestStatus()`, `listAcceptedSeats()`), `src/pages/ListTrip.jsx`, `src/pages/FindRide.jsx`, and `supabase/schema.sql` (status-only UPDATE grant/policy and security comment).
Updated docs: `AI_HANDOFF.md`, `IMPLEMENTATION_STATUS.md`.

Not modified as of CP5-E: `src/data/trips.js`, `src/App.jsx`, `src/lib/supabase.js`, `src/lib/identity.js`, `supabase/seed.sql`, `.env.example`, `package.json`, `package-lock.json` (per the reports used to update this file).

## 10. What is still unfinished

CP5 is finished (A to E). Remaining:
- Commit CP5-E (owner), after running `npm run build` and `npm run lint` locally.
- CP6: not started. There is still no separate `/driver` page (`src/pages/DriverRequests.jsx` plus route/nav link as originally planned); the driver request inbox currently lives in `/list`.
- CP7: deployment. CP8: optional polish.
- Known limitations that are not fixed are listed in section 11.

## 11. Known bugs / errors

**Lint / build:** the pre-existing lint errors are resolved: `ListTrip.jsx:22` was removed by the CP4-B rewrite and `Home.jsx:13` by the CP5-C rewrite. The owner reported `npm run lint` with 0 errors and `npm run build` passing after CP5-D.
Results for CP5-E were not part of the information used to update this file (re-run both before committing CP5-E). Baseline build history: passed at baseline (`vite build`, 70 modules at that time).

**Known limitations after CP5-E (demo-grade, not fixed):**
- No Supabase Auth / real authentication. `driver_key` and `passenger_key` are random browser-local identifiers, not trusted identities. The `ride_requests_update_status` policy allows status updates on pending
  requests but cannot prove the caller is the actual driver; the driver-key filter in `updateRequestStatus()` is application-side only. Anyone with the anon key can read all trips/requests (including phone numbers)
  and could accept/decline a pending request if they know its id (section 4).
- No realtime subscriptions or polling. Request, status and seat changes appear only when the relevant data is fetched again (page load/refresh, or a new search). `FindRide` accepted-seat data refreshes when searching.
- Seat capacity is client-side/demo-grade: there is no transactional database-side capacity check, so concurrent requests could theoretically overbook. From code inspection (not live-tested): accepting a request is not
  checked against the remaining seats by either the UI or the database; available seats are only clamped to 0 for display.
- The passenger `requested` UI state in `FindRide` is in-memory only, so refreshing Find Ride can forget that the passenger already requested a trip (and show "Request Ride" again).
- Duplicate passenger requests are not prevented at the database level (no uniqueness rule on trip + passenger).
- Accept and Decline are final: the database refuses to change a request that is no longer `pending`.
- Declined/answered requests are not removed; there is no cancel/withdraw action for passengers.

**Existing behaviour issues (not fixed):**
- The request modal says "The driver will be notified"; nothing notifies anyone (the driver sees requests only by loading `/list`).
- "Notify Me" button does nothing.
- Modal renders the destination `Marker` twice (existing, unrelated duplicate destination map marker).
- Trips listed through `/list` have no `rating` or `pickup` and use a 24-hour `departure` (e.g. "16:30") while seed trips use "4:30 PM". A Min Rating filter excludes trips without a rating, so it excludes every listed trip. (Number conversion and map coordinates are handled by the API layer.)
- The Min Seats filter compares against a trip's total seats, not the seats still available after accepted requests.
- `requestStatusLabel` is defined separately in `Home.jsx` and `ListTrip.jsx`.
- `createTrip()` does no validation beyond the form's `required` attributes; database constraints (integer `seats`/`fare`, `seats` > 0, `fare` >= 0) are enforced by Supabase and any error text is shown in `ListTrip`'s error alert. This was not exercised in the CP4 tests.
- `date` is collected on the form but never used when searching.
- `package.json` name is still `my-app`; README is the default Vite template text.

Resolved since the previous version of this file: Home's hardcoded "Pending confirmation" badge (now the real status from the database), Home not resolving newly listed Supabase trips (Home now reads from Supabase),
the `FindRide` "seat availability only subtracts this session's own requests" issue (now uses accepted requests from Supabase), and the old `emptyTripRequests` overwrite problem (request ids are no longer stored in `localStorage`).

**CP1 notes:** identity sequences are not rolled back on failed inserts, so ids can skip numbers (harmless).
Re-running `schema.sql` never alters an existing table; column changes need a manual ALTER or drop/recreate.

## 12. Exact next steps (for another developer/AI)

1. Read `IMPLEMENTATION_STATUS.md` and this file.
2. The database steps in section 15 are confirmed done. Confirm the owner has a local `.env.local` with the two `VITE_` values
   (step 7). If not, ask them first.
3. CP4 and CP5 (A to E) are done. Commits: CP4 `bf9befb`, `7673e15`; CP5-B `847e56c`, CP5-C `6ef0351`, CP5-D `e1b05be`. CP5-E is NOT committed: ask the owner to run `npm run build` and `npm run lint`,
   check `git status` (expected changed files: `src/lib/api.js`, `src/pages/ListTrip.jsx`, `src/pages/FindRide.jsx`, `supabase/schema.sql`, and these docs) and commit it. Do not invent a hash.
4. Do not start CP6 without the owner's approval. There is no separate `/driver` page yet; the driver inbox with Accept/Decline lives in `/list`. Then CP7 and CP8 per `IMPLEMENTATION_STATUS.md`, one at a time, updating both handoff files after each.
   Do not import `supabase.js` from pages.

## 13. Commands

```
npm ci            # install from lockfile (or: npm install)
npm run dev       # start Vite dev server
npm run lint      # eslint .        (0 errors reported after CP5-D; re-run after CP5-E)
npm run build     # vite build      (passed after CP5-D; re-run after CP5-E)
npm run preview   # serve the production build
```
No automated test suite; testing is manual with two browsers (or one normal plus one private window).
Optional local SQL check (not part of the project): install PostgreSQL, create roles `anon` and `authenticated`,
then run `supabase/schema.sql` and `supabase/seed.sql` with `psql -f`.

## 14. Important decisions and assumptions

Decided by the owner: Supabase as the shared backend; keep React + Vite + JSX; follow CP0-CP8 one at a time and wait
for approval; do not invent extra features; leave the pre-existing lint errors deferred to the page rewrites (the `ListTrip.jsx` one went away in CP4-B; the `Home.jsx` one went away in CP5-C); keep `src/data/trips.js` unchanged.

Decisions made in CP1 (change them if you disagree):
- Column rename `from`/`to` -> `from_location`/`to_location` (reserved words); mapped back in the API layer.
- `id` is `bigint identity BY DEFAULT` so seed ids 1-10 are preserved and existing `===` id comparisons keep working.
- Coordinates are not stored; derived from `locationCoords`.
- `departure` stays text (two formats exist). `date` is nullable.
- `ride_requests.passenger_name` and `passenger_phone` are NOT NULL. CP5-B added name/phone fields to the request modal to satisfy this.
- `status` allows `pending`, `accepted`, `declined`; only `pending` was used until CP5-E, which uses all three.
- **Narrowing versus the earlier plan:** no anon UPDATE on `ride_requests` in CP1 (the earlier plan mentioned it). It was later added in CP5-E, limited to the `status` column and the transition `pending` -> `accepted`/`declined` (section 4).
- No check that `from_location <> to_location`, and no restriction to the 8 known locations (the UI does not enforce them either).
- Seed trip 1 keeps the phone number already present in `src/data/trips.js`. If it is a real person's number,
  edit `supabase/seed.sql` before running it (and consider the same for `trips.js`).

Decisions made in CP2 (change them if you disagree):
- `supabase.js` throws at import if the env variables are missing (fail fast) instead of exporting a null client.
- Auth options are all off (`persistSession`, `autoRefreshToken`, `detectSessionInUrl` = false) because there is no auth.
- Identity keys: `drv_` / `pax_` + `crypto.randomUUID()` (fallback random string), separate `localStorage` keys, in-memory fallback.
- API functions take the driver/passenger key from `identity.js` themselves; pages do not pass keys.
- API objects use camelCase for new fields (`tripId`, `passengerName`, `driverKey`, `createdAt`, ...) and the original trip field names for trips.
- `rating` is returned as a number (Postgres numeric arrives as a string) or `undefined` when null.
- Only the four functions in the CP2 spec were written; the passenger-key request lookup was added later as `listMyRequests()` (CP5-C).

Decisions made in CP3 (change them if you disagree):
- Only `FindRide.jsx` was changed. Home and ListTrip were left alone, so their `localStorage` trip reads remain until CP4/CP5.
- `/find` still searches on button click (not on page load), and filters client-side after fetching all trips with `listTrips()`.
- On a failed search the error is shown and `searched` is set to false, so an error is never displayed as "No return trips found".

Decisions made in CP4 (change them if you disagree):
- "Your Listed Trips" is loaded through a dedicated API function, `listMyTrips()` (added in CP4-A), instead of filtering `listTrips()` in the page; `ListTrip.jsx` only calls `createTrip` and `listMyTrips` from `src/lib/api.js`.
- No `localStorage` replacement was added for the old `emptyTripListings` key.
- The form is cleared only after `createTrip()` succeeds; a failed save shows an error and keeps the form contents.
- Home was deliberately not touched in CP4; its request lookup is CP5.

Decisions made in CP5 (change them if you disagree):
- Accept/Decline was built in CP5-E, ahead of the "optional CP8" slot in the old plan, and lives in the `/list` inbox, not a separate page.
- Seat rule (was an open question): pending requests do NOT reduce available seats; declined requests do not; accepted requests reduce seats by their `seats_requested`; multiple accepted requests are summed; available seats never go below 0.
- Only `accepted`/`declined` can be set, and only on a `pending` request; answered requests are final (enforced by the API and by the database policy).
- The database UPDATE permission is deliberately minimal (status column only) and the lack of trusted identity is documented, not hidden (section 4).
- Home and ListTrip each define their own `requestStatusLabel` helper instead of sharing one.

Still open (ask the owner before they matter): duplicate requests by the same passenger (not prevented), whether search should filter by date or hide old trips,
whether seat capacity should be enforced on accept or in the database, what CP6 should now contain given the inbox already exists in `/list`, hosting target.

## 15. Supabase dashboard steps

Completed manually by the owner and confirmed: a Supabase project exists; `supabase/schema.sql` ran successfully; `supabase/seed.sql`
ran successfully; the seed verification query returned 10 rows and 7 columns (10 seeded trips); a test INSERT into `public.trips`
succeeded. The test insert was done only in the SQL Editor and must NOT be added to `seed.sql`; that test row may still exist in the
live `trips` table (delete it in the SQL Editor if unwanted). The trip(s) created during the CP4 tests are also real rows in the hosted
`trips` table and, unless deleted, will appear in `/find` for their route (deletion was not recorded). Requests created during the CP5 tests are real rows in the hosted `ride_requests` table (deletion not recorded).
`ride_requests` inserts, reads and the CP5-E status update are exercised by the CP5 live tests (step 6's SQL-Editor test is no longer needed). The dashboard policy list check (step 5) was not recorded; expect five policies on the two tables (see section 4).
CP5-E: the status-only UPDATE SQL in section 4 was run successfully in the real Supabase SQL Editor (`Success. No rows returned`). Anyone setting up a fresh project should run `supabase/schema.sql` (which now includes it), then `supabase/seed.sql`. The `.env.local` values (step 7) are evidently set locally, since live reads (CP3) and writes (CP4) work. (The assistant has no access to any Supabase project.)

Steps, for reference and for setting up another project (steps 1-4 are done for the current one):
1. Create a Supabase project (supabase.com -> New project). Save the database password somewhere private.
2. SQL Editor -> New query -> paste all of `supabase/schema.sql` -> Run. Expect "Success. No rows returned".
3. New query -> paste all of `supabase/seed.sql` -> Run. Expect a result row from `setval` (value 10).
4. Table Editor: `trips` should show 10 rows (ids 1-10); `ride_requests` should exist and be empty.
5. Database -> Tables: confirm RLS is enabled on both tables; Authentication -> Policies (or Database -> Policies):
   confirm the policies listed in section 4 (five after CP5-E).
6. Optional test: SQL Editor ->
   `insert into public.ride_requests (trip_id, passenger_name, passenger_phone, passenger_key) values (1, 'Test', '000', 'test_key');`
   then check the row in Table Editor, then delete it with
   `delete from public.ride_requests where passenger_key = 'test_key';` (the SQL Editor runs as an admin role, so delete works there).
7. Project Settings -> API: copy the Project URL and the `anon` public key into a local `.env.local`
   (never the `service_role` key, never commit `.env.local`).

Still required later: set the same two `VITE_` variables in the hosting provider at deployment (CP7).

## Emergency handoff protocol

If told "STOP — prepare a handoff", or if tools/usage run out: stop implementing, save safe work, update this file and
`IMPLEMENTATION_STATUS.md`, run lint/build, list complete/incomplete/modified/new files, and build a ZIP of the project
excluding `node_modules`, `dist` and any `.env*` file with secrets (ship `.env.example` instead).

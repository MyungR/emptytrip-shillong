# AI_HANDOFF.md

Last updated: after CP4 (`/list` creates and lists trips in Supabase via `createTrip()` / `listMyTrips()`). Update this file after every checkpoint.

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
4. Browser A: driver sees the passenger request (needs a new `/driver` page).

**Status: this flow does NOT fully work yet.** Steps 1-2 now work through Supabase: after CP3 `/find` searches the trips stored in
Supabase, and after CP4 `/list` saves trips to Supabase, so a listed trip is shared between browsers/devices (tested locally by the owner,
including a phone reaching the local Vite server over the LAN; not deployed). Requests are still local (CP5); there is no driver page (CP6).

## 2. Current architecture

- Frontend only: React 19 + Vite 8, JavaScript/JSX, npm, `react-router-dom` 7 (`BrowserRouter`).
- Routes (`src/App.jsx`): `/` Home, `/find` FindRide, `/list` ListTrip. No driver page exists yet.
- Styling: mostly inline `style` objects plus global classes in `src/index.css` / `src/App.css`.
- Maps: `react-leaflet` in the FindRide request modal only.
- No auth. `/find` reads trips from Supabase through `src/lib/api.js` (CP3). `/list` creates trips and loads "Your Listed Trips" through `src/lib/api.js` (CP4). Home ("Your Requests") and request writing still use `localStorage` only (see section 3).

Architecture: Supabase (Postgres + `@supabase/supabase-js`) called directly from the frontend through a small data layer
in `src/lib/` (built in CP2). `FindRide` uses it since CP3 and `ListTrip` since CP4; the remaining pages will follow in CP5+. Pages must only call `src/lib/api.js`, never the client
directly. Existing frontend structure stays.

## 3. Important files and what they do

| File | Purpose |
|---|---|
| `index.html` | Entry HTML. Loads Inter font and Leaflet CSS from CDNs. Mounts `/src/main.jsx`. |
| `src/main.jsx` | React root, `StrictMode`, imports `index.css`. |
| `src/App.jsx` | Router, inline `Navbar` and `Footer`, three routes. |
| `src/pages/Home.jsx` (302 lines, unchanged) | Landing page. "Your Requests" reads `localStorage["emptyTripRequests"]` ids and looks them up in the static seed trips plus `localStorage["emptyTripListings"]`. Always shows a static "Pending confirmation" badge. Since CP4 nothing writes `emptyTripListings` any more, so only the static seed trips (ids 1-10) can be resolved here (see section 11). |
| `src/pages/ListTrip.jsx` (CP4-B) | Driver form. Imports `createTrip` and `listMyTrips` from `src/lib/api.js`. On submit it calls `await createTrip(form)` (Supabase insert); "Your Listed Trips" loads from `listMyTrips()` (this browser's driver key). Has loading/saving/error states: the submit button is disabled and shows "Listing..." while saving, and the form is cleared only after a successful insert. No longer uses `localStorage["emptyTripListings"]`. Existing UI/styling preserved. |
| `src/pages/FindRide.jsx` (about 373 lines after CP3) | Route search (from/to, max fare, min seats, min rating), results, request modal with Leaflet map. CP3: `handleSearch()` is async and reads all trips with `listTrips()` (Supabase), then filters client-side; has `loading` and `error` state. `confirmRequest` still saves the trip id to `localStorage["emptyTripRequests"]` (CP5). |
| `src/data/trips.js` (173 lines) | Exports `locations` (8 names), `locationCoords` (name -> [lat,lng]), `trips` (10 seed trips, ids 1-10, all to Shillong). UNCHANGED; stays as reference data. |
| `src/index.css`, `src/App.css` | Global styles (classes: `page`, `section`, `card`, `btn`, `btn-primary`, `field-input`, `ride-card` ...). |
| `src/assets/*`, `public/*` | `hero.jpg` is used by Home; `react.svg`, `vite.svg`, `hero.png`, `icons.svg` are Vite template leftovers. |
| `vite.config.js`, `eslint.config.js` | Standard Vite React config; ESLint 10 flat config with react-hooks and react-refresh. |
| `.gitignore` | Ignores `node_modules`, `dist`, and `*.local` (so `.env.local` is ignored; `.env.example` is NOT ignored). |
| `supabase/schema.sql` | NEW (CP1). Tables, constraints, indexes, grants, RLS policies. Run first. |
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

### API layer summary (`src/lib/api.js`, CP2; `listMyTrips()` added in CP4-A)
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
- NOT yet present: a lookup of requests by passenger key (needed for Home "Your Requests"). Add it in CP5 (`ride_requests.passenger_key`).

### Privileges and RLS
- RLS enabled on both tables.
- `grant select, insert` on both tables to `anon, authenticated` (plus `usage` on schema `public`).
- Policies (all `to anon, authenticated`): `trips_select_all` (select, true), `trips_insert_all` (insert, true),
  `ride_requests_select_all` (select, true), `ride_requests_insert_all` (insert, true).
- **No UPDATE or DELETE grants/policies on either table.** Anon cannot change or remove rows. UPDATE on
  `ride_requests.status` will be added only if optional CP8 (accept/decline) is built.
- Demo-grade security: anyone with the anon key can read every trip and request (including phone numbers) and insert rows.

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

- CP0 baseline: recorded. Build passed at baseline; lint had 2 pre-existing errors (section 11). No code changed. As reported by the owner after CP4,
  exactly 1 remains (`src/pages/Home.jsx:13`); the `ListTrip.jsx:22` error was removed by the CP4-B rewrite. Stays `[~]` because of the Home error.
- CP1 Supabase schema: SQL files and `.env.example` written and verified on local PostgreSQL 16, then **verified live on the
  real hosted Supabase project by the owner** (schema ran, seed ran, 10 rows and 7 columns returned by the seed check, a test
  INSERT into `public.trips` succeeded). Complete (`[x]`).
- CP2 API/data layer: **complete** (CP2.1 to CP2.4). Created `src/lib/supabase.js`, `src/lib/identity.js`, `src/lib/api.js`;
  `@supabase/supabase-js` added to `package.json` / `package-lock.json`. Verified locally by the owner: `npm run build`
  passes; `npm run lint` shows only the same 2 pre-existing errors (no new ones); working tree clean. Committed locally as
  `a7f1fd4 Add Supabase API layer`. At CP2 time nothing used the layer yet; `listTrips()` was later confirmed live in CP3, and `createTrip()` / `listMyTrips()`
  in CP4 (`createRequest` and `listRequestsForDriver` are still unexercised).
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
  - `createTrip()` and `listMyTrips()` are now confirmed live. `createRequest()` and `listRequestsForDriver()` are not yet.

## 8. Checkpoint in progress

None. CP5 has NOT started and must not start until the owner approves it.

## 9. Exact files modified/created

CP1 created: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example`.

CP2 created: `src/lib/supabase.js`, `src/lib/identity.js`, `src/lib/api.js`.
CP2 modified: `package.json`, `package-lock.json` (added `@supabase/supabase-js`, by the owner).
CP3 modified: `src/pages/FindRide.jsx` only (commit `eaa0746`).
CP4-A modified: `src/lib/api.js` only (added `listMyTrips()`; commit `bf9befb`).
CP4-B modified: `src/pages/ListTrip.jsx` only (commit `7673e15`).
Updated docs: `AI_HANDOFF.md`, `IMPLEMENTATION_STATUS.md`.

Not modified (as of CP4): `src/data/trips.js`, `src/pages/Home.jsx`, `src/App.jsx`, `src/lib/supabase.js`, `src/lib/identity.js`, `supabase/*.sql`, `.env.example`.
The one remaining pre-existing lint error (`Home.jsx:13`) was deliberately left alone.

## 10. What is still unfinished

CP5 to CP8: ride requests (CP5: migrate the Find Ride request flow from `localStorage` to Supabase using `createRequest()`; `confirmRequest` still saves ids to `localStorage["emptyTripRequests"]`, and Home still reads `emptyTripRequests` and `emptyTripListings`; the schema requires passenger name/phone, and a passenger-key request lookup in `api.js` is still missing); `src/pages/DriverRequests.jsx`
plus route/nav link (CP6); deployment (CP7); optional accept/decline (CP8).

## 11. Known bugs / errors

**Remaining pre-existing lint error (1, rule `react-hooks/set-state-in-effect`), as reported by the owner after CP4:**
- `src/pages/Home.jsx:13` calls `setMyRequests(requestedTrips)` synchronously inside `useEffect`.
Resolved: `src/pages/ListTrip.jsx:22` (`setListed(...)` in `useEffect`) was removed by the CP4-B rewrite.
The owner decided: leave the Home error. It is expected to go away when Home is rewritten in CP5. Do not fix separately.

**Baseline build:** passes (`vite build`, 70 modules). It was reported passing through CP3; a post-CP4 build result was not part of the information used to update this file.

**Existing behaviour issues (not fixed):**
- `FindRide` starts `requested` as `[]`, so a refresh loses "Request Sent" and the next request overwrites the saved array.
- Seat availability only subtracts this session's own requests.
- The request modal says "The driver will be notified"; nothing notifies anyone.
- "Notify Me" button does nothing.
- Home shows a hardcoded "Pending confirmation" badge.
- Modal renders the destination `Marker` twice.
- Trips listed through `/list` have no `rating` or `pickup` and use a 24-hour `departure` (e.g. "16:30") while seed trips use "4:30 PM". A Min Rating filter excludes trips without a rating, so it excludes every listed trip. (Number conversion and map coordinates are handled by the API layer.)
- Since CP4 nothing writes `localStorage["emptyTripListings"]`, but Home still resolves requested trip ids against the static seed trips plus that key. A request for a newly listed Supabase trip (id 11+) would therefore not show up in Home's "Your Requests" until Home is migrated in CP5.
- `createTrip()` does no validation beyond the form's `required` attributes; database constraints (integer `seats`/`fare`, `seats` > 0, `fare` >= 0) are enforced by Supabase and any error text is shown in `ListTrip`'s error alert. This was not exercised in the CP4 tests.
- `date` is collected on the form but never used when searching.
- `package.json` name is still `my-app`; README is the default Vite template text.

**CP1 notes:** identity sequences are not rolled back on failed inserts, so ids can skip numbers (harmless).
Re-running `schema.sql` never alters an existing table; column changes need a manual ALTER or drop/recreate.

## 12. Exact next steps (for another developer/AI)

1. Read `IMPLEMENTATION_STATUS.md` and this file.
2. The database steps in section 15 are confirmed done. Confirm the owner has a local `.env.local` with the two `VITE_` values
   (step 7). If not, ask them first.
3. CP4 is done (`bf9befb`, `7673e15`). Do not start CP5 without the owner's approval. CP5: migrate the Find Ride request flow
   (`confirmRequest` in `src/pages/FindRide.jsx`) from `localStorage["emptyTripRequests"]` to Supabase using `createRequest()` from
   `src/lib/api.js`. Points to settle with the owner first: the `ride_requests` schema requires `passenger_name` and `passenger_phone`
   (the request modal collects neither today); Home's "Your Requests" and its `setMyRequests` lint error (`Home.jsx:13`) belong to the same area, and
   `api.js` has no passenger-key request lookup yet; Home no longer sees newly listed trips through `emptyTripListings` (section 11).
   Do not import `supabase.js` from pages.
4. Then CP6 to CP8 per `IMPLEMENTATION_STATUS.md`, one at a time, updating both handoff files after each.

## 13. Commands

```
npm ci            # install from lockfile (or: npm install)
npm run dev       # start Vite dev server
npm run lint      # eslint .        (1 known pre-existing error remains: Home.jsx:13, see section 11)
npm run build     # vite build      (passed through CP3; re-run to confirm after CP4)
npm run preview   # serve the production build
```
No automated test suite; testing is manual with two browsers (or one normal plus one private window).
Optional local SQL check (not part of the project): install PostgreSQL, create roles `anon` and `authenticated`,
then run `supabase/schema.sql` and `supabase/seed.sql` with `psql -f`.

## 14. Important decisions and assumptions

Decided by the owner: Supabase as the shared backend; keep React + Vite + JSX; follow CP0-CP8 one at a time and wait
for approval; do not invent extra features; leave the pre-existing lint errors deferred to the page rewrites (the `ListTrip.jsx` one went away in CP4-B; the `Home.jsx` one is deferred to CP5); keep `src/data/trips.js` unchanged.

Decisions made in CP1 (change them if you disagree):
- Column rename `from`/`to` -> `from_location`/`to_location` (reserved words); mapped back in the API layer.
- `id` is `bigint identity BY DEFAULT` so seed ids 1-10 are preserved and existing `===` id comparisons keep working.
- Coordinates are not stored; derived from `locationCoords`.
- `departure` stays text (two formats exist). `date` is nullable.
- `ride_requests.passenger_name` and `passenger_phone` are NOT NULL. This assumes CP5 adds name/phone fields to the
  request modal (today it collects nothing). Relax the constraints if you prefer anonymous requests.
- `status` allows `pending`, `accepted`, `declined`; only `pending` is used until optional CP8.
- **Narrowing versus the earlier plan:** no anon UPDATE on `ride_requests` in CP1 (the earlier plan mentioned it).
  It is only needed for CP8 and would otherwise let anyone edit requests.
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
- Only the four functions in the CP2 spec were written; a passenger-key request lookup is deferred to CP5.

Decisions made in CP3 (change them if you disagree):
- Only `FindRide.jsx` was changed. Home and ListTrip were left alone, so their `localStorage` trip reads remain until CP4/CP5.
- `/find` still searches on button click (not on page load), and filters client-side after fetching all trips with `listTrips()`.
- On a failed search the error is shown and `searched` is set to false, so an error is never displayed as "No return trips found".

Decisions made in CP4 (change them if you disagree):
- "Your Listed Trips" is loaded through a dedicated API function, `listMyTrips()` (added in CP4-A), instead of filtering `listTrips()` in the page; `ListTrip.jsx` only calls `createTrip` and `listMyTrips` from `src/lib/api.js`.
- No `localStorage` replacement was added for the old `emptyTripListings` key.
- The form is cleared only after `createTrip()` succeeds; a failed save shows an error and keeps the form contents.
- Home was deliberately not touched in CP4; its request lookup is CP5.

Still open (ask the owner before they matter): seat rule (do pending requests reduce seats?), duplicate requests
by the same passenger, whether search should filter by date or hide old trips, whether accept/decline is required
for the demo, hosting target.

## 15. Supabase dashboard steps

Completed manually by the owner and confirmed: a Supabase project exists; `supabase/schema.sql` ran successfully; `supabase/seed.sql`
ran successfully; the seed verification query returned 10 rows and 7 columns (10 seeded trips); a test INSERT into `public.trips`
succeeded. The test insert was done only in the SQL Editor and must NOT be added to `seed.sql`; that test row may still exist in the
live `trips` table (delete it in the SQL Editor if unwanted). The trip(s) created during the CP4 tests are also real rows in the hosted
`trips` table and, unless deleted, will appear in `/find` for their route (deletion was not recorded). Not recorded as confirmed: the RLS/policy checks (step 5) and the
`ride_requests` test (step 6). The `.env.local` values (step 7) are evidently set locally, since live reads (CP3) and writes (CP4) work. (The assistant has no access to any Supabase project.)

Steps, for reference and for setting up another project (steps 1-4 are done for the current one):
1. Create a Supabase project (supabase.com -> New project). Save the database password somewhere private.
2. SQL Editor -> New query -> paste all of `supabase/schema.sql` -> Run. Expect "Success. No rows returned".
3. New query -> paste all of `supabase/seed.sql` -> Run. Expect a result row from `setval` (value 10).
4. Table Editor: `trips` should show 10 rows (ids 1-10); `ride_requests` should exist and be empty.
5. Database -> Tables: confirm RLS is enabled on both tables; Authentication -> Policies (or Database -> Policies):
   confirm the four policies listed in section 4.
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

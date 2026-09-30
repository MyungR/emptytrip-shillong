# IMPLEMENTATION_STATUS.md

Legend: `[x]` completed and tested, `[~]` done with caveats, `[ ]` not started.
Details live in `AI_HANDOFF.md`. Update both after every checkpoint.

- [~] CP0 baseline: `npm run build` PASSES; `npm run lint` FAILS with 2 pre-existing errors
      (`react-hooks/set-state-in-effect` in `src/pages/Home.jsx:13` and `src/pages/ListTrip.jsx:22`).
      Owner decision: leave them for the CP3/CP4 rewrites.
- [~] CP1 Supabase schema: `supabase/schema.sql`, `supabase/seed.sql`, `.env.example` written and verified on a local
      PostgreSQL 16 (tables, FKs, defaults, checks, RLS, anon read/insert allowed, anon update/delete refused, seed = 10 trips,
      re-runnable). NOT yet run in a real Supabase project. Becomes [x] after the owner runs the dashboard steps
      (AI_HANDOFF.md section 15) and confirms 10 seed trips + working test insert.
- [ ] CP2 API/data layer
- [ ] CP3 Supabase trip reads
- [ ] CP4 trip creation
- [ ] CP5 ride requests
- [ ] CP6 driver inbox
- [ ] CP7 deployment
- [ ] CP8 optional polish

Current state: CP1 files written; waiting for the owner to run them in Supabase and approve CP2.
No application code has been changed (React app still local-only). Demo flow (A lists -> B finds -> B requests -> A sees): NOT working yet.

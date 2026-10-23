---
type: session
date: 2026-10-21
project: Engineering CRM Tracker
summary: Client approved the prototype for real use by one all-in-one user. Built v0.3 (Supabase sign-in and auto-save, People page, remove-sample-data, pink theme, edit own name). Tests and builds pass; live mode untested until the Supabase project exists.
---

# 2026-10-21 - Single-user live version v0.3

## Summary
Client contact liked the demo and wants to use EngTrack now as her own tracker (she is an engineer, one all-in-one user). Decision: [[Decisions/Single-user trial on Supabase]].

## Done (verified)
- `prototype/src/lib/cloud.ts` (Supabase load/save), `components/LiveGate.tsx` (sign-in, first-run seeding, debounced auto-save + retry), `pages/People.tsx` (people list, remove sample data, edit name).
- Store: `people` in state, `peopleIn(role)` for pickers, one-user reminders, `removeDemo`.
- Pink palette in `tailwind.config.js` + hard-coded colours; alert red → orange-red `#c2410c`.
- `supabase/schema.sql` (tables + RLS), `prototype/.env.example`, `npm run build:demo`.
- `tsc`, 26 tests, `build` and `build:demo` pass. Pink demo build checked in Chrome.

## Later the same day
- Supabase project set up by project owner; sign-ups disabled (verified via auth settings).
- Sign-in button bug fixed (shared `Button` defaults to type=button; sign-in now type=submit).
- Verified live: data loads, saves survive reload, remove + add sample data persist. No console errors.
- Added "Add sample data" on People page; README updated (two builds, new-device setup, publish steps).
- Both builds copied into `docs/` and everything staged. Commit/push blocked by Claude Code auto mode; project owner to run them.
- Blocked too: committing the Supabase settings file. New devices create `prototype/.env.local` from `.env.example`.

## Next Steps
- Done: pushed `fb3f305`, Pages verified (sign-in at root, demo at /demo/).
- Change or delete the test account test credentials were discussed privately.
- Client uses it; collect feedback. Multi-user build only if management approves.

# EngTrack (Engineering CRM Tracker)

Engineering Project Management CRM & Tracker: projects, nine engineering scopes per project, clients, assignments, deadlines and reminders, Gantt/calendar, dashboards, reports.

- Live app (sign-in, single user): https://tactile4312.github.io/engtrack/
- Click-through demo (fictional data, no login): https://tactile4312.github.io/engtrack/demo/
- Requirements: [REQUIREMENTS.md](REQUIREMENTS.md) (authoritative; confirmed decisions table at the top)
- Project memory: `Obsidian Vault\Projects\Engineering CRM Tracker\Project Hub.md`

## Status (2026-10-21)

| Phase | State |
|---|---|
| 2. Low-fidelity wireframes | Done: `design/wireframes-lowfi.html`, client copy + PDF in `design/client-share/` |
| 3. Polished mockups + clickable prototype | Done: `prototype/`, screenshots in `design/polished-mockups/`, client copy `design/client-share/EngTrack Prototype v0.2.html` (v0.2 adds add/edit clients) |
| Single-user trial (v0.3) | Done: one all-in-one user signs in; data saved in Supabase (free tier). People page, add/remove sample data, pink theme |
| 1, 4–8. Multi-user roles, full schema, server-side reminders | Waiting: only if the trial is approved by the client's management |

Two builds from the same code: the **live app** (`npm run build`, needs Supabase settings) and the **demo** (`npm run build:demo`, fictional data in memory, no login). Reminders in the live app are worked out in the browser; there is no server-side scheduler or email yet.

## Layout

```
REQUIREMENTS.md            spec + confirmed decisions
design/
  wireframes-lowfi.html    stage 1 wireframes (source)
  polished-mockups/        PNG screenshots of the prototype (desktop 1440x900, mobile)
  client-share/            files to send to the client
  CLIENT-DEMO.md           talk track, prototype vs full build, demo checklist
prototype/                 React + TypeScript + Tailwind, built to one HTML file
  src/types.ts             data model (projects, scopes, tasks, milestones, reminders)
  src/lib/rules.ts         business rules: progress, visibility, project number, reminder schedule
  src/lib/validation.ts    form validation
  src/lib/metrics.ts       dashboard/report figures and project filtering
  src/mock-data/seed.ts    fictional demo data (dates relative to today)
  src/store/AppStore.tsx   app state, navigation, activity history
  src/pages/               one file per screen
  src/components/          shell, UI pieces, charts, export dialog
  src/lib/cloud.ts         Supabase load/save (live build only)
  src/components/LiveGate.tsx  sign-in, first-run data, auto-save
  capture.sh               regenerates design/polished-mockups/
supabase/schema.sql        tables + Row Level Security (run once in the Supabase SQL Editor)
docs/                      GitHub Pages: index.html = live app, demo/index.html = demo
```

## Run the prototype

Needs Node.js 18+ (tested with Node 24).

```bash
cd prototype
npm install
npm run dev        # http://localhost:5173 with live reload
npm test           # rules, backup file checks and CSV export
npm run build      # live app: one self-contained file, dist/index.html (needs prototype/.env.local)
npm run build:demo # demo: dist-demo/index.html (no login, no database)
bash capture.sh    # after a build: refresh the PNG mockups (uses Chrome)
```

Open `dist/index.html` directly in a browser to use the built prototype without a server.

URL options (local file or dev server): `?screen=projects`, `?screen=project&id=CRM-2026-0142`, `?device=mobile`, `?user=u-e1`, `?bar=0` (hide the prototype bar for screenshots).

After `npm run build`, copy `prototype/dist/index.html` to `design/client-share/EngTrack Prototype vX.Y.html` for the client.

## Supabase settings on a new device

`prototype/.env.local` is not in git. On a new device copy `prototype/.env.example` to `prototype/.env.local` and fill in the two values from the Supabase dashboard (project `engtrack`): Project URL, and the **publishable** key from Project Settings > API Keys. Never use the secret / service_role key. Without this file `npm run build` and `npm run dev` give the demo (no login).

## Publish (GitHub Pages)

https://tactile4312.github.io/engtrack/ serves `docs/` from the `main` branch. To update: `npm run build && npm run build:demo` in `prototype/`, copy `prototype/dist/index.html` to `docs/index.html` and `prototype/dist-demo/index.html` to `docs/demo/index.html`, commit and push. GitHub takes a minute or two to publish.

## Adding a feature safely

Code depends in one direction, and `src/architecture.test.ts` fails if that breaks or files import each other in a loop:

```
pages/ -> components/ -> store/ -> lib/ -> types.ts
```

| Where it goes | What belongs there |
|---|---|
| `lib/` | Rules and calculations with no screen code; add tests beside them |
| `store/reducer.ts` | Every change to app data, as a new message type in `store/state.ts`; add a test in `reducer.test.ts` |
| `components/` | Pieces used by more than one screen |
| `pages/` | One file per screen; add new screens to `SCREENS` in `src/smoke.test.tsx` |

Rules that keep it from breaking:

1. **New field on a saved record:** add its default in `lib/normalize.ts`. Records and backups saved earlier won't have it.
2. **Never change objects in place.** Auto-save finds changes by comparing objects, so an in-place edit would never be saved.
3. **Run `npm test` and `npm run build` before publishing.** GitHub runs the tests and the demo build on every push; don't publish on a red check.
4. **Try risky changes on a separate Supabase test project,** never on the client's data.

## Backups and restoring

The live app stores real data on a free Supabase project. This setup has no automatic backups you can rely on, and the free tier pauses a project after 7 days with no activity (as of 2026-10-21; check supabase.com/pricing).

- **Back up:** sign in, open **People**, choose **Download backup**, and keep the `engtrack-backup-<date>.json` file outside the app, at least weekly. The page shows the last backup date and warns after 7 days.
- **Restore:** **People** > **Restore from file**. The file is checked first and the app asks for confirmation. Restoring replaces all current data, and anything added since the backup is lost. The same sign-in account must be used.
- **If the project is paused:** sign in to the Supabase dashboard and restore the project there, then check that the app loads.

The file contains client and project data, so don't commit it to this public repo.

## Chart and UI notes

- Charts use one blue series, or blue plus red for on-time/overdue (checked for colour-blind separation). Text never uses series colours; status badges carry an icon and a label.
- Recharts (MIT) for the monthly chart; the Gantt chart and calendar are custom, so there are no licence questions.

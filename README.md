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
npm run e2e        # browser tests in Chrome: demo at desktop and phone size, plus sign-in and saving (see below)
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

https://tactile4312.github.io/engtrack/ serves `docs/` from the `main` branch. To update: `npm run build && npm run build:demo` in `prototype/` (live build with the real Supabase values in the environment), copy **everything** in `prototype/dist/` into `docs/` and everything in `prototype/dist-demo/` into `docs/demo/` (the page plus the app icons and `manifest.webmanifest` from `prototype/public/`), commit and push. GitHub takes a minute or two to publish.

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
3. **Run `npm test`, `npm run e2e` and `npm run build` before publishing.** GitHub runs the tests, the demo build and the browser tests on every push; don't publish on a red check.

### Browser tests (`npm run e2e`)

Playwright drives the installed Google Chrome against fresh production builds (not the dev server). Tests live in `prototype/e2e/`:

- `demo.e2e.ts` runs at desktop and phone size: every screen opens without errors, create project, search, notes.
- `live.e2e.ts` runs the signed-in build against `fake-supabase.ts`, a stand-in that answers sign-in and table reads and writes in memory. The build is pointed at a fake address and every other outside request is blocked, so these tests can never touch the real or test database. They cover a wrong password, first sign-in, saving and reloading, and signing out safely (saving first, asking when a save failed, and stopping after a sign-out in another tab).

When a test fails, `npx playwright show-trace prototype/test-results/<test>/trace.zip` replays it step by step. On GitHub the traces are attached to the failed run.
4. **Try risky changes on a separate Supabase test project,** never on the client's data.

## Backups and restoring

The live app stores real data on a free Supabase project. This setup has no automatic backups you can rely on, and the free tier pauses a project after 7 days with no activity (as of 2026-10-21; check supabase.com/pricing).

- **Back up:** sign in, open **People**, choose **Download backup**, and keep the `engtrack-backup-<date>.json` file outside the app, at least weekly. The page shows the last backup date and warns after 7 days.
- **Restore:** **People** > **Restore from file**. The file is checked first and the app asks for confirmation. Restoring replaces all current data, and anything added since the backup is lost. The same sign-in account must be used.
- **If the project is paused:** sign in to the Supabase dashboard and restore the project there, then check that the app loads.

The file contains client and project data, so don't commit it to this public repo.

## Tasks and milestones

On a project's **Tasks & milestones** tab, admins and project managers add, edit and remove tasks and milestones (`can(user, 'plan')`). Engineers can tick tasks and milestones off but not change them; salespeople only view.

- A task has a name, belongs to one scope or the whole project, and has an optional assignee and due date (not after the project due date). Ticking it records today as its completion date; reopening clears it.
- Milestones need a name unique on the project and are kept in date order, undated ones last. New projects still start with the default seven.
- Removing a scope moves its tasks to the whole project. Removing sample data un-assigns sample people from tasks too.
- Every add, edit and removal is logged in the activity history.

Not built yet (from REQUIREMENTS.md section 12): task description, start date, priority, status, progress, dependencies and notes, and reminders for task due dates. Scopes already carry those fields, so tasks are kept as a simple checklist under each scope until the client asks for more.

## Working on two devices

Each saved record carries the time it was last written. The app remembers that time for everything it loaded or saved, and checks it before saving (`lib/versions.ts`, `saveDiff` in `lib/cloud.ts`). If another device or tab changed, removed or created the same record in the meantime, the save is held back and a banner offers **Reload** (take the other version; the change here is lost) or **Keep mine** (save over it). Records nobody else touched save as normal. When the tab comes back into view, the app also checks for changes saved elsewhere and offers a reload. No database change was needed: it uses the existing `updated_at` column. Settings (read reminders, backup date) are still last-write-wins.

## Quick search and reminders

- **Ctrl+K** (⌘K on a Mac), the search button in the desktop header, or **/** opens quick search: projects by number (even just the last digits), name, client or scope; clients; and every screen. Arrow keys and Enter, Escape to close. Matching lives in `lib/search.ts`.
- Tasks with a due date now get reminders: the assignee 3 days and 1 day before, on the day and when overdue; the project manager only when overdue, or all of them if the task is unassigned. Opening a task reminder lands on the project's Tasks tab.

## My week

**My week** (sidebar, under More on phones, or quick search) lists everything that is the signed-in person's own job and is overdue or due in the next 7 days: projects they manage and those projects' milestones, scopes they engineer, and tasks assigned to them. It is grouped by day, with overdue first. Tasks can be ticked off right there. The logic is in `lib/myweek.ts`; it only looks at projects the person can already see.

## Fun bits

- Ticking a task throws a little confetti from the checkbox; ticking a project's last open task throws a full-screen party. Typing the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) anywhere, or "party" in quick search, does the same. Canvas only, no library (`components/Confetti.tsx`), and off with reduced motion.
- **?** opens the keyboard shortcuts sheet (`components/Shortcuts.tsx`).
- The dashboard shows an engineering one-liner that changes once a day (`lib/fun.ts`).

## Installable app

`prototype/public/` holds `manifest.webmanifest` and the icons (rendered from the logo). On a phone, the browser's **Add to Home Screen** gives an EngTrack icon that opens full screen; desktop Chrome and Edge offer **Install**. There is no service worker, so the app still needs a connection (on purpose: an offline copy could show stale data).

## Motion

One small set of animations is defined in `tailwind.config.js` (fade, rise, pop, sheet, drop, toast, grow, shimmer) with shared timing. Screens fade in; dialogs pop (slide up from the bottom on phones); dashboard tiles, project cards and table rows enter in sequence (`.stagger` plus `staggerAt(i)`); numbers count up (`CountUp`); progress bars fill; loading shows a shimmering outline of the app. Two rules: page-level animations only fade, because a transform would move the dialogs inside a page; and fill mode is `backwards`, so nothing stays layered after it finishes. Everything is switched off when the system asks for reduced motion (`styles.css`).

## Chart and UI notes

- Charts use the brand pink, or pink plus orange-red for on-time/late. Re-checked 2026-11-06 after the pink theme: the pair stays distinct for the common red-green colour blindness types, but not for the rare blue-yellow type (tritanopia); a darker plum for "on time" would fix that. Text never uses series colours; status badges carry an icon and a label.
- Recharts (MIT) for the monthly chart; the Gantt chart and calendar are custom, so there are no licence questions.

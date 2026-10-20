# EngTrack (Engineering CRM Tracker)

Engineering Project Management CRM & Tracker: projects, nine engineering scopes per project, clients, assignments, deadlines and reminders, Gantt/calendar, dashboards, reports.

- Live prototype: https://tactile4312.github.io/engtrack/ (fictional demo data)
- Requirements: [REQUIREMENTS.md](REQUIREMENTS.md) (authoritative; confirmed decisions table at the top)
- Project memory: `Obsidian Vault\Projects\Engineering CRM Tracker\Project Hub.md`

## Status (2026-10-20)

| Phase | State |
|---|---|
| 2. Low-fidelity wireframes | Done: `design/wireframes-lowfi.html`, client copy + PDF in `design/client-share/` |
| 3. Polished mockups + clickable prototype | Done: `prototype/`, screenshots in `design/polished-mockups/`, client copy `design/client-share/EngTrack Prototype v0.2.html` (v0.2 adds add/edit clients) |
| 1, 4–8. Stack, database, real app, scheduler, deployment | Not started |

The prototype uses fictional demo data held in memory. It has no login, no database and no server-side reminders. See `design/CLIENT-DEMO.md` for what is prototype-only.

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
  capture.sh               regenerates design/polished-mockups/
```

## Run the prototype

Needs Node.js 18+ (tested with Node 24).

```bash
cd prototype
npm install
npm run dev        # http://localhost:5173 with live reload
npm test           # 26 rule tests (progress, validation, reminders, visibility, clients)
npm run build      # type-check + one self-contained file: dist/index.html
bash capture.sh    # after a build: refresh the PNG mockups (uses Chrome)
```

Open `dist/index.html` directly in a browser to use the built prototype without a server.

URL options (local file or dev server): `?screen=projects`, `?screen=project&id=CRM-2026-0142`, `?device=mobile`, `?user=u-e1`, `?bar=0` (hide the prototype bar for screenshots).

After `npm run build`, copy `prototype/dist/index.html` to `design/client-share/EngTrack Prototype vX.Y.html` for the client.

## Live prototype (GitHub Pages)

https://tactile4312.github.io/engtrack/ serves `docs/index.html` from the `main` branch. To update it, build, copy `prototype/dist/index.html` to `docs/index.html`, commit and push. GitHub takes a minute or two to publish.

## Chart and UI notes

- Charts use one blue series, or blue plus red for on-time/overdue (checked for colour-blind separation). Text never uses series colours; status badges carry an icon and a label.
- Recharts (MIT) for the monthly chart; the Gantt chart and calendar are custom, so there are no licence questions.

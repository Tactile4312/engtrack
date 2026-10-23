---
type: project
status: active
created: 2026-10-19
updated: 2026-10-21
tags:
  - project/engineering-crm
summary: Engineering Project Management CRM & Tracker for an engineering company - projects with multiple engineering scopes, assignments, deadline reminders, Gantt/calendar, dashboards, reports, plus desktop/mobile wireframes and a clickable client prototype.
source: Spec pasted into Claude Code 2026-10-19, saved as REQUIREMENTS.md in the project folder
---

# Engineering CRM Tracker

## Project Card

| Field | Value |
|-------|-------|
| Purpose | Replace manual project tracking at an engineering company with one platform for projects, scopes, clients, personnel, deadlines, reminders, tasks, milestones and schedules |
| Client | Not named in the spec. Use fictional demo data |
| Where the work happens | Claude Code, folder `[local project path]` |
| GitHub | https://github.com/Tactile4312/engtrack (public, branch `main`, pushed 2026-10-20). `node_modules` and `prototype/dist` are not committed. Live prototype: https://tactile4312.github.io/engtrack/ (GitHub Pages from `docs/`) |
| Spec | `REQUIREMENTS.md` in that folder (authoritative; confirmed decisions table at the top). Read-only copy: [[Requirements (copy)]]. Wireframes PDF: [[Engineering CRM - Wireframes v0.1.pdf]] |
| Status (as of 2026-10-21) | v0.3 single-user live app done and **tested live** (sign-in, auto-save, add/remove sample data) against Supabase project `mdvhgdaigbtqrafmuajc`; sign-ups disabled. Built into `docs/` (live at root, demo at `/demo/`) and pushed as `fb3f305` (author cheesuskrays) and live on GitHub Pages, verified 2026-10-21. Supabase URL + publishable key live only in `prototype/.env.local` (not in git) |
| Constraint | Free/open-source wherever possible; no mandatory paid APIs or subscriptions. Document any hosting limits or costs |
| Constraint | Wireframes (low-fi, then polished) and a clickable prototype before the full build, so the client can review first |

## Spec at a glance

- **Nine scopes per project, each tracked separately:** Lifting, Transport, Jacking & Skidding, Shutdown, Bridging, GBP Calculation, Route Survey, MS Study, DWG. Each has its own engineer, dates, status, progress, dependencies. Admins can edit the list later.
- **Statuses:** New Request, For Review, In Progress, On Hold, Waiting for Client, Waiting for Engineering, Completed, Cancelled. Priority: Low, Normal, High, Critical.
- **Roles:** Administrator, Project Manager, Engineer, Salesperson. Authorization enforced in the backend/database, not just the UI.
- **Reminders:** 7, 3, 1 days before, on the due date, plus a separate overdue alert. Server-side scheduler, deduped per item + recipient + interval. Channels in order: in-app, browser, email (if free).
- **Screens:** desktop at 1440x900 (Dashboard, Tracker, Details, Create/Edit, Gantt, Calendar + Notifications, Reports); mobile at 390x844 (Dashboard, Project List, Details, Create/Edit, Timeline, Notifications). Mobile uses cards and a schedule list, not a shrunken table or Gantt.
- **Preferred stack (spec):** React + TypeScript, Tailwind, PostgreSQL, Recharts, a free Gantt library or custom timeline. Supabase allowed if its free tier is verified first.
- **Phases:** 1 Requirements and architecture, 2 Low-fi wireframes, 3 Polished mockups and prototype, 4 Core app, 5 Monitoring, 6 Timeline and notifications, 7 Reports and testing, 8 Deployment and handoff.

## Open Items

- [ ] Phase 1: choose stack and hosting (verify free-tier limits as of build date), draft DB schema, list assumptions
- [x] Phase 2: low-fidelity desktop and mobile wireframes (2026-10-19)
- [x] Q1-Q8 answered 2026-10-20 → [[Decisions/Wireframe review answers Q1-Q8]]
- [x] Q8 import skipped for now (2026-10-20)
- [x] Progress = simple average of scopes, no PM override (Q2)
- [x] App name is **EngTrack** (2026-10-20). Client stays unnamed; demo data is fictional
- [x] Phase 3: polished mockups + clickable prototype v0.1 (2026-10-20)
- [x] Add/edit clients in the prototype (v0.2, 2026-10-20) → [[Sessions/2026-10-20 - Prototype v0.2 add clients]]
- [x] Uploaded to public GitHub repo `Tactile4312/engtrack` (2026-10-20) → [[Sessions/2026-10-20 - Uploaded to GitHub]]
- [x] Live prototype on GitHub Pages (2026-10-20) → [[Sessions/2026-10-20 - Live prototype on GitHub Pages]]
- [x] GitHub history cleaned: author is cheesuskrays, no real name (force-pushed and verified 2026-10-20) → [[Sessions/2026-10-20 - Hide real name in GitHub history]]
- [x] Demo the prototype to the client: she liked it and wants to use it now (2026-10-21)
- [x] Supabase project created, schema run, user created, sign-ups off (2026-10-21)
- [x] Live mode tested end-to-end (2026-10-21)
- [x] v0.3 pushed and live: sign-in at the Pages root, demo at `/demo/` (verified 2026-10-21)
- [ ] Change/delete the test user test credentials were discussed privately
- [ ] Confirm at the demo: should the Create form show the next free project number as a hint? (assumption built into v0.1)
- [ ] Optional: PowerPoint deck from `design/polished-mockups/`

## What to Load

| Task | Load These | Skip |
|------|-----------|------|
| Status | This card, then the newest note in `Sessions/` | |
| Any build work | The relevant Part/section of `REQUIREMENTS.md` only (use headings: Part A to Part M) | The whole spec when only one area is involved |
| Prototype change | `README.md` layout section, then only the file in `prototype/src/` involved. Rules are in `src/lib/rules.ts`; run `npm test` and `npm run build` after | Rebuilding mockups unless screens changed |
| Why a design choice | `Decisions/` | |

## Graph Recall

Graph: `...\Engineering CRM Tracker\graphify-out\graph.json` (code-only `graphify update` run 2026-10-20: 381 nodes, 1,215 edges, 25 communities; `node_modules` and `dist` excluded). Good for: what imports or breaks if a `prototype/src/` file changes, e.g. `graphify affected "rules.ts" --graph <graph.json>` lists every page and lib that imports it. Not covered: Markdown docs (`REQUIREMENTS.md`, `README.md`), `styles.css`, and `main.tsx`/config files (no symbols). `graphify-out/` is in `.gitignore` because it holds local absolute paths and the GitHub repo is public. Refresh with `graphify update "[local project path]"` after code edits.

## Security Rule

Follows the vault rule [[CLAUDE#Hard Rules|no secrets in notes]]. Here: secrets live in environment variables, never in code; `.env*` stays in `.gitignore`; run a secret scan before every push to the public repo; commit as the GitHub noreply identity so the real name stays off GitHub ([[Sessions/2026-10-20 - Hide real name in GitHub history]]).

## Related

- [[Sessions/2026-10-21 - Single-user live version v0.3]]
- [[Decisions/Single-user trial on Supabase]]
- [[Sessions/2026-10-20 - Hide real name in GitHub history]]
- [[Sessions/2026-10-20 - Live prototype on GitHub Pages]]
- [[Sessions/2026-10-20 - Uploaded to GitHub]]
- [[Sessions/2026-10-20 - Prototype v0.2 add clients]]
- [[Decisions/Wireframe review answers Q1-Q8]]
- [[Sessions/2026-10-20 - Clickable prototype v0.1]]
- [[Sessions/2026-10-20 - Q1-Q8 decisions recorded]]
- [[Sessions/2026-10-19 - Project set up and low-fi wireframes]]
- [[HOME]]

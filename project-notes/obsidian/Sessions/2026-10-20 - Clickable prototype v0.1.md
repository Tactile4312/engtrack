---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: Built EngTrack prototype v0.1 (React + TS + Tailwind, one-file build) applying Q1-Q8; 14 polished mockup PNGs; 21 rule tests and 25 browser flow checks passing; client copy, private artifact link and demo notes made.
---

# 2026-10-20 - Clickable prototype v0.1

## Objective
Phase 3: polished mockups and a clickable prototype using the confirmed rules (Q1-Q8). project owner also decided: app name **EngTrack**, skip the import (Q8), and add the decisions to the requirements.

## Work Completed
- `REQUIREMENTS.md`: "Confirmed decisions" table added at the top (name, Q1-Q8, Q8 skipped). Vault copy: [[Requirements (copy)]]. Wireframe PDF copied to vault `Attachments/`.
- `prototype/`: React 18 + TypeScript + Tailwind 3 + Recharts, built with Vite into one HTML file. Screens: Dashboard, Projects, Project details (scope update, status change, tasks/milestones, notes, activity), Create/Edit/Duplicate, Timeline (custom Gantt, mobile list), Calendar, Notifications, Reports (11), Clients, mobile More. Prototype bar: switch user/role, Desktop/Mobile phone preview, Reset demo.
- Rules in `src/lib/rules.ts`: progress = average of scopes; Q7 visibility; CRM-YYYY-NNNN with duplicate block and next-free hint; reminder schedule with Q4 recipients, weekly overdue repeats, unique keys, none for closed work.
- Demo data: 23 fictional projects, dates relative to the day the page opens.
- `design/polished-mockups/`: 8 desktop + 6 mobile PNGs (`prototype/capture.sh` regenerates them).
- Client files: `design/client-share/EngTrack Prototype v0.1.html`; private artifact [private artifact link redacted]; `design/CLIENT-DEMO.md` (talk track, prototype vs full build, checklist).

## Decisions
- Prototype lives in its own `prototype/` folder (mock data, no backend) so the production app can be built cleanly later.
- Gantt and calendar are custom (no library licence questions); Recharts (MIT) only for the monthly chart.
- Project-level reminders go only to engineers with open scopes on that project (found while checking the mobile notifications).
- Light theme only, on purpose, for the client demo.
- Assumption (not confirmed by project owner): the next free project number is shown as a hint on the Create form. Q3 only said "typed in, editable, not automatic". Ask at the demo.

## Mistakes and Lessons
- Headless Chrome on this PC: `--screenshot` paths must be absolute and without `..`; window width can't go below about 500 px, so mobile mockups are captured inside the phone frame.
- Heredocs strip regex backslashes; edit regex code with the Edit tool.

## Verification
- `npm test`: 21/21 pass (progress, number format/duplicates, date checks, reminder recipients/dedupe/reschedule/stop on completion, visibility).
- `tsc --noEmit` clean; build OK (~700 KB single file).
- Browser run on `vite preview`: 25 scripted checks passed (create with validation, scope update → progress 0→40%, activity log, status change, search/filter, export rows, notification opens + marks read, engineer visibility, KPI click-through, Gantt bar and calendar item open project, completion removes reminders, archive, report, mobile layout). No console errors.
- Not verified: the artifact page in the claude.ai viewer (downloads are blocked there; Copy works as the fallback).

## Current State
- Phases 2 and 3 done. No stack/database/backend yet.
- Both claude.ai artifacts (wireframes [private artifact link redacted], prototype link above) are private until project owner shares them from the page's Share menu. The HTML file in `design/client-share/` can be sent directly instead.
- Results summary handed to project owner at end of session. No PowerPoint deck made yet.

## Next Steps
- project owner demos to the client (`design/CLIENT-DEMO.md`); collect feedback per screen.
- Optional: PowerPoint deck from the mockups (spec section 34).
- Then Phase 1/4: choose hosting + database (verify free tiers), schema, auth, real persistence, server-side reminder job.

## Related
- [[Project Hub]]
- [[Decisions/Wireframe review answers Q1-Q8]]
- [[Sessions/2026-10-20 - Q1-Q8 decisions recorded]]

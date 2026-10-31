---
type: session
date: 2026-10-31
project: Engineering CRM Tracker
summary: Set up the repo and an Obsidian vault on a new PC, reviewed phases 4-8, added backups and fixes (v0.3.1), restructured the code with more tests and a GitHub check (v0.3.2), and published both. Signed-in use against real data is not yet checked.
---

# 2026-10-31 - Backups, hardening and safer structure

## Summary
Set up EngTrack on a new PC, reviewed how far the build has come, then published two updates. Client data was not touched: all signed-in testing used a separate Supabase test project.

## Setup
- Cloned the repo and installed Obsidian.
- Created a new vault from `project-notes/obsidian/`. The repo holds redacted copies with no `.obsidian` config, and the original vault was not on this PC.
- `[[HOME]]` and `[[CLAUDE]]` don't resolve in that vault, because those notes aren't in the repo.

## Phase review (phases 4-8)
| Phase | State | Missing |
|---|---|---|
| 4. Core app | Partial | Real roles, database-enforced permissions, proper tables |
| 5. Monitoring | Mostly done | Tasks and milestones appear to only tick on and off |
| 6. Timeline and notifications | Partial | Server reminder job, browser alerts, email |
| 7. Reports and testing | Partial | PDF export, printable summaries, authorization checks |
| 8. Deployment and handoff | Early | Background job setup, final test checklist |

The gaps are mostly expected: the multi-user build waits on management approval ([[Decisions/Single-user trial on Supabase]]).

## v0.3.1 (`b5a10bc`, live)
- Backup download and checked restore on the People page, with last-backup date and a 7-day warning.
- Fixed auto-save retrying nonstop after a failed save.
- Removed fake attachments and false reminder, client form and export messages from the live app.
- CSV exports treat text starting with a formula character as plain text, and quote carriage returns.
- One-word names show in full.
- README covers backup, restore and paused projects.

## v0.3.2 (`923b276`, live)
- Moved state and reducer to `store/state.ts` and `store/reducer.ts`, and auto-save to `lib/autosave.ts`.
- Removed import loops and shared one id helper.
- Added crash screens for one screen and for the whole app.
- `lib/normalize.ts` fills in missing fields on older records and backups.
- Unknown `?screen=` links open the dashboard. Changes to a missing task, scope or milestone are ignored.
- GitHub check runs tests and the demo build on every push.
- README has an "Adding a feature safely" section.

## Verified
- 108 automated tests pass (37 before v0.3.2). 6 deliberate bugs were all caught.
- Browser checks passed on a production build against the test project: backup, restore, offline retry, older records, crash screens, CSV, mobile.
- GitHub check passed. After publishing, the live sign-in page and demo load with no page errors.

## Not verified
- Signed-in use of the live site against real data, including the first load through `normalize`.
- Automated tests don't click through screens. The browser scripts used here were temporary and aren't in the repo.

## Decisions
- Don't upload raw chat logs to this public repo. Keep redacted notes here instead.
- Test risky changes on a separate Supabase project, never on client data.
- Leave long screens like `ProjectDetails.tsx` alone until a feature touches them.

## Next Steps
- Sign in to the live app, check the data, and download a real backup.
- Tell the client to refresh, and that backups are now her job at least weekly.
- Change or delete the real project's test user.
- Turn off sign-ups on the test project or delete it. Its test login was shared in chat.
- Update the 6 vulnerable development tools one at a time. They don't affect the live app.
- `recharts` 2.x is deprecated, so plan the move to v3 when convenient.

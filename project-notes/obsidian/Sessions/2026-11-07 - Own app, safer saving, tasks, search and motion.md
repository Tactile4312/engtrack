---
type: session
date: 2026-11-07
project: Engineering CRM Tracker
summary: The client left and EngTrack became the owner's own app. Added safer sign-out, browser tests, task and milestone editing, two-device conflict protection, task reminders, quick search, an installable app, a design and motion pass, a My week page and some fun (confetti, shortcuts sheet, daily one-liner). Published to GitHub Pages after local checks, because GitHub Actions is blocked by a billing lock.
---

# 2026-11-06 to 2026-11-07 - Own app, safer saving, tasks, search and motion

## Context
- 2026-11-07: the client left. EngTrack is now the owner's own app, with permission to change and publish freely.
- The real Supabase project may still hold the former client's records. They were not touched or deleted. Take a backup before any clean-up.
- GitHub Actions stopped running on 2026-11-06 ("account is locked due to a billing issue"). Pages still deploys. Every publish below was checked locally first (unit tests, browser tests, build checks).

## What changed

| Area | Change |
|---|---|
| Data safety | Sign-out saves any waiting change first and asks if it could not be saved; leftover saves stop when the session ends (also after signing out in another tab). |
| Data safety | Two-device protection: before saving, the app compares each record's last-written time with the database. If another device changed it, a banner offers Reload or Keep mine. Returning to the tab also checks for changes made elsewhere. No schema change. |
| Feature | Tasks and milestones can be added, edited and removed (admins and PMs); ticking records a completion date; removing a scope moves its tasks to the whole project. |
| Feature | Task reminders: assignee at 3 days, 1 day, on the day and overdue; PM when overdue (or everything if unassigned). |
| Feature | Quick search (Ctrl+K, the header search button, or "/"): projects by number, name, client or scope; clients; screens. |
| App feel | Installable: manifest and icons, so it can go on a phone's home screen. No service worker, on purpose (no stale offline copy). |
| Design | Redesigned sign-in (brand panel and form, show-password), loading skeleton, dashboard tiles with icons and count-up numbers, card shadows, staggered entrances, animated dialogs, toasts, progress bars and navigation. Reduced-motion turns all of it off. |
| Small fixes | Form field alignment, field hint kept under errors, mobile card separator, dashboard date font, demo sidebar label. |
| Feature | My week: one page with everything that is yours, overdue or due in the next 7 days, grouped by day; tasks can be ticked there. |
| Fun | Confetti when ticking a task (a full party for a project's last task), the Konami code, "party" in quick search, a shortcuts sheet on "?", and a daily engineering one-liner on the dashboard. Off with reduced motion. |
| Testing | Playwright browser tests at desktop and phone size against production builds; signed-in tests use an in-memory fake Supabase, so they never touch real data. |

## Verified
- Unit tests: 157 pass. Browser tests: 22 demo tests passed in the last full run; all 11 signed-in tests passed before publishing `473f0aa`.
- Final publish `3e41ba0` (My week and fun bits): 164 unit tests pass; browser tests 36 passed, 3 skipped on purpose (desktop-only keyboard checks). My week checked by eye at desktop and phone size.
- Each safety feature was checked by turning it off on purpose: the related tests fail without it.
- Published builds were checked for the real project address and for no test-project or fake address and no secret key; the live sign-in page and demo loaded without errors.

## Not verified
- Signed-in use against the real database (nobody signed in to the real account in this session), including My week.
- GitHub Actions on these commits (off: billing lock).

## Decisions
- Tasks stay a simple checklist under scopes. Description, priority, status, progress and dependencies for tasks are deferred.
- Page-level animations only fade, and fill mode is `backwards`; see README "Motion".
- Browser tests run 2 at a time; this laptop runs short of memory.
- My week shows only the person's own items (projects they manage and those milestones, scopes they engineer, tasks assigned to them), overdue first, then the next 7 days.
- Fun features stay light: canvas confetti with no library, and everything is off with reduced motion.

## Next steps
- GitHub checks stay off (billing lock, not being paid). Run `npm test` and `npm run e2e` locally before every publish.
- Sign in to the live app, check the data, and download a backup before any clean-up of the former client's records.
- Decide what to do with the former client's data now that the app is personal (keep, export, or delete after a backup).
- Ideas: dark mode (needs the hard-coded colours moved to theme tokens first), CSV import.

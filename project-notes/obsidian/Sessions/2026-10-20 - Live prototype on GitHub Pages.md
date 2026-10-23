---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: Prototype v0.2 published on GitHub Pages at https://tactile4312.github.io/engtrack/ (served from docs/ on main); tested live in Chrome.
---

# 2026-10-20 - Live prototype on GitHub Pages

## Objective
project owner asked for the prototype to be viewable from GitHub.

## Work Completed
- `docs/index.html`: copy of the v0.2 single-file build (identical to `prototype/dist/index.html`), plus `docs/.nojekyll`.
- README: live link at the top and a "Live prototype (GitHub Pages)" section with update steps.
- Commit `872d71c` pushed. GitHub Pages enabled through the API: source branch `main`, folder `/docs`.

## Decisions
- Serve the built file from `docs/` rather than a GitHub Actions build. The gh token has no `workflow` scope, so pushing a workflow file would fail. This approach also needs no build on GitHub.

## Verification
- Pages build status "built"; the URL returns HTTP 200.
- Opened https://tactile4312.github.io/engtrack/ in Chrome: dashboard, Clients with **Add client**, Timeline, and Export all worked, with no console errors.
- Unlike the claude.ai viewer, CSV download works on Pages. The test left `Downloads\engtrack-projects-2026-10-20.csv` (fictional demo data, 2 KB).

## How to update the live prototype
1. `cd prototype`, then `npm run build`.
2. Copy `prototype/dist/index.html` to `docs/index.html` (and to `design/client-share/EngTrack Prototype vX.Y.html`).
3. Commit and `git push`. Pages republishes in about 1-2 minutes.

## Next Steps
- Share https://tactile4312.github.io/engtrack/ with the client; demo and collect feedback.
- Then Phase 1/4 (stack, database, auth).

## Related
- [[Project Hub]]
- [[Sessions/2026-10-20 - Uploaded to GitHub]]

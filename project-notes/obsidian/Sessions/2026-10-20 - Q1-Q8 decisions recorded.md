---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: project owner answered the 8 points to confirm from wireframes v0.1. All proposals accepted except Q3 (project numbers typed in, not auto-generated). Recorded as a decision; Project Hub updated.
---

# 2026-10-20 - Q1-Q8 decisions recorded

## Objective
Record project owner answers to the "Points to confirm" (Q1-Q8) at the end of the low-fi wireframes, so stage 2 can start.

## Work Completed
- Wrote [[Decisions/Wireframe review answers Q1-Q8]] (all 8 answers plus what they mean for the build).
- Project Hub: status, open items and related links updated.
- Answered two questions from project owner (no files changed):
  - **Phone:** the session can be continued from the phone with `/remote-control` while the PC stays on. The wireframe artifact link also opens in the Claude app. The folder is not a git repo, so cloud Claude Code can't reach it.
  - **Why the code folder is outside the vault:** it follows the existing convention (vault = memory, project folder = source of truth), and app files like `node_modules` would slow Obsidian and its sync.

## Decisions
- Q1-Q8: proposals accepted. Q3 changed: project number is typed in and editable, not auto-generated "for now" (format CRM-YYYY-NNNN, duplicates blocked). Q6: the spec's example milestones are the real default set.
- Assumption to confirm: for Q3, showing the next free number as a hint (not filled in) is acceptable.

## Current State
- Phase 2 (low-fi wireframes) done; v0.1 in `design/client-share/`. The Q section of the wireframes still shows the questions, not the answers. Update it in the next version.
- No stack chosen, no code.

## Next Steps
- Phase 3: polished desktop + mobile mockups and a clickable prototype that use the Q1-Q8 rules (waiting for project owner go-ahead).
- Phase 1: choose stack/hosting (verify free tiers), draft DB schema.
- Get the current tracking sheet or its column list (needed for the Q8 import).
- Get the real client name and app name (placeholder "EngTrack").
- Offered, no answer yet: copy `REQUIREMENTS.md` and the wireframe PDF into the vault so they can be read in Obsidian.

## Related
- [[Project Hub]]
- [[Sessions/2026-10-19 - Project set up and low-fi wireframes]]

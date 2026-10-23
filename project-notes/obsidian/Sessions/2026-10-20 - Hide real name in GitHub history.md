---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: Rewrote the two commits so the author is cheesuskrays (GitHub noreply email) and REQUIREMENTS.md no longer names project owner; project owner force-pushed and GitHub plus the Pages site were verified clean.
---

# 2026-10-20 - Hide real name in GitHub history

## Objective
project owner saw his real name on the public repo and asked for the author to be **cheesuskrays** instead.

## Findings
- His name and Gmail were the author on both commits. The only file mention was REQUIREMENTS.md line 8 ("confirmed by project owner"). A byte search of all tracked files, PDF and PNGs included, found nothing else.
- GitHub profile name is Sage4life and the login is Tactile4312; neither is his real name.

## Work Completed (local only)
- Repo-local git identity is now `cheesuskrays` <[GitHub noreply email]>. That is GitHub's private noreply address for account id 114903179.
- `git filter-branch` rewrote both commits (author and committer) and changed the REQUIREMENTS line to "confirmed by the project owner". New IDs: `8e72be6` (initial) and `4af6745` (Pages). `git diff --stat` against the old history shows only that one line changed.
- A search of every commit for "project owner|[redacted]" returned nothing.
- Updated [[Sessions/2026-10-20 - Uploaded to GitHub]] with the new author.

## Not Done / Blocked
- **The force push was blocked** by Claude Code's auto-mode safety check (history rewrite). GitHub `main` is still at old commit `872d71c`, so the name is still public.
- To finish, project owner runs:
  `! cd "[local project path]" && git push --force-with-lease origin main`
- The backup ref `refs/original/refs/heads/main` (old history) still exists locally. Delete it after the push with `git update-ref -d refs/original/refs/heads/main`.
- Even after a force push, GitHub may keep the old commits reachable by direct SHA for a while. The certain fix is to delete the repo on GitHub and recreate `engtrack` from the cleaned local copy, then turn Pages back on (`main` /docs). Offered to project owner; not chosen yet.

## Resolved (same day)
- project owner ran the force push himself: `872d71c...4af6745 (forced update)`.
- Verified on GitHub:
  - `main` = `4af6745`
  - both commits show author and committer cheesuskrays with the noreply email
  - REQUIREMENTS.md on GitHub has no "project owner" or "[redacted]"
  - Pages rebuilt from `4af6745`; https://tactile4312.github.io/engtrack/ returns 200 and includes the Add client feature
- Local backup ref `refs/original/...` deleted. The old commits may stay reachable on GitHub by direct SHA for a while; the repo was not deleted and recreated.

## Mistakes and Lessons
- Ask about the public commit name *before* the first push to a public repo. Default to the GitHub noreply email, not a personal address.

## Next Steps
- project owner: run the force push (or delete the repo so it can be recreated).
- Then check: `git ls-remote origin refs/heads/main` shows `4af6745...`, the GitHub commit page shows cheesuskrays, and https://tactile4312.github.io/engtrack/ still loads.

## Related
- [[Project Hub]]
- [[Sessions/2026-10-20 - Live prototype on GitHub Pages]]

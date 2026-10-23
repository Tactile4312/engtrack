---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: Project folder put under git and pushed to a public GitHub repo, github.com/Tactile4312/engtrack (renamed from engineering-crm-tracker). GitHub CLI installed and signed in.
---

# 2026-10-20 - Uploaded to GitHub

## Objective
project owner asked to upload the project to GitHub.

## Decisions (project owner answers)
- Install the GitHub CLI; project owner signed in himself with `gh auth login` in the browser, as account **Tactile4312**. That account also belongs to the orgs Muyot-project and RENATO-GROUP, which were not used.
- **Public** repo on the personal account. I warned that `REQUIREMENTS.md` and the design files describe the client's workflow (the client is not named).
- Commit author for this repo only: `cheesuskrays` with GitHub's private noreply email ([GitHub noreply email]). project owner did not want his real name public; both commits were rewritten on 2026-10-20 (new IDs `8e72be6`, `4af6745`), and "confirmed by project owner" in REQUIREMENTS.md became "confirmed by the project owner".
- Name: first created as `engineering-crm-tracker`, then renamed to **engtrack** at project owner request. The old URL redirects.

## Work Completed
- GitHub CLI 2.102.0 installed with winget at `C:\Program Files\GitHub CLI\gh.exe`. It is not on PATH in Claude's shell, so call it by full path. `gh auth setup-git` was run, so git pushes use the gh login.
- Project folder `Documents\Engineering CRM Tracker\` is now a git repo on branch `main`, with remote `origin` = https://github.com/Tactile4312/engtrack.git.
- `.gitignore` excludes `node_modules/`, `prototype/dist/`, `.env*` (except `.env.example`), and OS/editor files. `.gitattributes` sets LF line endings and marks PNG/PDF as binary.
- First commit `eaa1f94`: 59 files, about 4.9 MB (spec, wireframes and PDF, 14 mockups, demo notes, prototype source, client HTML v0.1 and v0.2).

## Verification
- Secret scan (passwords, keys, tokens, private keys) before the commit found nothing; the only hits were the spec's own rules about secrets.
- After the push, GitHub showed the repo as PUBLIC, branch `main` at `eaa1f94`, with 59 files. After the rename, `git ls-remote` against the new URL returned the same commit.

## Next Steps
- To upload later changes: commit in the project folder, then `git push`.
- Client demo and feedback; then Phase 1/4 (stack, database, auth).

## Related
- [[Project Hub]]
- [[Sessions/2026-10-20 - Prototype v0.2 add clients]]

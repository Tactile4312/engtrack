---
type: session
status: complete
created: 2026-10-20
tags:
  - project/session
summary: Prototype v0.2 adds Add/Edit client (Clients page and "+ New client" in the project form), with validation and role rules; 26 tests and browser checks passing; client copy v0.2 and the shared link updated.
---

# 2026-10-20 - Prototype v0.2: add clients

## Objective
project owner asked why a client could not be added. v0.1 only had a read-only client directory, and the project form only offered the seed clients. That gap was mine, not a spec decision.

## Work Completed
- `src/components/ClientModal.tsx`: Add/Edit form with Client name, Company name (optional, new `company` field), Contact, Email, Phone, Address, Salesperson, Notes.
- `validateClient` in `src/lib/validation.ts`: required fields, duplicate names blocked (ignoring case and extra spaces), email format, phone 7-15 digits.
- `src/lib/rules.ts`: `addClient` permission for admin, PM and salesperson (not engineer); `canEditClient` lets a salesperson edit only their own clients.
- Clients page: **Add client** button and **Edit** on the client card. Project form: **+ New client…** at the end of the Client list, which selects the new client after saving.
- Salesperson-created clients are assigned to that salesperson, so Q7 visibility keeps working.
- Client copy `design/client-share/EngTrack Prototype v0.2.html` (v0.1 kept). README and `CLIENT-DEMO.md` updated (talk-track step 11).
- Published to the same link, [private artifact link redacted], which is now shared as "anyone with the link", so viewers see v0.2 straight away.

## Verification
- `tsc` clean; `npm test` 26/26 (5 new client tests).
- Browser on `vite preview`, all passed:
  - empty and invalid form errors
  - duplicate name blocked
  - add and edit a client
  - "+ New client" in the project form, then a project created for the new client
  - salesperson Dan Ocampo sees that project and can edit his client, but not someone else's
  - engineer has no Add button
  - mobile layout for a salesperson, with the salesperson fixed to them
- No console errors.
- Fixed during testing: Email and Phone were side by side in the phone preview; they now stack on mobile.
- Not verified: the updated page inside the claude.ai viewer.

## Mistakes and Lessons
- Python is not installed on this PC; use the Edit tool or sed for scripted edits.
- Port 4173 was taken; preview ran on 4181.

## Next Steps
- Client demo and feedback.
- Full build: clients stored in the database, with permissions enforced on the server.

## Related
- [[Project Hub]]
- [[Sessions/2026-10-20 - Clickable prototype v0.1]]

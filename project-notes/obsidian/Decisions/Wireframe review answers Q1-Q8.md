---
type: decision
status: accepted
created: 2026-10-20
tags:
  - project/engineering-crm
  - decision
summary: project owner answers to the 8 "Points to confirm" in wireframes v0.1. All proposals accepted; Q3 changed to manual project numbers.
---

# Wireframe review answers (Q1-Q8)

Answered by project owner on 2026-10-20 against the "Points to confirm" section of `design/wireframes-lowfi.html` (v0.1). These are the rules for the build.

| # | Topic | Decision |
|---|-------|----------|
| Q1 | Scope list | The 9 scopes as named: Lifting, Transport, Jacking & Skidding, Shutdown, Bridging, GBP Calculation, Route Survey, MS Study, DWG. Admins can add or rename scopes later |
| Q2 | Overall progress | Simple average of the project's scope progress (e.g. 100, 60, 50, 20 → 58%). No duration weighting and no PM override for now |
| Q3 | Project number | **Changed from the proposal:** typed in by the user and editable, **not auto-generated** for now. Format CRM-YYYY-NNNN (e.g. CRM-2026-0142) is the expected pattern. Duplicates are always blocked |
| Q4 | Reminder recipients | Assigned engineer: every step (7, 3, 1 day, due today, overdue). Project manager: 1 day, due today, overdue. Salesperson: overdue only. Email only if a company mail account is set up |
| Q5 | Statuses | The 8 default statuses, used for both projects and scopes: New Request, For Review, In Progress, On Hold, Waiting for Client, Waiting for Engineering, Completed, Cancelled |
| Q6 | Milestones | The spec's example set is the real default, added to every new project and editable per project: Request Received, Engineering Review, Scope Confirmation, Calculation Completed, Drawing Completed, Client Approval, Project Completion |
| Q7 | Visibility | Engineers see projects they are assigned to. Salespeople see their own clients' projects. PMs and admins see all |
| Q8 | Existing data | **Skipped for now** (changed 2026-10-20). No import at launch; can be added later |

## Implications for the build

- Create form (D4/M4): Project number is a required, editable text field. Check the format CRM-YYYY-NNNN and block duplicates. Optionally suggest the next free number, but don't fill it in automatically.
- Progress is calculated, not stored by hand. The project's progress bar is read-only.
- Reminder recipient rules go in the scheduler config, so they can change later without code edits.
- Visibility is enforced in the backend and database policies (spec Part F), not only by hiding things in the UI.
- No import work for now (Q8 skipped).

## Related
- [[Project Hub]]
- [[Sessions/2026-10-19 - Project set up and low-fi wireframes]]

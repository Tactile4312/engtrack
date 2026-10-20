# EngTrack: client demo notes (prototype v0.2)

Written 2026-10-20 for presenting the clickable prototype. All names, clients and projects in it are fictional.

## What to send or open

| File | Use |
|------|-----|
| `client-share/EngTrack Prototype v0.2.html` | The clickable prototype (v0.2 adds Add/Edit client; v0.1 kept for reference). One file; double-click to open in Chrome or Edge. Works offline (fonts fall back to the system font). |
| `client-share/Engineering CRM - Wireframes v0.1.pdf` | Stage 1 wireframes with notes and the user flow. |
| `polished-mockups/*.png` | Still images of 8 desktop and 6 mobile screens, for slides or email. |
| claude.ai link (private until shared) | https://claude.ai/artifact/A3vZbjaWG3TG3nqsHFdSGH |

The yellow bar at the top of the prototype is the demo control panel: **Viewing as** (switch person and role), **Auto / Desktop / Mobile** (phone preview), and **Reset demo**.

## Talk track (about 10 minutes)

1. **Why.** Projects are tracked by hand today, so it is hard to see what is late, who is overloaded, and which scope is holding a project up. EngTrack keeps it all in one place.
2. **Dashboard.** Eight numbers at the top: total, new requests, active, due today, due this week, overdue, completed, on hold. Each one opens the matching list. Red means something needs action. Point out that projects and individual scopes are counted separately.
3. **Projects list.** Search by CRM number, project or client; filter by status, scope, client, salesperson, engineer, priority and due date. Overdue rows have a red edge. Click **Overdue only**, then **Export**.
4. **One project, several scopes.** Open *CRM-2026-0142 Reactor Vessel R-301 Lift*. Four scopes, each with its own engineer, dates, status and progress. Overall progress is the average of the scopes (58%). Click **Update** on Lifting, move progress to 80%, save: the overall figure and the activity history update.
5. **Create a project.** **Add project**: type an existing number such as CRM-2026-0142 to show the duplicate check, then use the suggested next number. Tick several scopes and give each its own engineer and due date. Put the due date before the start date to show the date check.
6. **Timeline.** Each project is a bar with its scopes underneath. Today line, milestones (diamonds), dependencies (arrows), overdue work in red with a dotted line up to today. The yellow box lists schedule risks, such as one engineer with overlapping overdue work.
7. **Calendar.** Project deadlines, scope deadlines and milestones by month or week. Click any item to open it.
8. **Reminders.** Notifications page: who gets what (engineer every step; PM 1 day before, due today and overdue; salesperson overdue only). Open one: it jumps to the project and marks itself read. Switch to **Jun Cruz · Engineer** to show an engineer's own inbox.
9. **Roles.** Still as Jun Cruz: he only sees projects he works on and cannot create or edit projects, only update his own scopes. Switch to a salesperson: they see their own clients' projects and can submit a new request.
10. **Mobile.** Click **Mobile**: cards instead of tables, a bottom menu, and **Update progress** on a scope card, the way an engineer would use it on site.
11. **Clients.** Clients page → **Add client**: name, company, contact, email, phone, address, salesperson, notes. Try an existing name to show the duplicate check. In **Add project**, the Client list ends with **+ New client…** to register one without leaving the form. Engineers cannot add clients; a salesperson edits only their own.
12. **Reports.** Completion statistics, overdue, due in 7 or 30 days, by scope, by client, workload, on hold, scope-level delays. One filter bar for all; export.

## Prototype vs full build

| In the prototype | Comes with the full build |
|---|---|
| All screens and navigation, desktop and mobile | Real login, user accounts and passwords |
| Fictional demo data, dates relative to today | Your real projects in a database (PostgreSQL) |
| Changes kept until the page is reloaded | Changes saved permanently, for all users |
| Reminders worked out from the demo dates | A server job that sends reminders daily, even when nobody is logged in |
| In-app notifications | Browser alerts (with each user's permission) and email (needs a company mail account) |
| Role switcher to preview each role | Permissions enforced on the server, not only on screen |
| CSV export and copy (downloads may be blocked in the claude.ai preview) | PDF export, printable project summaries, file attachments |
| Fixed scope and status lists | Admin screens to manage scopes, statuses, users and reminder settings |

## Rules already built in (confirmed 2026-10-20)

- Nine scopes: Lifting, Transport, Jacking & Skidding, Shutdown, Bridging, GBP Calculation, Route Survey, MS Study, DWG.
- Overall progress is the average of the project's scopes.
- Project numbers are typed in (format CRM-YYYY-NNNN), never duplicated; the next free number is shown as a hint only.
- Reminder steps: 7, 3 and 1 day before, on the day, and overdue alerts weekly until closed. Completed or cancelled work gets none.
- Default milestones: Request Received, Engineering Review, Scope Confirmation, Calculation Completed, Drawing Completed, Client Approval, Project Completion.
- Engineers see their assigned projects; salespeople see their clients' projects; project managers and admins see everything.

## Demo checklist

- [ ] Open the prototype once before the meeting (loads the fonts).
- [ ] Click **Reset demo** before starting.
- [ ] Start as **Leo Santos · Project Manager** on the Dashboard.
- [ ] Have a project number ready to show the duplicate check (CRM-2026-0142).
- [ ] For a projector, zoom the browser to 110–125% if text looks small.
- [ ] Note the client's comments per screen for the next version.

---
type: reference
created: 2026-10-20
tags:
  - project/engineering-crm
summary: Read-only copy of REQUIREMENTS.md for reading in Obsidian. The original in the project folder is authoritative.
---

> [!note] Copy for reading only. The authoritative file is `Documentsngineering CRM Tracker\REQUIREMENTS.md`. Edit there, then re-copy. Copied 2026-10-20.

# PROJECT: ENGINEERING PROJECT MANAGEMENT CRM & TRACKER
## Complete Application Development + Desktop/Mobile Wireframes + Client Presentation Prototype

> Source spec, added 2026-10-19. This is the authoritative requirements document for the project. Vault summary: `Obsidian Vault\Projects\Engineering CRM Tracker\Project Hub.md`.

## CONFIRMED DECISIONS (added 2026-10-20)

These were confirmed by project owner after the wireframe review (v0.1, "Points to confirm" Q1-Q8). Where they are more specific than the original spec below, they take precedence. The original spec text is unchanged.

| # | Topic | Decision |
|---|-------|----------|
| — | Application name | **EngTrack** |
| Q1 | Engineering scopes | The 9 scopes in section 3B, as named. Administrators can add or rename scopes later. |
| Q2 | Overall project progress | Simple average of the project's scope progress percentages (e.g. 100, 60, 50, 20 → 58%). Calculated, read-only; no duration weighting and no manual override for now. |
| Q3 | Project number | Typed in by the user and editable; **not auto-generated for now**. Expected format `CRM-YYYY-NNNN`. Duplicates are always blocked. The form may suggest the next free number as a hint without filling it in. |
| Q4 | Reminder recipients | Assigned engineer: every step (7, 3, 1 day before, due today, overdue). Project manager: 1 day before, due today, overdue. Salesperson: overdue only. Email only if a company mail account is configured. |
| Q5 | Statuses | The 8 default statuses in section 4, used for both projects and scopes. |
| Q6 | Milestones | The section 12 examples are the real default set, added to every new project and editable per project: Request Received, Engineering Review, Scope Confirmation, Calculation Completed, Drawing Completed, Client Approval, Project Completion. |
| Q7 | Record visibility | Engineers see projects they are assigned to. Salespeople see their own clients' projects. Project managers and administrators see all. Enforced in the backend/database, not only the UI. |
| Q8 | Importing existing data | **Skipped for now.** No import at launch; can be added later. |

## 1. YOUR ROLE

Act as a Senior Full-Stack Developer, Software Architect, UI/UX Designer, Database Engineer, and Project Management Specialist.

Your task is to design, develop, and document a complete Engineering Project Management CRM & Tracker for an engineering company.

The system must replace manual project tracking with a centralized digital platform where the team can manage projects, engineering scopes, clients, assigned personnel, deadlines, notifications, tasks, milestones, and project schedules.

In addition to developing the application, you must create actual desktop and mobile wireframes and a clickable visual prototype that can be presented to the client before full implementation.

Do not stop at planning, descriptions, or static mockups. When you have access to a coding environment, create the actual files, run the application, test it, and fix errors.

## 2. PROJECT OBJECTIVES

The application must enable the company to:

- Register and manage engineering projects.
- Assign unique CRM/project numbers.
- Maintain client and salesperson information.
- Track multiple engineering scopes under one project.
- Assign project managers and engineers.
- Monitor requested dates, start dates, due dates, and completion dates.
- Track project progress, tasks, and milestones.
- Identify upcoming and overdue deadlines.
- Send automatic deadline reminders.
- Visualize project schedules through Gantt charts and calendar views.
- Monitor workloads and project status through dashboards.
- Search, filter, edit, archive, and export project records.
- Access the application through desktop computers and mobile devices.
- Present a visual prototype to the client before full development.

The application should be easy to use, reliable, responsive, secure, and affordable to operate.

**Cost requirement:** Use free and open-source technologies wherever possible. The core application must not depend on paid APIs or mandatory subscriptions. Clearly identify any hosting limitations, usage limits, or potential costs.

---

# PART A — REQUIREMENTS AND ENGINEERING WORKFLOW

## 3. Project Information

Each project must contain the following fields.

### A. Project Identification

- CRM / Project Number — unique project identifier.
- Project Name.
- Client / Customer.
- Project Description.
- Project Creation Date.
- Created By.
- Last Updated Date.
- Last Updated By.

### B. Engineering Scopes

Allow one project to have multiple engineering scopes.

Provide the following predefined scope options:

1. Lifting
2. Transport
3. Jacking & Skidding
4. Shutdown
5. Bridging
6. GBP Calculation
7. Route Survey
8. MS Study
9. DWG

Allow authorized administrators to manage the scope list in the future.

Each engineering scope must have its own record and may have its own:

- Assigned Engineer.
- Scope Description.
- Start Date.
- Requested Date, if applicable.
- Due Date.
- Priority.
- Status.
- Progress Percentage.
- Dependencies.
- Notes.
- Attachments.
- Completion Date.

Do not assume all scopes have the same deadline, assigned engineer, progress, or status.

The overall project progress should be calculated consistently from its scopes or tasks. Document the calculation method and allow a project manager to make a manual adjustment only if that is an approved business requirement.

### C. Sales and Scheduling Information

Each project must support:

- Salesperson.
- Date Requested.
- Project Start Date.
- Project Due Date.
- Planned Completion Date.
- Actual Completion Date.
- Priority: Low, Normal, High, Critical.
- Project Status.
- Overall Progress.

### D. Personnel and Accountability

Track:

- Project Manager.
- Assigned Engineer or Engineers.
- Salesperson.
- Project Creator.
- Last Updated By.

Provide a history of important changes, including who made each change and when.

## 4. Project Statuses

Use these default statuses:

- New Request
- For Review
- In Progress
- On Hold
- Waiting for Client
- Waiting for Engineering
- Completed
- Cancelled

Use clear visual indicators for each status.

Allow administrators to manage status options if practical.

Completed and cancelled projects should no longer receive active deadline reminders. Preserve their records for historical reporting.

## 5. Project and Scope Management

Implement full CRUD functionality:

- Create projects.
- View project details.
- Edit project information.
- Archive projects.
- Restore archived projects, where appropriate.
- Delete projects with confirmation and suitable permission checks.
- Duplicate project records when useful.
- Add, edit, and remove engineering scopes.
- Assign personnel.
- Update project status.
- Update progress.
- Add notes and attachments.
- Record changes in an activity history.

Use archive functionality as the preferred approach for retaining business history.

Validate required fields, duplicate project numbers, date ranges, and assignments.

---

# PART B — DASHBOARD AND PROJECT TRACKER

## 6. Main Dashboard

Create a professional dashboard as the application's home page.

Display summary cards for:

- Total Projects.
- New Requests.
- Active Projects.
- Projects Due Today.
- Projects Due This Week.
- Overdue Projects.
- Completed Projects.
- Projects On Hold.

Include the following visualizations:

1. Project status distribution.
2. Projects by engineering scope.
3. Monthly project completion.
4. Overdue versus on-time projects.
5. Project workload by assigned engineer.
6. Upcoming deadlines.

Include a recent activity section showing recent project updates.

Dashboard metrics and charts must update from actual database records, not hardcoded values.

Make dashboard cards and chart categories clickable when practical so users can open the corresponding filtered project list.

Clearly distinguish between project deadlines and individual engineering scope deadlines.

## 7. Project Tracker Table

Create a searchable, sortable, filterable project table.

Include these columns:

- CRM / Project Number.
- Project Name.
- Client.
- Engineering Scope.
- Salesperson.
- Assigned Engineer.
- Date Requested.
- Start Date.
- Due Date.
- Priority.
- Status.
- Progress.
- Actions.

Provide:

- Search by project number, project name, or client.
- Filters by status, scope, client, salesperson, engineer, priority, and due date.
- Overdue-only filter.
- Completed-project filter.
- Sorting by due date, project name, priority, and status.
- Pagination or an equivalent solution for larger project lists.
- Add Project button.
- Export button.

For projects with multiple engineering scopes, show a concise scope summary in the main table and display all scopes on the project details page.

Use clear status badges and progress indicators without making the interface visually crowded.

---

# PART C — GANTT CHART, CALENDAR, AND TIMELINE

## 8. Gantt Chart

Implement a functional Gantt chart or equivalent project timeline.

Requirements:

- Display projects as timeline bars.
- Display engineering scopes as subtasks under their parent projects.
- Show project and scope start dates and due dates.
- Display milestones.
- Show progress indicators.
- Highlight overdue work.
- Show project and scope status.
- Support day, week, and month views where practical.
- Filter by project, engineer, scope, and status.
- Open project details by selecting a project or scope.
- Support task dependencies where appropriate.
- Identify overlapping schedules and potential delays.

Ensure the Gantt chart is connected to the same database as the project tracker.

If a free Gantt chart library is used, verify its license and ensure it can be used for the intended application.

## 9. Calendar

Implement a calendar view that displays:

- Project due dates.
- Scope deadlines.
- Project milestones.
- Planned completion dates.
- Upcoming work.

Provide monthly and weekly views where practical.

Users should be able to open a related project from a calendar event.

Use distinct visual indicators for overdue, upcoming, and completed items.

## 10. Mobile Timeline

Do not simply shrink the desktop Gantt chart.

For mobile devices, provide a simplified timeline or chronological schedule list with:

- Project and scope names.
- Start and due dates.
- Progress.
- Status.
- Milestones.
- Overdue indicators.

Allow users to open a project and review its detailed schedule.

---

# PART D — DEADLINE NOTIFICATIONS

## 11. Deadline Reminder Rules

Deadline notifications are a critical feature.

Implement reminders for both projects and engineering scopes.

Default reminder intervals:

- 7 days before the due date.
- 3 days before the due date.
- 1 day before the due date.
- On the due date.
- After the due date, through a separate overdue alert mechanism.

Rules:

1. Notify the assigned engineer or responsible person.
2. Notify the project manager where appropriate.
3. Show due-today and overdue items on the dashboard.
4. Do not send normal upcoming reminders for completed or cancelled work.
5. Prevent duplicate notifications for the same item, recipient, and reminder interval.
6. Recalculate reminder schedules when deadlines change.
7. Record when reminders are generated and delivered.
8. Provide notification read/unread states.
9. Allow users to mark notifications as read.
10. Link each notification to the relevant project or scope.

Make reminder intervals configurable where practical.

### Notification Channels

Implement in this order:

1. In-app notifications.
2. Browser notifications with user permission.
3. Email notifications if a free, properly configured solution is available.

Important technical requirements:

- In-app notification records must be stored persistently.
- Browser notifications require permission and appropriate browser support.
- Browser-only timers must not be presented as reliable background reminders.
- Use a server-side scheduled task or cron job for reminders that must run while users are offline.
- Prevent duplicate reminder generation across multiple scheduler executions.
- Handle timezone differences consistently.
- Store credentials and email configuration in environment variables.
- Do not hardcode passwords, SMTP credentials, or API keys.

Document which notifications work immediately and which require server scheduling or external configuration.

---

# PART E — TASKS, MILESTONES, AND ACTIVITY HISTORY

## 12. Tasks and Milestones

Allow each project and engineering scope to contain multiple tasks and milestones.

Each task should support:

- Task Name.
- Description.
- Parent Project or Scope.
- Assigned Person.
- Start Date.
- Due Date.
- Priority.
- Status.
- Progress.
- Dependencies.
- Notes.
- Completion Date.

Suggested milestone examples:

- Request Received.
- Engineering Review.
- Scope Confirmation.
- Calculation Completed.
- Drawing Completed.
- Client Approval.
- Project Completion.

These are examples only. Allow the workflow to be customized to the company's actual processes.

## 13. Activity History

Maintain an activity history for important events:

- Project created.
- Project edited.
- Status changed.
- Due date changed.
- Engineering scope added or removed.
- Engineer assigned or reassigned.
- Progress updated.
- Task completed.
- Reminder generated.
- Project completed.
- Project archived.

Each activity record should contain:

- Relevant project or scope.
- Action performed.
- Previous value where applicable.
- New value where applicable.
- User responsible.
- Timestamp.

Do not expose internal administrative details to users who lack permission.

---

# PART F — CLIENTS, USERS, AND ACCESS CONTROL

## 14. Client Management

Create a client directory with:

- Client Name.
- Company Name.
- Contact Person.
- Email.
- Phone Number.
- Address, if needed.
- Related Projects.
- Notes.

Support searching and filtering clients.

Use fictional sample information during development.

## 15. User Roles

Implement role-based access control.

### Administrator

- Manage users and roles.
- Manage projects.
- Manage engineering scopes.
- Manage system settings.
- Access reports.
- View activity history.
- Configure notification rules.

### Project Manager

- Create and manage authorized projects.
- Assign engineers.
- Set project deadlines and milestones.
- Monitor scope progress.
- Review project workload.
- View relevant reports.

### Engineer

- View authorized projects.
- Update assigned scopes.
- Update assigned task statuses.
- Update progress.
- Add notes and documents.
- View relevant deadline notifications.

### Salesperson

- Submit project requests.
- Access relevant client and project records.
- Track requested dates, due dates, and project statuses.
- View relevant project updates.

Enforce authorization in the backend and database policies where applicable. Hiding buttons in the frontend alone is not sufficient.

Use secure authentication and appropriate session handling.

---

# PART G — REPORTS AND EXPORTS

## 16. Reporting

Provide reports for:

- All active projects.
- Overdue projects.
- Projects due within 7 days.
- Projects due within 30 days.
- Completed projects by month.
- Project completion statistics.
- Projects grouped by engineering scope.
- Projects grouped by client.
- Workload per engineer.
- Projects on hold.
- Scope-level delays.

Allow users to filter reports by date range, project status, engineer, and scope.

## 17. Exporting

Implement:

- CSV export.
- Excel-compatible export.
- Printable project summaries.
- PDF export where practical.

Exports must respect the user's permissions and selected filters.

Ensure dates and project numbers remain correctly formatted.

---

# PART H — UI/UX DESIGN AND WIREFRAMES

## 18. Design Objective

Before completing the full production application, generate actual desktop and mobile wireframes and a visual prototype for client review.

The wireframes must help a non-technical client understand:

- How the application will look.
- How users will navigate between screens.
- How engineering projects will be tracked.
- How project scopes will be managed.
- How deadlines and notifications will work.
- How the Gantt chart will display project schedules.
- How the interface adapts to mobile devices.

**Do not provide only a written description of the design. Generate actual, viewable wireframes and create a runnable visual prototype when the development environment permits.**

Use a two-stage design process:

1. Low-fidelity wireframes.
2. Polished visual mockups.

The client should be able to review the initial layouts before full application development proceeds.

## 19. Design Style

Create a professional interface suitable for an engineering company.

For low-fidelity wireframes:

- Use grayscale colors.
- Use basic shapes and placeholder icons.
- Establish screen layouts and information hierarchy.
- Label major components.
- Focus on usability rather than decoration.

For polished mockups:

- Use a restrained professional color palette.
- Use readable typography.
- Use consistent spacing and alignment.
- Use clear project status indicators.
- Use consistent navigation.
- Keep charts readable.
- Use accessible contrast.
- Avoid excessive gradients and animations.

Maintain a consistent design language across all screens.

## 20. Desktop Wireframes

Design the desktop experience around a 1440 × 900 pixel viewport.

Create the following screens.

### Desktop Screen 1: Dashboard

Include:

- Application logo.
- Sidebar navigation.
- Top navigation.
- Search field.
- User profile menu.
- Summary cards.
- Project status chart.
- Projects by engineering scope chart.
- Upcoming deadlines.
- Overdue projects.
- Recent project activity.

### Desktop Screen 2: Project Tracker

Include:

- Project table.
- Project number.
- Project name.
- Client.
- Engineering scopes.
- Salesperson.
- Assigned engineer.
- Requested date.
- Due date.
- Priority.
- Status.
- Progress.
- Search.
- Filters.
- Sorting.
- Add Project button.
- Export button.

### Desktop Screen 3: Project Details

Include:

- Project number and name.
- Client information.
- Salesperson.
- Project manager.
- Assigned engineers.
- Engineering scope list.
- Requested date.
- Start date.
- Due date.
- Status.
- Priority.
- Progress.
- Timeline.
- Tasks and milestones.
- Notes.
- Attachments.
- Activity history.
- Edit Project button.

Show how multiple engineering scopes can have separate assignments, deadlines, and progress.

### Desktop Screen 4: Create/Edit Project

Organize the form into sections.

**Project Information**
- Project Number.
- Project Name.
- Client.
- Description.

**Engineering Scope**
- Lifting.
- Transport.
- Jacking & Skidding.
- Shutdown.
- Bridging.
- GBP Calculation.
- Route Survey.
- MS Study.
- DWG.

**Scheduling**
- Requested Date.
- Start Date.
- Due Date.
- Priority.

**Assignments**
- Salesperson.
- Project Manager.
- Assigned Engineer.

Include validation messages and Save/Cancel actions.

### Desktop Screen 5: Gantt Chart

Include:

- Project rows.
- Expandable scope subtasks.
- Timeline headers.
- Timeline bars.
- Milestones.
- Progress indicators.
- Overdue indicators.
- Filters.
- Date range controls.

### Desktop Screen 6: Calendar and Notifications

Include:

- Monthly or weekly calendar.
- Project deadlines.
- Scope deadlines.
- Upcoming reminders.
- Overdue items.
- Read/unread notification indicators.
- Links to related projects.

### Desktop Screen 7: Reports

Include:

- Project completion charts.
- Overdue project report.
- Workload by engineer.
- Projects grouped by scope.
- Projects due within selected date ranges.
- Export controls.

## 21. Mobile Wireframes

Design the mobile experience around a 390 × 844 pixel viewport.

Do not merely compress the desktop interface. Prioritize touch-friendly controls, readable text, and vertical layouts.

### Mobile Screen 1: Dashboard

Include:

- Compact header.
- Logo.
- Notification icon.
- Profile access.
- Stacked project summary cards.
- Compact charts.
- Upcoming deadlines.
- Overdue project alerts.
- Bottom navigation or an accessible menu.

### Mobile Screen 2: Project List

Include:

- Search.
- Filters.
- Project cards.
- Project number.
- Project name.
- Client.
- Scope summary.
- Due date.
- Status.
- Progress.
- Tap-to-open details.

Avoid an unreadable, horizontally compressed desktop table.

### Mobile Screen 3: Project Details

Include:

- Project number.
- Project name.
- Status.
- Priority.
- Client.
- Assigned engineer.
- Requested date.
- Due date.
- Overall progress.
- Expandable engineering scope cards.
- Tasks and milestones.
- Activity history.
- Edit and update actions.

### Mobile Screen 4: Create/Edit Project

Include:

- Stacked form fields.
- Scope checkboxes or multi-select controls.
- Date pickers.
- Assignment selectors.
- Save and Cancel buttons.
- Validation messages.
- Touch-friendly spacing.

### Mobile Screen 5: Timeline

Include:

- Compact project schedule.
- Scope deadlines.
- Milestones.
- Progress indicators.
- Overdue alerts.
- Scrollable timeline where necessary.

Provide a chronological schedule list if a full Gantt chart is impractical on a small screen.

### Mobile Screen 6: Notifications

Include:

- Upcoming reminders.
- Projects due today.
- Overdue projects.
- Scope-level reminders.
- Read/unread status.
- Direct navigation to affected projects.

## 22. Clickable Prototype

Create a runnable prototype that demonstrates the major user journeys.

Use mock data initially.

Implement these interactions where practical:

1. Navigate between Dashboard, Projects, Timeline, Calendar, Reports, and Notifications.
2. Open a project from the project list.
3. Open a project's engineering scope details.
4. Open the Create Project form.
5. Select multiple engineering scopes.
6. Submit a sample project form.
7. Update a sample project's status and progress.
8. Filter and search sample projects.
9. Open a notification and navigate to its project.
10. Switch between desktop and mobile previews, if appropriate.

If feasible, make the prototype responsive so it can be demonstrated by resizing the browser.

Clearly label prototype-only functionality.

Do not present mock data, simulated notifications, or nonpersistent changes as production functionality.

## 23. User Flow Diagram

Create a simple visual user-flow diagram illustrating:

Login → Dashboard → Project Tracker → Project Details → Engineering Scopes → Timeline → Notifications.

Include alternative flows for:

- Creating a project.
- Assigning an engineer.
- Updating progress.
- Receiving a deadline reminder.
- Completing a project.

Use a Mermaid diagram or another readable diagram format if supported by the development environment.

## 24. Wireframe Deliverables

Produce the following:

1. Desktop low-fidelity wireframes.
2. Mobile low-fidelity wireframes.
3. Polished desktop dashboard mockup.
4. Polished mobile dashboard mockup.
5. Project tracker mockup.
6. Project details mockup.
7. Create/Edit Project mockup.
8. Gantt chart mockup.
9. Notification center mockup.
10. User-flow diagram.
11. Runnable clickable prototype, when possible.
12. Client presentation notes.
13. Design handoff documentation.

Save the design files and source code in an organized directory structure appropriate to the existing project.

Suggested structure:

- `design/desktop-wireframes`
- `design/mobile-wireframes`
- `design/polished-mockups`
- `design/user-flows`
- `src/components`
- `src/pages`
- `src/mock-data`

Adapt this structure if the existing repository has an established convention.

Provide exact instructions for previewing the wireframes and launching the prototype.

---

# PART I — TECHNICAL ARCHITECTURE

## 25. Recommended Technology Stack

Use a practical and maintainable stack.

Preferred options:

- Frontend: React with TypeScript.
- Styling: Tailwind CSS.
- Backend: A suitable API framework.
- Database: PostgreSQL or another appropriate database.
- Authentication: A secure, supported authentication system.
- Charts: A free charting library such as Recharts.
- Gantt chart: A free or open-source library or a properly implemented custom timeline.
- Testing: Appropriate frontend and backend test tools.

Supabase may be considered for PostgreSQL, authentication, and backend services, but verify its current free-tier limits and configuration requirements.

Choose a different stack if it provides a more reliable and practical implementation.

Do not introduce unnecessary complexity.

## 26. Database Design

Design a relational database with appropriate relationships for:

- Users.
- Roles and permissions.
- Clients.
- Projects.
- Engineering scopes.
- Tasks.
- Milestones.
- Project assignments.
- Scope assignments.
- Notifications.
- Notification delivery records.
- Activity history.
- Attachments, if supported.

Provide:

- Database schema.
- Migrations or setup scripts.
- Primary and foreign keys.
- Unique constraints.
- Required-field validation.
- Appropriate indexes.
- Referential integrity.
- Secure access policies.

Projects must support multiple engineering scopes, and each scope must be able to maintain its own deadline and status.

Avoid duplicating project information unnecessarily.

## 27. Security and Data Protection

Implement:

- Secure authentication.
- Backend authorization.
- Role-based access control.
- Input validation.
- Safe handling of uploaded documents.
- Environment-based secrets.
- Appropriate session management.
- Protection against unauthorized record access.
- Database backup and restore instructions.

Never expose private service credentials or privileged database keys in client-side code.

Use fictional information for demo data.

## 28. Free Hosting and Deployment

Identify suitable free-tier or self-hosted deployment options.

Before choosing a hosting provider, verify:

- Current pricing.
- Free-tier limitations.
- Database capacity.
- Sleep or inactivity restrictions.
- Scheduled job support.
- Authentication limitations.
- Backup options.
- Email delivery requirements.

Do not promise that the entire production system will remain free if the selected services have paid requirements.

Provide a practical self-hosted alternative if needed.

Document how to configure background reminders and how to run the application locally.

---

# PART J — TESTING AND QUALITY ASSURANCE

## 29. Required Sample Data

Create at least five fictional engineering projects.

Include:

- Projects with different engineering scopes.
- A project with multiple scopes.
- Different assigned engineers.
- Different project statuses.
- A project due today.
- An upcoming project.
- An overdue project.
- A completed project.
- A project with different deadlines for individual scopes.

Clearly label sample records as demo data.

## 30. Functional Testing

Test these workflows:

1. Create a project.
2. Edit a project.
3. Assign a client and salesperson.
4. Assign an engineer.
5. Add multiple engineering scopes.
6. Set individual scope deadlines.
7. Update progress.
8. Change project status.
9. Open a project from the dashboard.
10. View a project on the Gantt chart.
11. View project deadlines on the calendar.
12. Generate an in-app reminder.
13. Identify an overdue project.
14. Mark a notification as read.
15. Search and filter projects.
16. Export project data.
17. Verify user permissions.
18. Prevent duplicate project numbers.
19. Validate incorrect date ranges.
20. Verify that completed and cancelled work no longer receives active deadline reminders.
21. Verify that deadline changes update reminder scheduling.
22. Verify that the mobile interface works at the specified viewport.

Fix discovered errors before declaring a workflow functional.

## 31. Quality Requirements

The application must:

- Be responsive.
- Use consistent date and timezone handling.
- Display meaningful loading states.
- Provide useful error messages.
- Validate form inputs.
- Prevent duplicate reminder records.
- Handle empty project lists.
- Handle database failures gracefully.
- Avoid broken navigation.
- Maintain accessibility and readable contrast.
- Use real database data for production dashboard metrics.
- Separate demo data from production records.

---

# PART K — IMPLEMENTATION PHASES

## 32. Follow This Development Sequence

### Phase 1: Requirements and Architecture

- Review all requirements.
- Identify technical risks.
- Document assumptions.
- Design the database schema.
- Choose the technology stack.
- Confirm the deployment strategy.
- Identify features that depend on external configuration.

### Phase 2: Low-Fidelity Wireframes

- Create desktop wireframes.
- Create mobile wireframes.
- Review navigation and screen layouts.
- Ensure the nine engineering scopes are represented.
- Ensure the required project fields are included.
- Identify missing workflow requirements.

### Phase 3: Polished Mockups and Prototype

- Apply a consistent design system.
- Add realistic fictional sample data.
- Create the desktop and mobile previews.
- Implement major prototype interactions.
- Provide instructions for client demonstration.

### Phase 4: Core Application

- Implement authentication.
- Implement users and roles.
- Implement clients.
- Implement project management.
- Implement engineering scope management.
- Implement database persistence.
- Implement validation and permissions.

### Phase 5: Project Monitoring

- Implement dashboard cards.
- Implement charts.
- Implement project search and filters.
- Implement task and milestone management.
- Implement activity history.

### Phase 6: Timeline and Notifications

- Implement the Gantt chart.
- Implement the calendar.
- Implement deadline calculations.
- Implement in-app notifications.
- Implement scheduled reminder processing.
- Test duplicate prevention.
- Test overdue handling.

### Phase 7: Reports and Testing

- Implement reports and exports.
- Run automated tests.
- Verify authorization.
- Verify responsive layouts.
- Fix bugs and regressions.

### Phase 8: Deployment and Handoff

- Document local installation.
- Document environment variables.
- Document deployment.
- Document background job configuration.
- Document database backups.
- Document restoration procedures.
- Provide a final test checklist.
- Provide client presentation instructions.

---

# PART L — REQUIRED OUTPUTS

## 33. Deliverables

At completion, provide:

1. A concise system architecture explanation.
2. A database schema and migrations.
3. Complete frontend source code.
4. Complete backend source code.
5. Functional project CRUD operations.
6. Engineering scope management.
7. Dashboard and reporting.
8. Gantt chart and calendar.
9. Deadline notifications.
10. Authentication and authorization.
11. Sample demo data.
12. Desktop wireframes.
13. Mobile wireframes.
14. Polished desktop and mobile mockups.
15. A clickable prototype where supported.
16. A user-flow diagram.
17. Automated tests.
18. An `.env.example` file with placeholders only.
19. A README with installation and deployment instructions.
20. Backup and restore instructions.
21. A list of remaining limitations.
22. A client demonstration checklist.

## 34. Client Presentation

Prepare a short, non-technical presentation narrative that explains:

- The purpose of the application.
- How the dashboard provides project visibility.
- How projects and engineering scopes are tracked.
- How the Gantt chart visualizes schedules.
- How deadline reminders reduce missed deadlines.
- How engineers can update projects from mobile devices.
- How the system improves accountability and workload visibility.
- Which features are included in the prototype and which require full implementation.

Use realistic fictional projects and dates.

Make the mockups readable when shown on a meeting-room display or shared during an online meeting.

If presentation file generation is supported by the environment, create a concise PowerPoint presentation containing the desktop and mobile mockups, key features, and proposed workflow.

Do not claim to have created a presentation file unless it actually exists.

---

# PART M — IMPORTANT EXECUTION RULES

## 35. How You Must Work

1. Inspect the existing development environment and repository before creating files.
2. Preserve useful existing work.
3. Do not overwrite existing files without checking their contents.
4. If no project exists, initialize a suitable project.
5. Build the low-fidelity wireframes before full production implementation.
6. Generate the polished mockups and runnable prototype.
7. Continue with the application implementation.
8. Use real database persistence for production features.
9. Test the main user workflows.
10. Fix errors where possible.
11. Clearly document incomplete features and external configuration requirements.
12. Provide exact commands to run the application locally.
13. Do not claim successful execution or testing without verifying it.
14. Do not stop after generating a plan.
15. If you encounter environment limitations, explain them and complete as much as possible.

When an important detail is ambiguous, make a reasonable assumption, document it, and continue unless the missing information prevents safe implementation.

Keep the code modular, readable, and maintainable.

Do not implement every feature in one enormous file.

Prioritize working functionality over unnecessary complexity.

## 36. Definition of Done

The project is complete when:

- A user can create and manage engineering projects.
- Each project can have multiple independently tracked engineering scopes.
- Users can assign responsibilities and deadlines.
- The dashboard reflects the actual project data.
- The project tracker supports search and filtering.
- The timeline displays projects and their scopes.
- Deadline reminders work according to the documented scheduling configuration.
- The mobile interface is usable.
- Permissions are enforced.
- Important workflows have been tested.
- Desktop and mobile wireframes exist.
- The client can view the prototype.
- Installation and deployment instructions are available.
- Limitations and costs are clearly documented.

## FINAL OBJECTIVE

Build a practical, professional, and cost-conscious Engineering Project Management CRM & Tracker that replaces manual tracking, improves engineering accountability, reduces missed deadlines, and provides clear project visibility.

At the same time, produce desktop and mobile wireframes and a clickable prototype so the client can visualize and review the proposed solution before approving the full implementation.

**Start by inspecting the development environment, reviewing the requirements, and creating the low-fidelity desktop and mobile wireframes. Then generate the polished prototype and proceed with implementation in the phases described above.**

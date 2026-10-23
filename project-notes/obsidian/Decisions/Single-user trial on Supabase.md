---
type: decision
created: 2026-10-21
tags:
  - project/engineering-crm
summary: Client liked the prototype and wants to use it now as one all-in-one user (an engineer). Trial version saves to a free Supabase database with a login; roles and multi-user come later only if higher-ups approve.
---

# Single-user trial on Supabase

**Context (2026-10-21):** The client contact liked the prototype and wants to start using it as her own all-in-one tracker. No admin/roles needed yet. If it works for her, she will pitch it to higher-ups; only then do we build real users (sales, admin, assigning).

**Decisions (project owner, 2026-10-21):**
- Data saved in a **free online database (Supabase)** with email + password sign-in, not browser storage. Reason: works across PC and phone, survives browser clearing, and is the base for the multi-user build.
- **Keep the demo data** on first sign-in; she removes it with a "Remove sample data" button when ready.
- **Pink theme** (client request). Alert red moved to orange-red so overdue still stands out from pink.
- The one user can **edit her own name** (click name in header, or More > Edit name, or People page).

**How it is built (v0.3):**
- One user has full rights (treated as Administrator internally). Role switcher hidden in live mode.
- New **People** page: names offered in engineer / PM / sales pickers. Job titles grant no access.
- Records stored whole as JSON per row (`projects`, `clients`, `people`, `settings` tables), owner + Row Level Security. Schema in `supabase/schema.sql`. Phase 4 replaces this with proper tables.
- Auto-save ~0.6 s after each change, "Saving… / Saved / Not saved, retrying" badge.
- `npm run build` = live app (needs `.env.local`), `npm run build:demo` = old click-through demo.

**Limits to remember:** Supabase free tier = 500 MB DB, 2 projects, pauses after 7 days with no activity (as of 2026-10-21, supabase.com/pricing). The publishable key in the web page is public by design; RLS protects the data.

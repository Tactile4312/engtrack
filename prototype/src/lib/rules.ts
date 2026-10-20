import type { Client, ISODate, Notice, Project, ReminderStep, Scope, Status, User } from '../types';
import { addDays, diffDays } from './dates';

export const CLOSED: Status[] = ['Completed', 'Cancelled'];
export const isClosed = (s: Status) => CLOSED.includes(s);

/** Q2: overall progress is the simple average of the scopes (cancelled scopes excluded). */
export function projectProgress(p: Pick<Project, 'scopes'>): number {
  const live = p.scopes.filter((s) => s.status !== 'Cancelled');
  if (live.length === 0) return 0;
  return Math.round(live.reduce((t, s) => t + s.progress, 0) / live.length);
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later' | 'closed' | 'none';

export function dueState(due: ISODate | null, status: Status, today: ISODate): DueState {
  if (isClosed(status)) return 'closed';
  if (!due) return 'none';
  const d = diffDays(today, due);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 7) return 'soon';
  return 'later';
}

export const daysLate = (due: ISODate, today: ISODate) => diffDays(due, today);

export function projectEngineers(p: Project): string[] {
  return [...new Set(p.scopes.map((s) => s.engineerId).filter((x): x is string => !!x))];
}

/* ---------- Q7: who can see what ---------- */

export function canSee(user: User, p: Project, clients: Client[]): boolean {
  switch (user.role) {
    case 'Administrator':
    case 'Project Manager':
      return true;
    case 'Engineer':
      return projectEngineers(p).includes(user.id);
    case 'Salesperson': {
      const client = clients.find((c) => c.id === p.clientId);
      return p.salesId === user.id || client?.salesId === user.id;
    }
  }
}

export type Action = 'create' | 'edit' | 'archive' | 'delete' | 'status' | 'updateScope' | 'note' | 'settings' | 'addClient';

export function can(user: User, action: Action, p?: Project, scope?: Scope): boolean {
  const r = user.role;
  if (r === 'Administrator') return true;
  switch (action) {
    case 'addClient':
      return r === 'Project Manager' || r === 'Salesperson';
    case 'create':
      return r === 'Project Manager' || r === 'Salesperson';
    case 'edit':
    case 'status':
    case 'archive':
      return r === 'Project Manager';
    case 'delete':
    case 'settings':
      return false;
    case 'updateScope':
      if (r === 'Project Manager') return true;
      return r === 'Engineer' && !!scope && scope.engineerId === user.id;
    case 'note':
      return r !== 'Salesperson' || (!!p && p.salesId === user.id);
  }
}

/** Admins and PMs edit any client; a salesperson edits only the clients they handle. */
export function canEditClient(user: User, c: Client): boolean {
  if (user.role === 'Administrator' || user.role === 'Project Manager') return true;
  return user.role === 'Salesperson' && c.salesId === user.id;
}

/* ---------- Q3: project number ---------- */

export const NUMBER_RE = /^CRM-\d{4}-\d{4}$/;

export function nextFreeNumber(projects: Project[], year: number): string {
  const used = projects
    .map((p) => p.number)
    .filter((n) => n.startsWith(`CRM-${year}-`))
    .map((n) => Number(n.slice(9)));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `CRM-${year}-${String(next).padStart(4, '0')}`;
}

/* ---------- Q4: reminders ---------- */

const BEFORE: { step: ReminderStep; offset: number }[] = [
  { step: '7d', offset: -7 },
  { step: '3d', offset: -3 },
  { step: '1d', offset: -1 },
  { step: 'today', offset: 0 },
];
/** Overdue alerts repeat every 7 days after the due date until the work is closed. */
const OVERDUE_REPEAT = 7;

export const RECIPIENT_RULES: Record<'engineer' | 'pm' | 'sales', ReminderStep[]> = {
  engineer: ['7d', '3d', '1d', 'today', 'overdue'],
  pm: ['1d', 'today', 'overdue'],
  sales: ['overdue'],
};

export const STEP_LABEL: Record<ReminderStep, string> = {
  '7d': 'Due in 7 days',
  '3d': 'Due in 3 days',
  '1d': 'Due tomorrow',
  today: 'Due today',
  overdue: 'Overdue',
};

const OVERDUE_MAX_REPEATS = 10;

function triggers(due: ISODate): { step: ReminderStep; date: ISODate }[] {
  const out = BEFORE.map((b) => ({ step: b.step, date: addDays(due, b.offset) }));
  for (let k = 0; k < OVERDUE_MAX_REPEATS; k++) out.push({ step: 'overdue', date: addDays(due, 1 + k * OVERDUE_REPEAT) });
  return out;
}

/**
 * What the server-side scheduler would have produced. Each reminder has a unique key
 * (item + step + trigger date + recipient), so re-running never creates duplicates.
 * Closed or archived work gets nothing. A changed due date yields a new schedule.
 */
export function buildSchedule(projects: Project[]): Notice[] {
  const out = new Map<string, Notice>();
  const add = (n: Omit<Notice, 'key'>) => {
    const key = `${n.itemType}:${n.scopeId ?? n.projectId}:${n.step}:${n.trigger}:${n.recipientId}`;
    out.set(key, { ...n, key });
  };
  for (const p of projects) {
    if (p.archived || isClosed(p.status)) continue;
    // Project-level reminders go to engineers who still have open work on it.
    const engineers = [...new Set(p.scopes.filter((s) => !isClosed(s.status) && s.engineerId).map((s) => s.engineerId!))];
    const items: { scope?: Scope; due: ISODate; engineers: string[] }[] = [{ due: p.due, engineers }];
    for (const s of p.scopes) {
      if (s.due && !isClosed(s.status)) items.push({ scope: s, due: s.due, engineers: s.engineerId ? [s.engineerId] : [] });
    }
    for (const it of items) {
      for (const t of triggers(it.due)) {
        const base = { itemType: it.scope ? 'scope' : 'project', projectId: p.id, scopeId: it.scope?.id, step: t.step, trigger: t.date, due: it.due } as const;
        if (RECIPIENT_RULES.engineer.includes(t.step)) it.engineers.forEach((e) => add({ ...base, recipientId: e }));
        if (RECIPIENT_RULES.pm.includes(t.step)) add({ ...base, recipientId: p.pmId });
        if (RECIPIENT_RULES.sales.includes(t.step)) add({ ...base, recipientId: p.salesId });
      }
    }
  }
  return [...out.values()];
}

/** Reminders already sent to a user (trigger date reached), newest first. */
export function sentTo(schedule: Notice[], userId: string | 'all', today: ISODate, lookbackDays = 21): Notice[] {
  return schedule
    .filter((n) => (userId === 'all' || n.recipientId === userId) && n.trigger <= today && diffDays(n.trigger, today) <= lookbackDays)
    .sort((a, b) => (a.trigger === b.trigger ? stepRank(a.step) - stepRank(b.step) : b.trigger.localeCompare(a.trigger)));
}

export function upcomingFor(schedule: Notice[], userId: string | 'all', today: ISODate, days = 14): Notice[] {
  return schedule
    .filter((n) => (userId === 'all' || n.recipientId === userId) && n.trigger > today && diffDays(today, n.trigger) <= days)
    .sort((a, b) => a.trigger.localeCompare(b.trigger));
}

/** For a person's inbox, only the latest reminder per item is shown; older steps are kept as history. */
export function latestPerItem(list: Notice[]): Notice[] {
  const seen = new Set<string>();
  return list.filter((n) => {
    const k = `${n.itemType}:${n.scopeId ?? n.projectId}:${n.recipientId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function stepRank(s: ReminderStep) {
  return ['overdue', 'today', '1d', '3d', '7d'].indexOf(s);
}

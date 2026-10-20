import type { Activity, ISODate, Project, Scope } from '../types';
import { SCOPE_TYPES, STATUSES } from '../types';
import { addDays, addMonths, diffDays, monthShort, startOfMonth, startOfWeek } from './dates';
import { isClosed, projectEngineers, projectProgress } from './rules';
import type { ProjectFilters } from '../store/AppStore';

export interface Deadline {
  kind: 'project' | 'scope';
  project: Project;
  scope?: Scope;
  due: ISODate;
  ownerId: string | null;
}

const openScopes = (p: Project) => p.scopes.filter((s) => !isClosed(s.status) && s.due);

export function deadlines(projects: Project[]): Deadline[] {
  const out: Deadline[] = [];
  for (const p of projects) {
    if (isClosed(p.status)) continue;
    out.push({ kind: 'project', project: p, due: p.due, ownerId: p.pmId });
    for (const s of openScopes(p)) out.push({ kind: 'scope', project: p, scope: s, due: s.due!, ownerId: s.engineerId });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

export function summary(projects: Project[], today: ISODate) {
  const open = projects.filter((p) => !isClosed(p.status));
  const weekEnd = addDays(startOfWeek(today), 6);
  const dl = deadlines(projects);
  const scopeDl = dl.filter((d) => d.kind === 'scope');
  return {
    total: projects.length,
    newRequests: projects.filter((p) => p.status === 'New Request').length,
    active: open.filter((p) => p.status !== 'New Request' && p.status !== 'On Hold').length,
    dueToday: open.filter((p) => p.due === today).length,
    dueTodayScopes: scopeDl.filter((d) => d.due === today).length,
    dueWeek: open.filter((p) => p.due >= today && p.due <= weekEnd).length,
    dueWeekScopes: scopeDl.filter((d) => d.due >= today && d.due <= weekEnd).length,
    overdue: open.filter((p) => p.due < today).length,
    overdueScopes: scopeDl.filter((d) => d.due < today).length,
    completed: projects.filter((p) => p.status === 'Completed').length,
    onHold: projects.filter((p) => p.status === 'On Hold').length,
    openCount: open.length,
    openScopeCount: scopeDl.length,
  };
}

export function byStatus(projects: Project[]) {
  return STATUSES.map((s) => ({ label: s, value: projects.filter((p) => p.status === s).length })).filter((r) => r.value > 0);
}

export function byScope(projects: Project[]) {
  return SCOPE_TYPES.map((t) => ({ label: t, value: projects.filter((p) => p.status !== 'Cancelled' && p.scopes.some((s) => s.type === t)).length }));
}

export function monthly(projects: Project[], today: ISODate, months = 6) {
  const first = addMonths(startOfMonth(today), -(months - 1));
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(first, i);
    const next = addMonths(m, 1);
    const done = projects.filter((p) => p.status === 'Completed' && p.actualFinish && p.actualFinish >= m && p.actualFinish < next);
    return { month: monthShort(m), onTime: done.filter((p) => p.actualFinish! <= p.due).length, late: done.filter((p) => p.actualFinish! > p.due).length };
  });
}

export function workload(projects: Project[], engineers: { id: string; name: string }[], today: ISODate) {
  return engineers.map((e) => {
    const mine = projects.filter((p) => !isClosed(p.status) && !p.archived).flatMap((p) => openScopes(p)).filter((s) => s.engineerId === e.id);
    const over = mine.filter((s) => s.due! < today).length;
    return { key: e.id, label: e.name, a: mine.length - over, b: over };
  });
}

export function recentActivity(projects: Project[], n = 6): (Activity & { project: Project })[] {
  return projects
    .flatMap((p) => p.activity.map((a) => ({ ...a, project: p })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, n);
}

const PRIORITY_RANK = { Critical: 0, High: 1, Normal: 2, Low: 3 } as const;

export type SortKey = 'due' | 'name' | 'priority' | 'status' | 'number' | 'progress';

export function filterProjects(
  projects: Project[],
  f: ProjectFilters,
  today: ISODate,
  sort: { key: SortKey; dir: 1 | -1 },
  clientNames: Record<string, string>,
): Project[] {
  const q = f.q.trim().toLowerCase();
  const weekEnd = addDays(startOfWeek(today), 6);
  return projects
    .filter((p) => (f.showArchived ? true : !p.archived))
    .filter((p) => (f.status ? p.status === f.status : f.showCompleted || !isClosed(p.status)))
    .filter((p) => !q || [p.number, p.name, clientNames[p.clientId] ?? ''].some((v) => v.toLowerCase().includes(q)))
    .filter((p) => !f.scope || p.scopes.some((s) => s.type === f.scope))
    .filter((p) => !f.clientId || p.clientId === f.clientId)
    .filter((p) => !f.salesId || p.salesId === f.salesId)
    .filter((p) => !f.engineerId || projectEngineers(p).includes(f.engineerId))
    .filter((p) => !f.priority || p.priority === f.priority)
    .filter((p) => {
      if (!f.due) return true;
      if (isClosed(p.status)) return false;
      if (f.due === 'overdue') return p.due < today || p.scopes.some((s) => !isClosed(s.status) && s.due && s.due < today);
      if (f.due === 'today') return p.due === today;
      if (f.due === 'week') return p.due >= today && p.due <= weekEnd;
      return p.due >= today && diffDays(today, p.due) <= 30;
    })
    .sort((a, b) => {
      let r = 0;
      if (sort.key === 'due') r = a.due.localeCompare(b.due);
      else if (sort.key === 'name') r = a.name.localeCompare(b.name);
      else if (sort.key === 'number') r = a.number.localeCompare(b.number);
      else if (sort.key === 'priority') r = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      else if (sort.key === 'status') r = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      else r = projectProgress(a) - projectProgress(b);
      return r * sort.dir || a.due.localeCompare(b.due);
    });
}


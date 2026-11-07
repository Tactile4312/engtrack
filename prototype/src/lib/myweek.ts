// "My week": everything that is someone's own job and is overdue or due in the next 7 days.
// Tasks they are assigned, scopes they engineer, projects they manage and those projects' milestones.
import type { ISODate, Project } from '../types';
import { addDays } from './dates';
import { isClosed } from './rules';

export type WeekKind = 'task' | 'scope' | 'project' | 'milestone';

export interface WeekItem {
  key: string;
  kind: WeekKind;
  date: ISODate;
  label: string;
  project: Project;
  scopeId?: string;
  taskId?: string;
}

export interface WeekDay {
  /** 'overdue' for anything before today, otherwise the ISO date. */
  day: 'overdue' | ISODate;
  items: WeekItem[];
}

const ORDER: WeekKind[] = ['project', 'milestone', 'scope', 'task'];

export function myWeek(projects: readonly Project[], meId: string, today: ISODate, days = 7): { groups: WeekDay[]; count: number } {
  const last = addDays(today, days - 1);
  const items: WeekItem[] = [];
  const inRange = (d: ISODate | null): d is ISODate => !!d && d <= last;
  for (const p of projects) {
    if (isClosed(p.status)) continue;
    const pm = p.pmId === meId;
    if (pm && inRange(p.due)) items.push({ key: `p:${p.id}`, kind: 'project', date: p.due, label: p.name, project: p });
    if (pm) for (const m of p.milestones) if (!m.done && inRange(m.date)) items.push({ key: `m:${p.id}:${m.id}`, kind: 'milestone', date: m.date, label: m.name, project: p });
    for (const s of p.scopes) if (s.engineerId === meId && !isClosed(s.status) && inRange(s.due)) items.push({ key: `s:${p.id}:${s.id}`, kind: 'scope', date: s.due, label: s.type, project: p, scopeId: s.id });
    for (const t of p.tasks) if (t.assigneeId === meId && !t.done && inRange(t.due)) items.push({ key: `t:${p.id}:${t.id}`, kind: 'task', date: t.due, label: t.name, project: p, taskId: t.id, scopeId: t.scopeId ?? undefined });
  }
  items.sort((a, b) => a.date.localeCompare(b.date) || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.label.localeCompare(b.label));

  const groups: WeekDay[] = [];
  const overdue = items.filter((i) => i.date < today);
  if (overdue.length) groups.push({ day: 'overdue', items: overdue });
  for (let i = 0; i < days; i++) {
    const d = addDays(today, i);
    groups.push({ day: d, items: items.filter((it) => it.date === d) });
  }
  return { groups, count: items.length };
}

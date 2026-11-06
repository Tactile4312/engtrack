// Every change to app state happens here. Pure apart from new ids and timestamps, so it can be tested without a browser.
import type { Note, Project } from '../types';
import { buildSeed, USERS } from '../mock-data/seed';
import { todayISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { initial, type Msg, type State } from './state';

const now = () => new Date().toISOString();

const name = (s: State, id: string | null) => s.people.find((u) => u.id === id)?.name ?? 'Unassigned';

function touch(p: Project, userId: string, action: string, from?: string, to?: string): Project {
  const at = now();
  return { ...p, updatedAt: at, updatedBy: userId, activity: [{ id: uid(), at, userId, action, from, to }, ...p.activity] };
}

/** Dated milestones first, earliest first; undated ones keep their order after them. */
function byDateThenUndated(a: { date: string | null }, b: { date: string | null }) {
  if (a.date && b.date) return a.date.localeCompare(b.date);
  return a.date ? -1 : b.date ? 1 : 0;
}

function mapProject(s: State, id: string, f: (p: Project) => Project): Project[] {
  return s.projects.map((p) => (p.id === id ? f(p) : p));
}

export function reducer(s: State, m: Msg): State {
  const me = s.userId;
  switch (m.t) {
    case 'user':
      return { ...s, userId: m.id, route: { page: 'dashboard' }, history: [] };
    case 'go':
      return { ...s, route: m.route, history: [...s.history.slice(-30), s.route] };
    case 'back': {
      const prev = s.history[s.history.length - 1];
      return prev ? { ...s, route: prev, history: s.history.slice(0, -1) } : { ...s, route: { page: 'dashboard' } };
    }
    case 'save': {
      const exists = s.projects.some((p) => p.id === m.project.id);
      const projects = exists ? s.projects.map((p) => (p.id === m.project.id ? m.project : p)) : [m.project, ...s.projects];
      return { ...s, projects, toast: m.isNew ? `Project ${m.project.number} created` : `Project ${m.project.number} saved` };
    }
    case 'client': {
      const clients = m.isNew ? [...s.clients, m.client] : s.clients.map((c) => (c.id === m.client.id ? m.client : c));
      return { ...s, clients, toast: m.isNew ? `Client ${m.client.name} added` : `Client ${m.client.name} saved` };
    }
    case 'person': {
      const people = m.isNew ? [...s.people, m.person] : s.people.map((u) => (u.id === m.person.id ? m.person : u));
      return { ...s, people, toast: m.isNew ? `${m.person.name} added` : `${m.person.name} saved` };
    }
    case 'unperson':
      return { ...s, people: s.people.filter((u) => u.id !== m.id), toast: 'Person removed' };
    case 'addDemo': {
      // Adds the sample records back, skipping any id already in use.
      const seed = buildSeed();
      const has = (list: { id: string }[], id: string) => list.some((x) => x.id === id);
      const projects = seed.projects.filter((p) => !has(s.projects, p.id));
      const clients = seed.clients.filter((c) => !has(s.clients, c.id));
      const people = USERS.filter((u) => !has(s.people, u.id));
      return {
        ...s,
        projects: [...s.projects, ...projects],
        clients: [...s.clients, ...clients],
        people: [...s.people, ...people],
        demo: { projects: projects.map((p) => p.id), clients: clients.map((c) => c.id), people: people.map((u) => u.id) },
        toast: `${projects.length} sample projects added`,
      };
    }
    case 'removeDemo': {
      if (!s.demo) return s;
      const d = s.demo;
      const people = s.people.filter((u) => !d.people.includes(u.id));
      const kept = new Set(people.map((u) => u.id));
      const clients = s.clients.filter((c) => !d.clients.includes(c.id)).map((c) => (kept.has(c.salesId) ? c : { ...c, salesId: '' }));
      const projects = s.projects.filter((p) => !d.projects.includes(p.id)).map((p) => ({
        ...p,
        salesId: kept.has(p.salesId) ? p.salesId : '',
        pmId: kept.has(p.pmId) ? p.pmId : '',
        scopes: p.scopes.map((x) => (x.engineerId && !kept.has(x.engineerId) ? { ...x, engineerId: null } : x)),
        tasks: p.tasks.map((t) => (t.assigneeId && !kept.has(t.assigneeId) ? { ...t, assigneeId: null } : t)),
      }));
      return { ...s, projects, clients, people, demo: undefined, route: { page: 'dashboard' }, history: [], toast: 'Sample data removed' };
    }
    case 'scope':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const old = p.scopes.find((x) => x.id === m.scopeId);
          if (!old) return p;
          let next: Project = {
            ...p,
            scopes: p.scopes.map((x) => {
              if (x.id !== m.scopeId) return x;
              const merged = { ...x, ...m.patch };
              if (merged.status === 'Completed') merged.progress = 100;
              merged.completed = merged.status === 'Completed' ? x.completed ?? todayISO() : null;
              return merged;
            }),
          };
          const neu = next.scopes.find((x) => x.id === m.scopeId)!;
          if (old.progress !== neu.progress) next = touch(next, me, `Progress updated · ${old.type}`, `${old.progress}%`, `${neu.progress}%`);
          if (old.status !== neu.status) next = touch(next, me, `Status changed · ${old.type}`, old.status, neu.status);
          if (old.due !== neu.due) next = touch(next, me, `Due date changed · ${old.type}`, old.due ?? '—', neu.due ?? '—');
          if (old.engineerId !== neu.engineerId) next = touch(next, me, `Engineer reassigned · ${old.type}`, name(s, old.engineerId), name(s, neu.engineerId));
          if (m.note) next = { ...touch(next, me, `Note added · ${old.type}`), notes: [{ id: uid(), at: now(), userId: me, text: `[${old.type}] ${m.note}` }, ...next.notes] };
          return next;
        }),
        toast: 'Scope updated',
      };
    case 'status':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const next = touch({ ...p, status: m.status, actualFinish: m.status === 'Completed' ? todayISO() : p.actualFinish }, me, 'Status changed', p.status, m.status);
          return m.status === 'Completed' ? touch(next, me, 'Project completed') : next;
        }),
        toast: `Status set to ${m.status}`,
      };
    case 'archive':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => touch({ ...p, archived: m.archived }, me, m.archived ? 'Project archived' : 'Project restored')),
        toast: m.archived ? 'Project archived' : 'Project restored',
      };
    case 'delete':
      return { ...s, projects: s.projects.filter((p) => p.id !== m.projectId), route: { page: 'projects' }, toast: 'Project deleted' };
    case 'task':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const t = p.tasks.find((x) => x.id === m.taskId);
          if (!t) return p;
          const next = { ...p, tasks: p.tasks.map((x) => (x.id === m.taskId ? { ...x, done: !x.done, completed: x.done ? null : todayISO() } : x)) };
          return touch(next, me, t.done ? `Task reopened · ${t.name}` : `Task completed · ${t.name}`);
        }),
      };
    case 'saveTask':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const old = p.tasks.find((x) => x.id === m.task.id);
          if (!m.isNew && !old) return p;
          const tasks = old ? p.tasks.map((x) => (x.id === m.task.id ? m.task : x)) : [...p.tasks, m.task];
          return touch({ ...p, tasks }, me, m.isNew ? `Task added · ${m.task.name}` : `Task edited · ${m.task.name}`);
        }),
        toast: m.isNew ? 'Task added' : 'Task saved',
      };
    case 'removeTask':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const t = p.tasks.find((x) => x.id === m.taskId);
          return t ? touch({ ...p, tasks: p.tasks.filter((x) => x.id !== t.id) }, me, `Task removed · ${t.name}`) : p;
        }),
        toast: 'Task removed',
      };
    case 'saveMilestone':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const old = p.milestones.find((x) => x.id === m.milestone.id);
          if (!m.isNew && !old) return p;
          const list = old ? p.milestones.map((x) => (x.id === m.milestone.id ? m.milestone : x)) : [...p.milestones, m.milestone];
          // Keep milestones in date order; undated ones stay in place after the dated ones.
          const milestones = [...list].sort(byDateThenUndated);
          const action = m.isNew ? `Milestone added · ${m.milestone.name}` : `Milestone edited · ${m.milestone.name}`;
          const moved = old && old.date !== m.milestone.date;
          return moved
            ? touch({ ...p, milestones }, me, action, old.date ?? '—', m.milestone.date ?? '—')
            : touch({ ...p, milestones }, me, action);
        }),
        toast: m.isNew ? 'Milestone added' : 'Milestone saved',
      };
    case 'removeMilestone':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const ms = p.milestones.find((x) => x.id === m.milestoneId);
          return ms ? touch({ ...p, milestones: p.milestones.filter((x) => x.id !== ms.id) }, me, `Milestone removed · ${ms.name}`) : p;
        }),
        toast: 'Milestone removed',
      };
    case 'milestone':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const ms = p.milestones.find((x) => x.id === m.milestoneId);
          if (!ms) return p;
          const next = { ...p, milestones: p.milestones.map((x) => (x.id === m.milestoneId ? { ...x, done: !x.done } : x)) };
          return touch(next, me, ms.done ? `Milestone reopened · ${ms.name}` : `Milestone reached · ${ms.name}`);
        }),
      };
    case 'note':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const note: Note = { id: uid(), at: now(), userId: me, text: m.text };
          return { ...touch(p, me, 'Note added'), notes: [note, ...p.notes] };
        }),
        toast: 'Note added',
      };
    case 'read': {
      const read = { ...s.read };
      m.keys.forEach((k) => (read[k] = true));
      return { ...s, read };
    }
    case 'backedUp':
      return { ...s, lastBackup: m.at, toast: 'Backup downloaded' };
    case 'restore': {
      const { projects, clients, people, read, demo } = m.backup;
      return { ...s, projects, clients, people, read, demo, route: { page: 'dashboard' }, history: [], toast: 'Backup restored' };
    }
    case 'toast':
      return { ...s, toast: m.text };
    case 'reset':
      return { ...initial(), userId: s.userId, toast: 'Demo data reset' };
  }
}

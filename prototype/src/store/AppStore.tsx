import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Client, Note, Project, Scope, Status, User } from '../types';
import { buildSeed, USERS } from '../mock-data/seed';
import { todayISO } from '../lib/dates';
import { buildSchedule, canSee, isClosed } from '../lib/rules';

export interface ProjectFilters {
  q: string;
  status: Status | '';
  scope: string;
  clientId: string;
  salesId: string;
  engineerId: string;
  priority: string;
  due: '' | 'overdue' | 'today' | 'week' | '30d';
  showCompleted: boolean;
  showArchived: boolean;
}

export const EMPTY_FILTERS: ProjectFilters = {
  q: '', status: '', scope: '', clientId: '', salesId: '', engineerId: '', priority: '', due: '', showCompleted: false, showArchived: false,
};

export type Route =
  | { page: 'dashboard' }
  | { page: 'projects'; filters?: Partial<ProjectFilters> }
  | { page: 'project'; id: string; scopeId?: string; tab?: string }
  | { page: 'new'; copyFrom?: string }
  | { page: 'edit'; id: string }
  | { page: 'timeline' }
  | { page: 'calendar' }
  | { page: 'notifications' }
  | { page: 'reports' }
  | { page: 'clients' }
  | { page: 'more' };

interface State {
  projects: Project[];
  clients: Client[];
  userId: string;
  route: Route;
  history: Route[];
  read: Record<string, true>;
  toast: string | null;
}

type Msg =
  | { t: 'user'; id: string }
  | { t: 'go'; route: Route }
  | { t: 'back' }
  | { t: 'save'; project: Project; isNew: boolean }
  | { t: 'client'; client: Client; isNew: boolean }
  | { t: 'scope'; projectId: string; scopeId: string; patch: Partial<Scope>; note?: string }
  | { t: 'status'; projectId: string; status: Status }
  | { t: 'archive'; projectId: string; archived: boolean }
  | { t: 'delete'; projectId: string }
  | { t: 'task'; projectId: string; taskId: string }
  | { t: 'milestone'; projectId: string; milestoneId: string }
  | { t: 'note'; projectId: string; text: string }
  | { t: 'read'; keys: string[] }
  | { t: 'toast'; text: string | null }
  | { t: 'reset' };

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();

function initial(route: Route = { page: 'dashboard' }, userId = 'u-pm1'): State {
  const { projects, clients } = buildSeed();
  return { projects, clients, userId, route, history: [], read: {}, toast: null };
}

function touch(p: Project, userId: string, action: string, from?: string, to?: string): Project {
  const at = now();
  return { ...p, updatedAt: at, updatedBy: userId, activity: [{ id: uid(), at, userId, action, from, to }, ...p.activity] };
}

function mapProject(s: State, id: string, f: (p: Project) => Project): Project[] {
  return s.projects.map((p) => (p.id === id ? f(p) : p));
}

function reducer(s: State, m: Msg): State {
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
    case 'scope':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const old = p.scopes.find((x) => x.id === m.scopeId)!;
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
          if (old.engineerId !== neu.engineerId) next = touch(next, me, `Engineer reassigned · ${old.type}`, name(old.engineerId), name(neu.engineerId));
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
          const t = p.tasks.find((x) => x.id === m.taskId)!;
          const next = { ...p, tasks: p.tasks.map((x) => (x.id === m.taskId ? { ...x, done: !x.done } : x)) };
          return touch(next, me, t.done ? `Task reopened · ${t.name}` : `Task completed · ${t.name}`);
        }),
      };
    case 'milestone':
      return {
        ...s,
        projects: mapProject(s, m.projectId, (p) => {
          const ms = p.milestones.find((x) => x.id === m.milestoneId)!;
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
    case 'toast':
      return { ...s, toast: m.text };
    case 'reset':
      return { ...initial(), userId: s.userId, toast: 'Demo data reset' };
  }
}

function name(id: string | null) {
  return USERS.find((u) => u.id === id)?.name ?? 'Unassigned';
}

export type Device = 'auto' | 'desktop' | 'mobile';

interface Ctx {
  s: State;
  dispatch: (m: Msg) => void;
  go: (r: Route) => void;
  me: User;
  users: User[];
  today: string;
  /** Projects the current user is allowed to see (Q7), excluding archived. */
  visible: Project[];
  /** Same, including archived. */
  visibleAll: Project[];
  schedule: ReturnType<typeof buildSchedule>;
  device: Device;
  setDevice: (d: Device) => void;
  isMobile: boolean;
}

const C = createContext<Ctx | null>(null);

function readParams(): { route?: Route; device?: Device; user?: string } {
  try {
    const q = new URLSearchParams(location.search);
    const page = q.get('screen');
    const out: { route?: Route; device?: Device; user?: string } = {};
    if (page === 'project' && q.get('id')) out.route = { page: 'project', id: q.get('id')!, scopeId: q.get('scope') ?? undefined };
    else if (page) out.route = { page } as Route;
    const dev = q.get('device');
    if (dev === 'mobile' || dev === 'desktop') out.device = dev;
    if (q.get('user')) out.user = q.get('user')!;
    return out;
  } catch {
    return {};
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const params = useMemo(readParams, []);
  const [s, dispatch] = useReducer(reducer, undefined, () => initial(params.route, params.user));
  const [device, setDevice] = useState<Device>(params.device ?? 'auto');
  const [narrow, setNarrow] = useState(() => window.innerWidth < 820);

  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 820);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => dispatch({ t: 'toast', text: null }), 2600);
    return () => clearTimeout(t);
  }, [s.toast]);

  const value = useMemo<Ctx>(() => {
    const me = USERS.find((u) => u.id === s.userId)!;
    const visibleAll = s.projects.filter((p) => canSee(me, p, s.clients));
    return {
      s, dispatch, me, users: USERS, today: todayISO(),
      go: (route) => dispatch({ t: 'go', route }),
      visibleAll,
      visible: visibleAll.filter((p) => !p.archived),
      schedule: buildSchedule(s.projects),
      device, setDevice,
      isMobile: device === 'mobile' || (device === 'auto' && narrow),
    };
  }, [s, device, narrow]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp() {
  const c = useContext(C);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function userName(id: string | null | undefined) {
  return USERS.find((u) => u.id === id)?.name ?? 'Unassigned';
}

export function shortName(id: string | null | undefined) {
  const n = USERS.find((u) => u.id === id)?.name;
  if (!n) return 'Unassigned';
  const [f, ...rest] = n.split(' ');
  return `${f[0]}. ${rest.join(' ')}`;
}

export const openStatus = (p: Project) => !isClosed(p.status);

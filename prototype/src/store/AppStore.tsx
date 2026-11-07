import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Notice, Project, Role, User } from '../types';
import { USERS } from '../mock-data/seed';
import { todayISO } from '../lib/dates';
import { buildSchedule, canSee, isClosed, noticeItemId } from '../lib/rules';
import { LIVE, ME_ID, type Snapshot } from '../lib/cloud';
import { reducer } from './reducer';
import { initial, EMPTY_FILTERS, type Msg, type ProjectFilters, type Route, type State } from './state';

export { EMPTY_FILTERS };
export type { ProjectFilters, Route, State };

// Current people list, for the name helpers below (kept in step with the store).
let PEOPLE: User[] = USERS;

export type SaveState = 'saved' | 'saving' | 'error' | 'conflict';

export type Device = 'auto' | 'desktop' | 'mobile';

interface Ctx {
  s: State;
  dispatch: (m: Msg) => void;
  go: (r: Route) => void;
  me: User;
  users: User[];
  /** People to offer for a role in pickers. In live mode the signed-in user is offered for every role. */
  peopleIn: (role: Role) => User[];
  today: string;
  /** Projects the current user is allowed to see (Q7), excluding archived. */
  visible: Project[];
  /** Same, including archived. */
  visibleAll: Project[];
  schedule: ReturnType<typeof buildSchedule>;
  device: Device;
  setDevice: (d: Device) => void;
  isMobile: boolean;
  /** Live mode only: whether the latest change has reached the database. */
  save?: SaveState;
  /** Live mode only: signs out after saving any waiting change. */
  signOut?: () => Promise<void>;
}

const C = createContext<Ctx | null>(null);

/** Pages a ?screen= link may open directly. Anything else falls back to the dashboard instead of a blank screen. */
const SIMPLE_PAGES = ['dashboard', 'week', 'projects', 'new', 'timeline', 'calendar', 'notifications', 'reports', 'clients', 'people', 'more'] as const;

function readParams(): { route?: Route; device?: Device; user?: string } {
  try {
    const q = new URLSearchParams(location.search);
    const page = q.get('screen');
    const out: { route?: Route; device?: Device; user?: string } = {};
    if (page === 'project' && q.get('id')) out.route = { page: 'project', id: q.get('id')!, scopeId: q.get('scope') ?? undefined };
    else if (page && (SIMPLE_PAGES as readonly string[]).includes(page)) out.route = { page } as Route;
    const dev = q.get('device');
    if (dev === 'mobile' || dev === 'desktop') out.device = dev;
    if (q.get('user')) out.user = q.get('user')!;
    return out;
  } catch {
    return {};
  }
}

/** Live mode has one person: every reminder goes to them, once per item and step. */
function forOneUser(list: Notice[]): Notice[] {
  const out = new Map<string, Notice>();
  for (const n of list) {
    const key = `${noticeItemId(n)}:${n.step}:${n.trigger}:${ME_ID}`;
    out.set(key, { ...n, key, recipientId: ME_ID });
  }
  return [...out.values()];
}

export function AppProvider({ children, snapshot, onState, save, signOut }: { children: ReactNode; snapshot?: Snapshot; onState?: (s: State) => void; save?: SaveState; signOut?: () => Promise<void> }) {
  const params = useMemo(readParams, []);
  const [s, dispatch] = useReducer(reducer, undefined, () => initial(params.route, params.user, snapshot));
  PEOPLE = s.people;

  useEffect(() => {
    onState?.(s);
  }, [s, onState]);
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
    const found = s.people.find((u) => u.id === s.userId) ?? s.people[0];
    // Live mode: the one user can do everything, whatever their job title.
    const me: User = LIVE ? { ...found, role: 'Administrator' } : found;
    const visibleAll = s.projects.filter((p) => canSee(me, p, s.clients));
    const peopleIn = (role: Role) => {
      const list = s.people.filter((u) => u.role === role || (role === 'Project Manager' && u.role === 'Administrator'));
      return LIVE && !list.some((u) => u.id === me.id) ? [found, ...list] : list;
    };
    return {
      s, dispatch, me, users: s.people, peopleIn, today: todayISO(),
      go: (route) => dispatch({ t: 'go', route }),
      visibleAll,
      visible: visibleAll.filter((p) => !p.archived),
      schedule: LIVE ? forOneUser(buildSchedule(s.projects)) : buildSchedule(s.projects),
      device, setDevice,
      isMobile: device === 'mobile' || (device === 'auto' && narrow),
      save,
      signOut,
    };
  }, [s, device, narrow, save, signOut]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp() {
  const c = useContext(C);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function userName(id: string | null | undefined) {
  return PEOPLE.find((u) => u.id === id)?.name ?? 'Unassigned';
}

export function shortName(id: string | null | undefined) {
  const n = PEOPLE.find((u) => u.id === id)?.name;
  if (!n) return 'Unassigned';
  const [f, ...rest] = n.split(' ');
  return rest.length ? `${f[0]}. ${rest.join(' ')}` : n;
}

export const openStatus = (p: Project) => !isClosed(p.status);

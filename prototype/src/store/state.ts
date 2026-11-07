// App state: its shape, the messages that change it, and how it starts.
import type { Client, Milestone, Project, Scope, Status, Task, User } from '../types';
import { buildSeed, USERS } from '../mock-data/seed';
import { ME_ID, type Settings, type Snapshot } from '../lib/cloud';
import type { Backup } from '../lib/backup';

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
  | { page: 'week' }
  | { page: 'projects'; filters?: Partial<ProjectFilters> }
  | { page: 'project'; id: string; scopeId?: string; tab?: string }
  | { page: 'new'; copyFrom?: string }
  | { page: 'edit'; id: string }
  | { page: 'timeline' }
  | { page: 'calendar' }
  | { page: 'notifications' }
  | { page: 'reports' }
  | { page: 'clients' }
  | { page: 'people' }
  | { page: 'more' };

export interface State {
  projects: Project[];
  clients: Client[];
  people: User[];
  demo?: Settings['demo'];
  lastBackup?: string;
  userId: string;
  route: Route;
  history: Route[];
  read: Record<string, true>;
  toast: string | null;
}

export type Msg =
  | { t: 'user'; id: string }
  | { t: 'go'; route: Route }
  | { t: 'back' }
  | { t: 'save'; project: Project; isNew: boolean }
  | { t: 'client'; client: Client; isNew: boolean }
  | { t: 'person'; person: User; isNew: boolean }
  | { t: 'unperson'; id: string }
  | { t: 'removeDemo' }
  | { t: 'addDemo' }
  | { t: 'backedUp'; at: string }
  | { t: 'restore'; backup: Backup }
  | { t: 'scope'; projectId: string; scopeId: string; patch: Partial<Scope>; note?: string }
  | { t: 'status'; projectId: string; status: Status }
  | { t: 'archive'; projectId: string; archived: boolean }
  | { t: 'delete'; projectId: string }
  | { t: 'task'; projectId: string; taskId: string }
  | { t: 'milestone'; projectId: string; milestoneId: string }
  | { t: 'saveTask'; projectId: string; task: Task; isNew: boolean }
  | { t: 'removeTask'; projectId: string; taskId: string }
  | { t: 'saveMilestone'; projectId: string; milestone: Milestone; isNew: boolean }
  | { t: 'removeMilestone'; projectId: string; milestoneId: string }
  | { t: 'note'; projectId: string; text: string }
  | { t: 'read'; keys: string[] }
  | { t: 'toast'; text: string | null }
  | { t: 'reset' };

export function initial(route: Route = { page: 'dashboard' }, userId = 'u-pm1', snap?: Snapshot): State {
  if (snap) {
    const { projects, clients, people, settings } = snap;
    return { projects, clients, people, demo: settings.demo, lastBackup: settings.lastBackup, userId: ME_ID, route, history: [], read: settings.read, toast: null };
  }
  const { projects, clients } = buildSeed();
  return { projects, clients, people: USERS, userId, route, history: [], read: {}, toast: null };
}

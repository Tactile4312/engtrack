// Full backup of the signed-in user's data as a JSON file, and the checks a file must pass before it can replace live data.
import type { Client, Project, User } from '../types';
import type { Settings } from './cloud';
import { normalizeProject } from './normalize';

export interface Backup {
  app: 'engtrack';
  version: 1;
  exportedAt: string;
  projects: Project[];
  clients: Client[];
  people: User[];
  read: Settings['read'];
  demo?: Settings['demo'];
}

type Source = Pick<Backup, 'projects' | 'clients' | 'people' | 'read' | 'demo'>;

export function makeBackup({ projects, clients, people, read, demo }: Source, exportedAt: string): Backup {
  return { app: 'engtrack', version: 1, exportedAt, projects, clients, people, read, demo };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkRecords(list: unknown, label: string, required: string[], lists: string[] = []) {
  if (!Array.isArray(list)) throw new Error(`The backup has no ${label} list.`);
  const ids = new Set<unknown>();
  for (const r of list) {
    if (!isObject(r) || typeof r.id !== 'string' || !r.id) throw new Error(`A record in ${label} has no id.`);
    if (ids.has(r.id)) throw new Error(`${label} has the id ${r.id} twice.`);
    ids.add(r.id);
    for (const k of required) if (typeof r[k] !== 'string') throw new Error(`${r.id} in ${label} is missing ${k}.`);
    for (const k of lists) if (!Array.isArray(r[k])) throw new Error(`${r.id} in ${label} is missing ${k}.`);
  }
}

/** Throws an Error with a readable message unless the text is a complete EngTrack backup that includes the signed-in person. */
export function parseBackup(text: string, meId: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup (it could not be read as JSON).');
  }
  if (!isObject(raw) || raw.app !== 'engtrack') throw new Error('This file is not an EngTrack backup.');
  if (raw.version !== 1) throw new Error('This backup was made by a different version of EngTrack.');
  if (typeof raw.exportedAt !== 'string') throw new Error('The backup has no date.');
  checkRecords(raw.projects, 'projects', ['number', 'name', 'createdAt', 'due', 'status'], ['scopes']);
  checkRecords(raw.clients, 'clients', ['name']);
  checkRecords(raw.people, 'people', ['name', 'role']);
  if (!isObject(raw.read)) throw new Error('The backup has no reminder list.');
  if (!(raw.people as User[]).some((u) => u.id === meId)) throw new Error('This backup does not include your own entry.');
  const backup = raw as unknown as Backup;
  return { ...backup, projects: backup.projects.map(normalizeProject) };
}

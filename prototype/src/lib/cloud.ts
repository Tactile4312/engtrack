// Live mode: data saved in Supabase for one signed-in user.
// The demo build (npm run build:demo) and a build without .env.local have no cloud and behave as the prototype.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Client, Project, User } from '../types';
import { normalizeProject } from './normalize';
import { differs, findConflicts, stamp, type Versions } from './versions';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const LIVE = import.meta.env.MODE !== 'demo' && !!url && !!key;

export const supabase: SupabaseClient | null = LIVE ? createClient(url!, key!) : null;

/** The signed-in person's own id in the people list. */
export const ME_ID = 'me';

export const signOut = () => supabase!.auth.signOut();

export interface Settings {
  read: Record<string, true>;
  /** Ids of the sample records added on first sign-in, so they can be removed in one step. */
  demo?: { projects: string[]; clients: string[]; people: string[] };
  /** When the user last downloaded a backup file. */
  lastBackup?: string;
}

export interface Snapshot {
  projects: Project[];
  clients: Client[];
  people: User[];
  settings: Settings;
}

export type Table = 'projects' | 'clients' | 'people';
export const TABLES: Table[] = ['projects', 'clients', 'people'];

/** What this device last saw of each table; see lib/versions.ts. */
export type TableVersions = Record<Table, Versions>;
export const noVersions = (): TableVersions => ({ projects: new Map(), clients: new Map(), people: new Map() });

/** A save stopped because another device changed the same records since this one loaded them. */
export class ConflictError extends Error {
  constructor(readonly table: Table, readonly ids: string[]) {
    super(`Changed on another device: ${table} ${ids.join(', ')}`);
    this.name = 'ConflictError';
  }
}

let owner = '';
/** Set after sign-in; every saved row carries the owner id (Row Level Security checks it). */
export const setOwner = (id: string) => (owner = id);

async function rows<T>(table: Table): Promise<{ list: T[]; versions: Versions }> {
  const { data, error } = await supabase!.from(table).select('id, data, updated_at');
  if (error) throw error;
  const list = data ?? [];
  return { list: list.map((r) => r.data as T), versions: new Map(list.map((r) => [r.id as string, stamp(r.updated_at)])) };
}

/** When each record (or just the given ones) was last written, as the database has it now. */
async function serverVersions(table: Table, ids?: string[]): Promise<Versions> {
  let query = supabase!.from(table).select('id, updated_at');
  if (ids) query = query.in('id', ids);
  const { data, error } = await query;
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.id as string, stamp(r.updated_at)]));
}

export async function loadAll(): Promise<{ snapshot: Snapshot; versions: TableVersions }> {
  const [projects, clients, people, settings] = await Promise.all([
    rows<Project>('projects'),
    rows<Client>('clients'),
    rows<User>('people'),
    supabase!.from('settings').select('data').maybeSingle(),
  ]);
  if (settings.error) throw settings.error;
  const projectList = projects.list.map(normalizeProject).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    snapshot: { projects: projectList, clients: clients.list, people: people.list, settings: { read: {}, ...(settings.data?.data as Partial<Settings> | undefined) } },
    versions: { projects: projects.versions, clients: clients.versions, people: people.versions },
  };
}

/** True when another device has saved, added or removed anything since this one loaded or saved. */
export async function changedElsewhere(known: TableVersions): Promise<boolean> {
  const server = await Promise.all(TABLES.map((t) => serverVersions(t)));
  return TABLES.some((t, i) => differs(known[t], server[i]));
}

/**
 * Upserts changed records and deletes removed ones, comparing by object identity (the store never mutates).
 * Unless forced, first checks that nobody else changed those records, and throws ConflictError if they did.
 * Keeps `versions` up to date with what was written.
 */
export async function saveDiff<T extends { id: string }>(table: Table, before: T[], after: T[], versions: Versions, { force = false } = {}) {
  const old = new Map(before.map((x) => [x.id, x]));
  const changed = after.filter((x) => old.get(x.id) !== x);
  const keep = new Set(after.map((x) => x.id));
  const removed = before.filter((x) => !keep.has(x.id)).map((x) => x.id);
  if (!changed.length && !removed.length) return;
  if (!force) {
    const changedIds = changed.map((x) => x.id);
    const clash = findConflicts(changedIds, removed, versions, await serverVersions(table, [...changedIds, ...removed]));
    if (clash.length) throw new ConflictError(table, clash);
  }
  if (changed.length) {
    const at = new Date().toISOString();
    const { error } = await supabase!.from(table).upsert(changed.map((x) => ({ owner, id: x.id, data: x, updated_at: at })), { onConflict: 'owner,id' });
    if (error) throw error;
    for (const x of changed) versions.set(x.id, stamp(at));
  }
  if (removed.length) {
    const { error } = await supabase!.from(table).delete().in('id', removed);
    if (error) throw error;
    for (const id of removed) versions.delete(id);
  }
}

export async function saveSettings(settings: Settings) {
  const { error } = await supabase!.from('settings').upsert({ owner, data: settings, updated_at: new Date().toISOString() }, { onConflict: 'owner' });
  if (error) throw error;
}

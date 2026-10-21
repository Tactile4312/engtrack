// Live mode: data saved in Supabase for one signed-in user.
// The demo build (npm run build:demo) and a build without .env.local have no cloud and behave as the prototype.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Client, Project, User } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const LIVE = import.meta.env.MODE !== 'demo' && !!url && !!key;

export const supabase: SupabaseClient | null = LIVE ? createClient(url!, key!) : null;

/** The signed-in person's own id in the people list. */
export const ME_ID = 'me';

export interface Settings {
  read: Record<string, true>;
  /** Ids of the sample records added on first sign-in, so they can be removed in one step. */
  demo?: { projects: string[]; clients: string[]; people: string[] };
}

export interface Snapshot {
  projects: Project[];
  clients: Client[];
  people: User[];
  settings: Settings;
}

type Table = 'projects' | 'clients' | 'people';

let owner = '';
/** Set after sign-in; every saved row carries the owner id (Row Level Security checks it). */
export const setOwner = (id: string) => (owner = id);

async function rows<T>(table: Table): Promise<T[]> {
  const { data, error } = await supabase!.from(table).select('data');
  if (error) throw error;
  return (data ?? []).map((r) => r.data as T);
}

export async function loadAll(): Promise<Snapshot> {
  const [projects, clients, people, settings] = await Promise.all([
    rows<Project>('projects'),
    rows<Client>('clients'),
    rows<User>('people'),
    supabase!.from('settings').select('data').maybeSingle(),
  ]);
  if (settings.error) throw settings.error;
  projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { projects, clients, people, settings: { read: {}, ...(settings.data?.data as Partial<Settings> | undefined) } };
}

/** Upserts changed records and deletes removed ones, comparing by object identity (the store never mutates). */
export async function saveDiff<T extends { id: string }>(table: Table, before: T[], after: T[]) {
  const old = new Map(before.map((x) => [x.id, x]));
  const changed = after.filter((x) => old.get(x.id) !== x);
  const keep = new Set(after.map((x) => x.id));
  const removed = before.filter((x) => !keep.has(x.id)).map((x) => x.id);
  if (changed.length) {
    const { error } = await supabase!.from(table).upsert(changed.map((x) => ({ owner, id: x.id, data: x, updated_at: new Date().toISOString() })), { onConflict: 'owner,id' });
    if (error) throw error;
  }
  if (removed.length) {
    const { error } = await supabase!.from(table).delete().in('id', removed);
    if (error) throw error;
  }
}

export async function saveSettings(settings: Settings) {
  const { error } = await supabase!.from('settings').upsert({ owner, data: settings, updated_at: new Date().toISOString() }, { onConflict: 'owner' });
  if (error) throw error;
}

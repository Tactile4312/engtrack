// Matching for the quick search (Ctrl+K): every word typed must appear somewhere in the item.
import type { Client, Project } from '../types';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Splits a query into lowercase words; an empty query has no words. */
export const words = (q: string) => norm(q).split(/\s+/).filter(Boolean);

/** True when every word appears in at least one of the texts. */
export function matches(q: string[], ...texts: (string | undefined)[]) {
  const hay = norm(texts.filter(Boolean).join(' '));
  return q.every((w) => hay.includes(w));
}

/**
 * Projects matching the query, best first: an exact project number, then numbers that start with
 * the query, then names that start with it, then everything else in the order given.
 */
export function searchProjects(projects: Project[], clients: Client[], query: string, limit = 8): Project[] {
  const q = words(query);
  if (!q.length) return [];
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const whole = norm(query.trim());
  const rank = (p: Project) => {
    const num = norm(p.number);
    if (num === whole) return 0;
    if (num.startsWith(whole) || num.endsWith(whole)) return 1;
    if (norm(p.name).startsWith(whole)) return 2;
    return 3;
  };
  return projects
    .filter((p) => matches(q, p.number, p.name, clientName.get(p.clientId), ...p.scopes.map((s) => s.type)))
    .map((p, i) => ({ p, r: rank(p), i }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}

export function searchClients(clients: Client[], query: string, limit = 4): Client[] {
  const q = words(query);
  if (!q.length) return [];
  return clients.filter((c) => matches(q, c.name, c.company, c.contact)).slice(0, limit);
}

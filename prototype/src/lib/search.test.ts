import { describe, expect, it } from 'vitest';
import { buildSeed } from '../mock-data/seed';
import { matches, searchClients, searchProjects, words } from './search';

const { projects, clients } = buildSeed();

describe('quick search', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(words('  Reäctor   LIFT ')).toEqual(['reactor', 'lift']);
    expect(matches(['reactor', 'lift'], 'Reactor Vessel R-301 Lift')).toBe(true);
    expect(matches(['reactor', 'crane'], 'Reactor Vessel R-301 Lift')).toBe(false);
  });

  it('finds nothing for an empty query', () => {
    expect(searchProjects(projects, clients, '   ')).toEqual([]);
    expect(searchClients(clients, '')).toEqual([]);
  });

  it('puts an exact project number first', () => {
    expect(searchProjects(projects, clients, 'crm-2026-0142')[0].number).toBe('CRM-2026-0142');
  });

  it('finds a project by the last digits of its number', () => {
    expect(searchProjects(projects, clients, '0142').map((p) => p.number)).toContain('CRM-2026-0142');
  });

  it('finds projects by client name and by scope', () => {
    const client = clients.find((c) => projects.some((p) => p.clientId === c.id))!;
    const found = searchProjects(projects, clients, client.name.split(' ')[0], 50);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((p) => p.clientId === client.id || p.name.toLowerCase().includes(client.name.split(' ')[0].toLowerCase()))).toBe(true);
    expect(searchProjects(projects, clients, 'route survey', 50).every((p) => p.scopes.some((s) => s.type === 'Route Survey'))).toBe(true);
  });

  it('stops at the limit', () => expect(searchProjects(projects, clients, 'crm', 3)).toHaveLength(3));

  it('finds clients by name or contact person', () => {
    const c = clients[0];
    expect(searchClients(clients, c.contact.split(' ')[0])).toContainEqual(c);
  });
});

import { describe, expect, it } from 'vitest';
import { buildSchedule, can, canEditClient, canSee, nextFreeNumber, projectProgress, sentTo } from './rules';
import { validateClient, validateProject, type ClientDraft, type ProjectDraft } from './validation';
import { addDays, todayISO } from './dates';
import { buildSeed, USERS } from '../mock-data/seed';
import type { Project } from '../types';

const T = todayISO();
const seed = () => buildSeed().projects;
const byNum = (ps: Project[], n: string) => ps.find((p) => p.number === n)!;

describe('Q2 progress', () => {
  it('is the simple average of the scopes', () => {
    expect(projectProgress({ scopes: [100, 60, 50, 20].map((progress) => ({ progress, status: 'In Progress' }) as never) })).toBe(58);
  });
  it('ignores cancelled scopes and handles none', () => {
    expect(projectProgress({ scopes: [{ progress: 80, status: 'In Progress' }, { progress: 0, status: 'Cancelled' }] as never })).toBe(80);
    expect(projectProgress({ scopes: [] })).toBe(0);
  });
});

describe('Q3 project number', () => {
  const ps = seed();
  const draft: ProjectDraft = {
    number: 'CRM-2026-0901', name: 'Test lift', clientId: 'c1', description: '', requested: T, start: T, due: addDays(T, 10),
    priority: 'Normal', status: 'New Request', salesId: 'u-s1', pmId: 'u-pm1', scopes: [{ type: 'Lifting', engineerId: '', start: T, due: addDays(T, 5), priority: 'Normal' }],
  };
  it('accepts a valid draft', () => expect(validateProject(draft, ps)).toEqual({}));
  it('rejects a wrong format', () => expect(validateProject({ ...draft, number: '2026-12' }, ps).number).toMatch(/format/));
  it('blocks duplicates, case-insensitively', () => expect(validateProject({ ...draft, number: 'crm-2026-0142' }, ps).number).toMatch(/already used/));
  it('allows keeping its own number when editing', () => expect(validateProject({ ...draft, number: 'CRM-2026-0142' }, ps, 'CRM-2026-0142').number).toBeUndefined());
  it('rejects a due date before the start date', () => expect(validateProject({ ...draft, due: addDays(T, -1) }, ps).due).toMatch(/before the start/));
  it('rejects a scope due after the project', () => {
    const e = validateProject({ ...draft, scopes: [{ ...draft.scopes[0], due: addDays(T, 20) }] }, ps);
    expect(e['scope:Lifting']).toMatch(/after the project due date/);
  });
  it('requires at least one scope', () => expect(validateProject({ ...draft, scopes: [] }, ps).scopes).toBeDefined());
  it('suggests the next free number', () => expect(nextFreeNumber(ps, 2026)).toBe('CRM-2026-0154'));
});

describe('Q4 reminders', () => {
  const ps = seed();
  const sched = buildSchedule(ps);
  it('never repeats a key', () => expect(new Set(sched.map((n) => n.key)).size).toBe(sched.length));
  it('skips completed and cancelled work', () => {
    const closed = ps.filter((p) => p.status === 'Completed' || p.status === 'Cancelled').map((p) => p.id);
    expect(sched.some((n) => closed.includes(n.projectId))).toBe(false);
  });
  it('sends the project manager only 1-day, due-today and overdue', () => {
    const steps = new Set(sched.filter((n) => n.itemType === 'project' && n.recipientId === byNum(ps, 'CRM-2026-0142').pmId && n.projectId === 'CRM-2026-0142').map((n) => n.step));
    expect([...steps].sort()).toEqual(['1d', 'overdue', 'today']);
  });
  it('sends the salesperson overdue alerts only', () => {
    const steps = new Set(sched.filter((n) => n.recipientId === 'u-s3').map((n) => n.step));
    expect([...steps]).toEqual(['overdue']);
  });
  it('gives the engineer a due-today reminder for the project due today', () => {
    const got = sentTo(sched, 'u-e2', T).filter((n) => n.projectId === 'CRM-2026-0138' && n.itemType === 'project' && n.step === 'today');
    expect(got).toHaveLength(1);
  });
  it('does not remind engineers whose scope is already finished', () => {
    // Jun Cruz finished Bridging on 0138; Mia Tan still has Transport open.
    const r = sched.filter((n) => n.projectId === 'CRM-2026-0138' && n.itemType === 'project').map((n) => n.recipientId);
    expect(r).not.toContain('u-e1');
    expect(r).toContain('u-e2');
  });
  it('reschedules when a due date changes', () => {
    const moved = ps.map((p) => (p.number === 'CRM-2026-0127' ? { ...p, due: addDays(p.due, 5) } : p));
    const a = buildSchedule(ps).filter((n) => n.projectId === 'CRM-2026-0127' && n.itemType === 'project' && n.step === '7d');
    const b = buildSchedule(moved).filter((n) => n.projectId === 'CRM-2026-0127' && n.itemType === 'project' && n.step === '7d');
    expect(b[0].trigger).toBe(addDays(a[0].trigger, 5));
  });
  it('stops once the project is completed', () => {
    const done = ps.map((p) => (p.number === 'CRM-2026-0116' ? { ...p, status: 'Completed' as const } : p));
    expect(buildSchedule(done).some((n) => n.projectId === 'CRM-2026-0116')).toBe(false);
  });
});

describe('Q7 visibility', () => {
  const { projects, clients } = buildSeed();
  const u = (id: string) => USERS.find((x) => x.id === id)!;
  it('engineers see only projects they are assigned to', () => {
    const seen = projects.filter((p) => canSee(u('u-e3'), p, clients));
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((p) => p.scopes.some((s) => s.engineerId === 'u-e3'))).toBe(true);
  });
  it("salespeople see their own and their clients' projects", () => {
    const seen = projects.filter((p) => canSee(u('u-s3'), p, clients));
    expect(seen.every((p) => p.salesId === 'u-s3' || clients.find((c) => c.id === p.clientId)!.salesId === 'u-s3')).toBe(true);
    expect(seen.some((p) => p.number === 'CRM-2026-0131')).toBe(true); // client c3 belongs to u-s3, project sold by u-s1
  });
  it('project managers see everything', () => expect(projects.every((p) => canSee(u('u-pm2'), p, clients))).toBe(true));
});

describe('Clients', () => {
  const clients = buildSeed().clients;
  const user = (id: string) => USERS.find((u) => u.id === id)!;
  const draft: ClientDraft = { name: 'Eastport Terminals', company: '', contact: 'Ben Ortiz', email: 'b.ortiz@eastport.example', phone: '+63 917 000 0199', address: '', notes: '', salesId: 'u-s1' };
  it('accepts a valid client', () => expect(validateClient(draft, clients)).toEqual({}));
  it('blocks a duplicate name, ignoring case and extra spaces', () => {
    expect(validateClient({ ...draft, name: '  meridian   petrochem inc. ' }, clients).name).toMatch(/already/);
    expect(validateClient({ ...draft, name: 'Meridian Petrochem Inc.' }, clients, 'c1')).toEqual({});
  });
  it('checks email, phone and required fields', () => {
    const e = validateClient({ ...draft, contact: ' ', email: 'not-an-email', phone: '12-ab', salesId: '' }, clients);
    expect(Object.keys(e).sort()).toEqual(['contact', 'email', 'phone', 'salesId']);
  });
  it('lets admins, PMs and salespeople add clients, not engineers', () => {
    expect(['u-admin', 'u-pm1', 'u-s1'].every((id) => can(user(id), 'addClient'))).toBe(true);
    expect(can(user('u-e1'), 'addClient')).toBe(false);
  });
  it('lets a salesperson edit only their own clients', () => {
    const c1 = clients.find((c) => c.id === 'c1')!;
    expect(canEditClient(user('u-s1'), c1)).toBe(true);
    expect(canEditClient(user('u-s2'), c1)).toBe(false);
    expect(canEditClient(user('u-pm2'), c1)).toBe(true);
    expect(canEditClient(user('u-e1'), c1)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { reducer } from './reducer';
import { initial, type Msg, type State } from './state';
import type { Project } from '../types';

function deepFreeze<T>(v: T): T {
  if (v && typeof v === 'object') {
    Object.values(v).forEach(deepFreeze);
    Object.freeze(v);
  }
  return v;
}

const start = (): State => initial();
const first = (s: State): Project => s.projects.find((p) => p.scopes.length > 0 && p.tasks.length > 0 && p.milestones.length > 0)!;
const byId = (s: State, id: string) => s.projects.find((p) => p.id === id)!;

describe('reducer', () => {
  it('never changes the state it was given', () => {
    const s = deepFreeze(start());
    const p = first(s);
    const msgs: Msg[] = [
      { t: 'user', id: s.people[0].id }, { t: 'go', route: { page: 'reports' } }, { t: 'back' },
      { t: 'save', project: { ...p, name: 'x' }, isNew: false },
      { t: 'client', client: { ...s.clients[0], name: 'x' }, isNew: false },
      { t: 'person', person: { ...s.people[0], name: 'x' }, isNew: false }, { t: 'unperson', id: s.people[0].id },
      { t: 'addDemo' }, { t: 'backedUp', at: 'x' },
      { t: 'scope', projectId: p.id, scopeId: p.scopes[0].id, patch: { progress: 1, status: 'Completed' }, note: 'x' },
      { t: 'status', projectId: p.id, status: 'Completed' }, { t: 'archive', projectId: p.id, archived: true }, { t: 'delete', projectId: p.id },
      { t: 'task', projectId: p.id, taskId: p.tasks[0].id }, { t: 'milestone', projectId: p.id, milestoneId: p.milestones[0].id },
      { t: 'note', projectId: p.id, text: 'x' }, { t: 'read', keys: ['a'] }, { t: 'toast', text: 'x' },
    ];
    // Frozen objects throw if anything tries to edit them in place.
    for (const m of msgs) expect(() => reducer(s, m), m.t).not.toThrow();
    const demo = deepFreeze({ ...start(), demo: { projects: [p.id], clients: [], people: [] } });
    expect(() => reducer(demo, { t: 'removeDemo' })).not.toThrow();
  });

  it('marks reminders as read in a new object', () => {
    const s = start();
    const next = reducer(s, { t: 'read', keys: ['a'] });
    expect(next.read.a).toBe(true);
    expect(next).not.toBe(s);
    expect(s.read.a).toBeUndefined();
  });

  it('keeps other projects as the same objects, because auto-save relies on that', () => {
    const s = start();
    const p = first(s);
    const next = reducer(s, { t: 'note', projectId: p.id, text: 'hello' });
    for (const other of s.projects.filter((x) => x.id !== p.id)) expect(byId(next, other.id)).toBe(other);
    expect(byId(next, p.id)).not.toBe(p);
  });

  it('ignores a scope, task or milestone that no longer exists', () => {
    const s = start();
    const p = first(s);
    expect(byId(reducer(s, { t: 'scope', projectId: p.id, scopeId: 'gone', patch: { progress: 5 } }), p.id).scopes).toEqual(p.scopes);
    expect(byId(reducer(s, { t: 'task', projectId: p.id, taskId: 'gone' }), p.id).tasks).toEqual(p.tasks);
    expect(byId(reducer(s, { t: 'milestone', projectId: p.id, milestoneId: 'gone' }), p.id).milestones).toEqual(p.milestones);
  });

  it('completing a scope sets progress to 100 and records it', () => {
    const s = start();
    const p = first(s);
    const scope = p.scopes.find((x) => x.status !== 'Completed')!;
    const next = byId(reducer(s, { t: 'scope', projectId: p.id, scopeId: scope.id, patch: { status: 'Completed' } }), p.id);
    const got = next.scopes.find((x) => x.id === scope.id)!;
    expect(got.progress).toBe(100);
    expect(got.completed).toBeTruthy();
    expect(next.activity.some((a) => a.action.startsWith('Status changed'))).toBe(true);
  });

  it('records engineer changes using names from the current people list', () => {
    const s = start();
    const p = first(s);
    const scope = p.scopes[0];
    const newcomer = { id: 'u-new', name: 'New Person', role: 'Engineer' as const, email: '' };
    const withPerson = reducer(s, { t: 'person', person: newcomer, isNew: true });
    const next = byId(reducer(withPerson, { t: 'scope', projectId: p.id, scopeId: scope.id, patch: { engineerId: 'u-new' } }), p.id);
    expect(next.activity[0].to).toBe('New Person');
  });

  it('completing a project sets its finish date and logs it', () => {
    const s = start();
    const p = first(s);
    const next = byId(reducer(s, { t: 'status', projectId: p.id, status: 'Completed' }), p.id);
    expect(next.actualFinish).toBeTruthy();
    expect(next.activity[0].action).toBe('Project completed');
  });

  it('toggling a task twice returns it to where it started', () => {
    const s = start();
    const p = first(s);
    const task = p.tasks[0];
    const once = reducer(s, { t: 'task', projectId: p.id, taskId: task.id });
    const twice = reducer(once, { t: 'task', projectId: p.id, taskId: task.id });
    expect(byId(once, p.id).tasks[0].done).toBe(!task.done);
    expect(byId(twice, p.id).tasks[0].done).toBe(task.done);
  });

  it('removing sample data keeps your own records and clears links to removed people', () => {
    const s = start();
    const own: Project = { ...first(s), id: 'mine', number: 'CRM-2026-9999' };
    const state: State = {
      ...s,
      projects: [...s.projects, own],
      demo: { projects: s.projects.map((p) => p.id), clients: [], people: s.people.map((u) => u.id) },
    };
    const next = reducer(state, { t: 'removeDemo' });
    expect(next.projects.map((p) => p.id)).toEqual(['mine']);
    expect(next.projects[0].pmId).toBe('');
    expect(next.people).toEqual([]);
    expect(next.demo).toBeUndefined();
  });

  it('adding sample data twice does not duplicate records', () => {
    const s = start();
    const next = reducer(s, { t: 'addDemo' });
    expect(next.projects).toHaveLength(s.projects.length);
    expect(new Set(next.projects.map((p) => p.id)).size).toBe(next.projects.length);
  });

  it('restore replaces data and keeps who is signed in', () => {
    const s = start();
    const next = reducer(s, { t: 'restore', backup: { app: 'engtrack', version: 1, exportedAt: 'x', projects: [], clients: [], people: s.people, read: {} } });
    expect(next.projects).toEqual([]);
    expect(next.userId).toBe(s.userId);
    expect(next.route).toEqual({ page: 'dashboard' });
  });

  it('back returns to the previous screen, or the dashboard when there is none', () => {
    const s = reducer(start(), { t: 'go', route: { page: 'reports' } });
    expect(reducer(s, { t: 'back' }).route).toEqual({ page: 'dashboard' });
    expect(reducer(start(), { t: 'back' }).route).toEqual({ page: 'dashboard' });
  });
});

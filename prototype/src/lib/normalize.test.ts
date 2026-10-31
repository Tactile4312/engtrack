import { describe, expect, it } from 'vitest';
import { normalizeProject } from './normalize';
import { makeBackup, parseBackup } from './backup';
import { buildSeed, USERS } from '../mock-data/seed';
import type { Project } from '../types';

describe('older saved records', () => {
  const current = buildSeed().projects[0];
  const { tasks: _t, notes: _n, attachments: _a, activity: _ac, milestones: _m, archived: _ar, ...old } = current;

  it('fills in anything an older record is missing', () => {
    const got = normalizeProject(old as Project);
    expect(got.tasks).toEqual([]);
    expect(got.notes).toEqual([]);
    expect(got.attachments).toEqual([]);
    expect(got.activity).toEqual([]);
    expect(got.milestones).toEqual([]);
    expect(got.archived).toBe(false);
  });

  it('leaves a complete record unchanged', () => expect(normalizeProject(current)).toEqual(current));

  it('accepts an older backup and fills in the gaps', () => {
    const b = makeBackup({ projects: [old as Project], clients: [], people: USERS, read: {} }, 'x');
    expect(parseBackup(JSON.stringify(b), USERS[0].id).projects[0].tasks).toEqual([]);
  });
});

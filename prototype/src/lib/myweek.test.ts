import { describe, expect, it } from 'vitest';
import { myWeek } from './myweek';
import { addDays } from './dates';
import { buildSeed } from '../mock-data/seed';
import type { Project } from '../types';

const T = '2026-11-09';
const base = (): Project => {
  const p = structuredClone(buildSeed().projects[0]);
  return { ...p, id: 'p1', status: 'In Progress', pmId: 'me', due: addDays(T, 30), scopes: [], tasks: [], milestones: [] };
};

describe('myWeek', () => {
  it('collects only my open items due within the week, plus overdue ones', () => {
    const p: Project = {
      ...base(),
      due: addDays(T, 2),
      milestones: [
        { id: 'm1', name: 'Kick-off', date: T, done: false },
        { id: 'm2', name: 'Done one', date: T, done: true },
        { id: 'm3', name: 'Far away', date: addDays(T, 20), done: false },
      ],
      scopes: [
        { ...structuredClone(buildSeed().projects[0].scopes[0]), id: 's1', engineerId: 'me', due: addDays(T, -1), status: 'In Progress' },
        { ...structuredClone(buildSeed().projects[0].scopes[0]), id: 's2', engineerId: 'someone', due: T, status: 'In Progress' },
      ],
      tasks: [
        { id: 't1', name: 'Check slings', scopeId: null, assigneeId: 'me', due: addDays(T, 6), done: false, completed: null },
        { id: 't2', name: 'Day 8', scopeId: null, assigneeId: 'me', due: addDays(T, 7), done: false, completed: null },
        { id: 't3', name: 'Ticked', scopeId: null, assigneeId: 'me', due: T, done: true, completed: T },
        { id: 't4', name: 'No date', scopeId: null, assigneeId: 'me', due: null, done: false, completed: null },
      ],
    };
    const { groups, count } = myWeek([p], 'me', T);
    expect(count).toBe(4);
    expect(groups[0].day).toBe('overdue');
    expect(groups[0].items.map((i) => i.key)).toEqual(['s:p1:s1']);
    expect(groups.find((g) => g.day === T)!.items.map((i) => i.label)).toEqual(['Kick-off']);
    expect(groups.find((g) => g.day === addDays(T, 2))!.items[0].kind).toBe('project');
    expect(groups.find((g) => g.day === addDays(T, 6))!.items[0].taskId).toBe('t1');
    expect(groups).toHaveLength(8);
  });

  it('skips closed projects and shows no overdue group when nothing is late', () => {
    const closed = { ...base(), status: 'Completed' as const, due: T };
    const { groups, count } = myWeek([closed], 'me', T);
    expect(count).toBe(0);
    expect(groups[0].day).toBe(T);
    expect(groups).toHaveLength(7);
  });

  it("does not show other people's projects", () => {
    expect(myWeek([{ ...base(), pmId: 'other', due: T }], 'me', T).count).toBe(0);
  });
});

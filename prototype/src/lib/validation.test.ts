import { describe, expect, it } from 'vitest';
import { buildSeed } from '../mock-data/seed';
import { PLAN_NAME_MAX, validateMilestone, validateTask, type TaskDraft } from './validation';

const p = buildSeed().projects.find((x) => x.scopes.length > 0 && x.milestones.length > 0)!;
const task = (over: Partial<TaskDraft> = {}): TaskDraft => ({ name: 'Check rigging certificates', scopeId: '', assigneeId: '', due: '', ...over });

describe('task checks', () => {
  it('accepts a task with only a name, for the whole project', () => expect(validateTask(task(), p)).toEqual({}));

  it('accepts a task under one of the project’s scopes, due on the project due date', () =>
    expect(validateTask(task({ scopeId: p.scopes[0].id, due: p.due }), p)).toEqual({}));

  it('needs a name that is not just spaces', () => expect(validateTask(task({ name: '   ' }), p).name).toBeTruthy());

  it('refuses a name longer than the limit', () => {
    expect(validateTask(task({ name: 'x'.repeat(PLAN_NAME_MAX) }), p).name).toBeUndefined();
    expect(validateTask(task({ name: 'x'.repeat(PLAN_NAME_MAX + 1) }), p).name).toBeTruthy();
  });

  it('refuses a scope that is not on this project', () => expect(validateTask(task({ scopeId: 'not-here' }), p).scopeId).toBeTruthy());

  it('refuses a due date after the project due date', () => {
    const later = new Date(`${p.due}T12:00:00`);
    later.setDate(later.getDate() + 1);
    expect(validateTask(task({ due: later.toISOString().slice(0, 10) }), p).due).toBeTruthy();
  });
});

describe('milestone checks', () => {
  it('accepts a new name, with or without a date', () => {
    expect(validateMilestone({ name: 'Site induction', date: '' }, p)).toEqual({});
    expect(validateMilestone({ name: 'Site induction', date: p.due }, p)).toEqual({});
  });

  it('needs a name', () => expect(validateMilestone({ name: ' ', date: '' }, p).name).toBeTruthy());

  it('refuses a name already used on the project, ignoring case and spacing', () => {
    const taken = p.milestones[0].name;
    expect(validateMilestone({ name: `  ${taken.toUpperCase()} `, date: '' }, p).name).toBeTruthy();
  });

  it('lets a milestone keep its own name when edited', () =>
    expect(validateMilestone({ name: p.milestones[0].name, date: '' }, p, p.milestones[0].id)).toEqual({}));
});

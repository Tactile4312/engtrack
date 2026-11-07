import { describe, expect, it } from 'vitest';
import { ONE_LINERS, finishesAll, oneLinerFor } from './fun';

describe('oneLinerFor', () => {
  it('is stable for a day and comes from the list', () => {
    expect(oneLinerFor('2026-11-07')).toBe(oneLinerFor('2026-11-07'));
    expect(ONE_LINERS).toContain(oneLinerFor('2026-11-07'));
  });
  it('changes across days', () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    expect(new Set(days.map(oneLinerFor)).size).toBeGreaterThan(5);
  });
});

describe('finishesAll', () => {
  const t = (id: string, done: boolean) => ({ id, done });
  it('is true only when ticking the last open task', () => {
    expect(finishesAll([t('a', true), t('b', false)], 'b')).toBe(true);
    expect(finishesAll([t('a', false), t('b', false)], 'b')).toBe(false);
  });
  it('is false when un-ticking or when there are no tasks', () => {
    expect(finishesAll([t('a', true), t('b', true)], 'b')).toBe(false);
    expect(finishesAll([], 'b')).toBe(false);
  });
});

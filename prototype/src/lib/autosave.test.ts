import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutosave, type SaveStatus } from './autosave';

function setup(save: (v: number) => Promise<void>) {
  const statuses: SaveStatus[] = [];
  const auto = createAutosave<number>(save, (s) => statuses.push(s), { debounceMs: 600, retryMs: 5000 });
  return { auto, statuses };
}

describe('autosave', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('waits for a pause and saves only the newest value', async () => {
    const save = vi.fn(async () => {});
    const { auto, statuses } = setup(save);
    auto.push(1);
    await vi.advanceTimersByTimeAsync(300);
    auto.push(2);
    await vi.advanceTimersByTimeAsync(599);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save.mock.calls).toEqual([[2]]);
    expect(statuses[statuses.length - 1]).toBe('saved');
  });

  it('waits between retries instead of retrying nonstop', async () => {
    const save = vi.fn(async () => { throw new Error('offline'); });
    const { auto, statuses } = setup(save);
    auto.push(1);
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(1);
    expect(statuses[statuses.length - 1]).toBe('error');
    await vi.advanceTimersByTimeAsync(4999);
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(15000);
    expect(save).toHaveBeenCalledTimes(5);
  });

  it('saves after the connection comes back', async () => {
    let online = false;
    const saved: number[] = [];
    const { auto, statuses } = setup(async (v) => { if (!online) throw new Error('offline'); saved.push(v); });
    auto.push(1);
    await vi.advanceTimersByTimeAsync(600);
    online = true;
    await vi.advanceTimersByTimeAsync(5000);
    expect(saved).toEqual([1]);
    expect(statuses[statuses.length - 1]).toBe('saved');
  });

  it('a newer edit made during a failed period wins over the failed one', async () => {
    let online = false;
    const saved: number[] = [];
    const { auto } = setup(async (v) => { if (!online) throw new Error('offline'); saved.push(v); });
    auto.push(1);
    await vi.advanceTimersByTimeAsync(600);
    online = true;
    auto.push(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(saved).toEqual([2]);
  });

  it('never runs two saves at once, and saves an edit made during a save', async () => {
    let active = 0;
    let most = 0;
    const saved: number[] = [];
    const { auto, statuses } = setup(async (v) => {
      active++;
      most = Math.max(most, active);
      await new Promise((r) => setTimeout(r, 2000));
      saved.push(v);
      active--;
    });
    auto.push(1);
    await vi.advanceTimersByTimeAsync(600);
    auto.push(2);
    await vi.advanceTimersByTimeAsync(10000);
    expect(most).toBe(1);
    expect(saved).toEqual([1, 2]);
    expect(statuses[statuses.length - 1]).toBe('saved');
  });
});

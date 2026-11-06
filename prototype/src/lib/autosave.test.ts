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

  it('does not retry a failure that retrying cannot fix, but tries again on the next edit', async () => {
    const saved: number[] = [];
    let blocked = true;
    const statuses: SaveStatus[] = [];
    const auto = createAutosave<number>(
      async (v) => { if (blocked) throw new Error('conflict'); saved.push(v); },
      (s) => statuses.push(s),
      { debounceMs: 600, retryMs: 5000, retryable: (e) => !(e instanceof Error && e.message === 'conflict') },
    );
    auto.push(1);
    await vi.advanceTimersByTimeAsync(600);
    expect(statuses[statuses.length - 1]).toBe('error');
    await vi.advanceTimersByTimeAsync(60000);
    expect(saved).toEqual([]);
    blocked = false;
    auto.push(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(saved).toEqual([2]);
  });

  it('flush tries a blocked save again straight away', async () => {
    let blocked = true;
    const saved: number[] = [];
    const auto = createAutosave<number>(async (v) => { if (blocked) throw new Error('conflict'); saved.push(v); }, () => {}, { retryable: () => false });
    auto.push(1);
    await expect(auto.flush()).resolves.toBe(false);
    blocked = false;
    await expect(auto.flush()).resolves.toBe(true);
    expect(saved).toEqual([1]);
  });

  describe('flush (before signing out)', () => {
    it('saves a waiting edit straight away instead of after the pause', async () => {
      const save = vi.fn(async () => {});
      const { auto, statuses } = setup(save);
      auto.push(1);
      await expect(auto.flush()).resolves.toBe(true);
      expect(save.mock.calls).toEqual([[1]]);
      expect(statuses[statuses.length - 1]).toBe('saved');
      await vi.advanceTimersByTimeAsync(10000);
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('waits for a save already running and for an edit made during it', async () => {
      const saved: number[] = [];
      const { auto } = setup(async (v) => {
        await new Promise((r) => setTimeout(r, 2000));
        saved.push(v);
      });
      auto.push(1);
      await vi.advanceTimersByTimeAsync(600);
      auto.push(2);
      const done = auto.flush();
      await vi.advanceTimersByTimeAsync(4000);
      await expect(done).resolves.toBe(true);
      expect(saved).toEqual([1, 2]);
    });

    it('reports false when the save fails, and keeps the edit for a later retry', async () => {
      let online = false;
      const saved: number[] = [];
      const { auto } = setup(async (v) => { if (!online) throw new Error('offline'); saved.push(v); });
      auto.push(1);
      await expect(auto.flush()).resolves.toBe(false);
      online = true;
      await vi.advanceTimersByTimeAsync(5000);
      expect(saved).toEqual([1]);
    });

    it('reports true when there is nothing to save', async () => {
      const save = vi.fn(async () => {});
      const { auto } = setup(save);
      await expect(auto.flush()).resolves.toBe(true);
      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('stop (after signing out)', () => {
    it('drops a waiting edit and ignores later ones', async () => {
      const save = vi.fn(async () => {});
      const { auto, statuses } = setup(save);
      auto.push(1);
      auto.stop();
      const before = statuses.length;
      auto.push(2);
      await vi.advanceTimersByTimeAsync(10000);
      expect(save).not.toHaveBeenCalled();
      expect(statuses.length).toBe(before);
      await expect(auto.flush()).resolves.toBe(false);
    });

    it('stops retrying a failed save', async () => {
      const save = vi.fn(async () => { throw new Error('signed out'); });
      const { auto } = setup(save);
      auto.push(1);
      await vi.advanceTimersByTimeAsync(600);
      auto.stop();
      await vi.advanceTimersByTimeAsync(60000);
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('reports no status once stopped, even when a running save finishes', async () => {
      const { auto, statuses } = setup(() => new Promise((r) => setTimeout(r, 2000)));
      auto.push(1);
      await vi.advanceTimersByTimeAsync(600);
      const before = statuses.length;
      auto.stop();
      await vi.advanceTimersByTimeAsync(5000);
      expect(statuses.length).toBe(before);
    });
  });
});

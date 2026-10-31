// Saves the newest value after a short pause, one save at a time, and retries after a delay when a save fails.

export type SaveStatus = 'saved' | 'saving' | 'error';

export function createAutosave<T>(
  save: (value: T) => Promise<void>,
  onStatus: (status: SaveStatus) => void,
  { debounceMs = 600, retryMs = 5000 }: { debounceMs?: number; retryMs?: number } = {},
) {
  let pending: T | null = null;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), ms);
  };

  async function run(): Promise<void> {
    if (running || pending === null) return;
    running = true;
    const value = pending;
    pending = null;
    try {
      await save(value);
    } catch {
      // Keep the newest value queued and wait before trying again.
      pending = pending ?? value;
      running = false;
      onStatus('error');
      schedule(retryMs);
      return;
    }
    running = false;
    if (pending !== null) {
      onStatus('saving');
      return run();
    }
    onStatus('saved');
  }

  return {
    push(value: T) {
      pending = value;
      onStatus('saving');
      schedule(debounceMs);
    },
  };
}

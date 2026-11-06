// Saves the newest value after a short pause, one save at a time, and retries after a delay when a save fails.
// flush() saves straight away and reports whether everything reached the database (used before signing out).
// stop() drops anything unsaved and ignores later changes (used when the signed-in session ends).
// A failure that retrying cannot fix (see `retryable`) waits for the next edit or flush() instead.

export type SaveStatus = 'saved' | 'saving' | 'error';

export function createAutosave<T>(
  save: (value: T) => Promise<void>,
  onStatus: (status: SaveStatus) => void,
  {
    debounceMs = 600,
    retryMs = 5000,
    retryable = () => true,
  }: { debounceMs?: number; retryMs?: number; retryable?: (error: unknown) => boolean } = {},
) {
  let pending: T | null = null;
  /** The save in progress, resolving to whether it (and any edit queued during it) succeeded. */
  let current: Promise<boolean> | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), ms);
  };

  function run(): Promise<boolean> {
    if (current) return current;
    if (stopped || pending === null) return Promise.resolve(true);
    const value = pending;
    pending = null;
    let retry = true;
    current = save(value).then(
      () => true,
      (error: unknown) => {
        // Keep the newest value queued.
        pending = pending ?? value;
        retry = retryable(error);
        return false;
      },
    ).then((ok) => {
      current = null;
      if (stopped) return false;
      if (!ok) {
        onStatus('error');
        if (retry) schedule(retryMs);
        return false;
      }
      if (pending !== null) {
        onStatus('saving');
        return run();
      }
      onStatus('saved');
      return true;
    });
    return current;
  }

  return {
    push(value: T) {
      if (stopped) return;
      pending = value;
      onStatus('saving');
      schedule(debounceMs);
    },
    /** Saves now instead of after the pause. Resolves true once nothing is left unsaved, false if a save failed. */
    async flush(): Promise<boolean> {
      clearTimeout(timer);
      while (!stopped && (current || pending !== null)) {
        if (!(await run())) return false;
      }
      return !stopped;
    },
    stop() {
      stopped = true;
      pending = null;
      clearTimeout(timer);
    },
  };
}

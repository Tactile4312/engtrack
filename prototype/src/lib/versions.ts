// Spotting edits made on another device. Every saved row carries the time it was last written (updated_at).
// This device remembers that time for each record it loaded or saved; if the database holds a different time,
// someone else changed the record since, and saving over it would silently throw their change away.

/** Record id -> when it was last written, in milliseconds (so '…Z' and '…+00:00' compare equal). */
export type Versions = Map<string, number>;

export const stamp = (isoTime: string) => new Date(isoTime).getTime();

/**
 * Ids that must not be saved without asking:
 * - a changed record whose database copy is newer, was deleted, or was created elsewhere with the same id;
 * - a removed record that was changed elsewhere (removing one that is already gone is fine).
 */
export function findConflicts(changed: string[], removed: string[], known: Versions, server: Versions): string[] {
  const clash = changed.filter((id) => server.get(id) !== known.get(id));
  const lost = removed.filter((id) => server.has(id) && server.get(id) !== known.get(id));
  return [...clash, ...lost];
}

/** True when the database holds anything this device has not seen: a new, changed or removed record. */
export function differs(known: Versions, server: Versions): boolean {
  if (known.size !== server.size) return true;
  for (const [id, at] of server) if (known.get(id) !== at) return true;
  return false;
}

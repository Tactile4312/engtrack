// Saved records can be older than the current code. Fill in anything a newer version added,
// so old rows and old backups keep working. When you add a field to Project, add its default here.
import type { Project } from '../types';

export function normalizeProject(raw: Project): Project {
  return {
    ...raw,
    archived: raw.archived ?? false,
    scopes: raw.scopes ?? [],
    tasks: (raw.tasks ?? []).map((t) => ({ ...t, completed: t.completed ?? null })),
    milestones: raw.milestones ?? [],
    notes: raw.notes ?? [],
    attachments: raw.attachments ?? [],
    activity: raw.activity ?? [],
  };
}

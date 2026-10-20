import { useMemo } from 'react';
import { useApp } from '../store/AppStore';
import type { Notice, Project } from '../types';
import { latestPerItem, sentTo, upcomingFor } from './rules';

export interface InboxItem extends Notice {
  project: Project;
  read: boolean;
}

/** The current user's in-app notifications: the latest reminder per item, read state included. */
export function useInbox() {
  const { schedule, me, today, s, visibleAll } = useApp();
  return useMemo(() => {
    const byId = new Map(visibleAll.map((p) => [p.id, p]));
    const attach = (list: Notice[]) =>
      list.filter((n) => byId.has(n.projectId)).map((n) => ({ ...n, project: byId.get(n.projectId)!, read: !!s.read[n.key] }));
    const items: InboxItem[] = attach(latestPerItem(sentTo(schedule, me.id, today)));
    const upcoming: InboxItem[] = attach(upcomingFor(schedule, me.id, today, 14));
    return { items, unread: items.filter((i) => !i.read).length, upcoming };
  }, [schedule, me.id, today, s.read, visibleAll]);
}

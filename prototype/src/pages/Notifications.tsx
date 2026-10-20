import { useState } from 'react';
import { AlertTriangle, BellRing, CalendarClock, ChevronRight, Clock } from 'lucide-react';
import { shortName, useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Card, Chip, Empty, cx } from '../components/ui';
import { useInbox, type InboxItem } from '../lib/hooks';
import { fmt } from '../lib/dates';
import { RECIPIENT_RULES, STEP_LABEL } from '../lib/rules';
import type { ReminderStep } from '../types';

type F = 'unread' | 'all' | 'overdue' | 'today';

function roleOn(n: InboxItem, userId: string) {
  if (n.project.pmId === userId) return 'project manager';
  if (n.project.salesId === userId) return 'salesperson';
  return 'assigned engineer';
}

const ICON: Record<ReminderStep, typeof Clock> = { '7d': CalendarClock, '3d': CalendarClock, '1d': Clock, today: BellRing, overdue: AlertTriangle };

export function Notifications() {
  const { go, dispatch, me, isMobile } = useApp();
  const { items, unread, upcoming } = useInbox();
  const [f, setF] = useState<F>(unread ? 'unread' : 'all');
  const list = items.filter((n) => (f === 'unread' ? !n.read : f === 'overdue' ? n.step === 'overdue' : f === 'today' ? n.step === 'today' : true));
  const open = (n: InboxItem) => {
    dispatch({ t: 'read', keys: [n.key] });
    go({ page: 'project', id: n.projectId, scopeId: n.scopeId });
  };

  const rows = list.length === 0 ? (
    <Empty title={f === 'unread' ? 'You are all caught up' : 'No reminders here'}>Deadline reminders for your projects and scopes appear here.</Empty>
  ) : (
    list.map((n) => {
      const Icon = ICON[n.step];
      const scope = n.scopeId ? n.project.scopes.find((s) => s.id === n.scopeId) : undefined;
      return (
        <button key={n.key} onClick={() => open(n)} className={cx('flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-[#f6f9fc]', !n.read && 'bg-[#f6f9fc]')}>
          <span className={cx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', n.read ? 'border-[1.5px] border-line-2' : 'bg-brand')} aria-label={n.read ? 'Read' : 'Unread'} />
          <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', n.step === 'overdue' ? 'bg-crit text-white' : n.step === 'today' ? 'bg-crit-50 text-crit-700' : 'bg-brand-50 text-brand-700')}><Icon size={17} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 text-[13.5px]">
              <b className={cx('font-semibold', n.step === 'overdue' ? 'text-crit-700' : 'text-ink')}>{STEP_LABEL[n.step]}</b>
              <span className={cx('rounded px-1.5 text-[10.5px] font-semibold uppercase tracking-wide', scope ? 'border border-line-2 text-ink-2' : 'bg-ink text-white')}>{scope ? 'Scope' : 'Project'}</span>
            </span>
            <span className={cx('block text-[13.5px]', n.read ? 'text-ink-2' : 'font-medium text-ink')}>{scope ? `${scope.type} · ${n.project.name}` : n.project.name}</span>
            <span className="block text-[12px] text-ink-3">{n.project.number} · due {fmt(n.due, true)} · sent {fmt(n.trigger)} to you as {roleOn(n, me.id)}</span>
          </span>
          <ChevronRight size={16} className="mt-2 shrink-0 text-ink-3" aria-hidden />
        </button>
      );
    })
  );

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Chip on={f === 'unread'} onClick={() => setF('unread')}>Unread {unread}</Chip>
      <Chip on={f === 'all'} onClick={() => setF('all')}>All</Chip>
      <Chip on={f === 'overdue'} onClick={() => setF('overdue')}>Overdue</Chip>
      <Chip on={f === 'today'} onClick={() => setF('today')}>Due today</Chip>
    </div>
  );
  const markAll = <Button kind="ghost" className="text-brand" disabled={!unread} onClick={() => dispatch({ t: 'read', keys: items.map((i) => i.key) })}>Mark all as read</Button>;

  if (isMobile) {
    return (
      <div className="grid gap-3 p-4">
        <div className="flex items-center justify-between"><h1 className="text-[20px] font-semibold text-ink">Notifications</h1>{markAll}</div>
        <div className="-mx-4 overflow-x-auto px-4">{filters}</div>
        <div className="-mx-4 border-y border-line bg-white">{rows}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      <PageHead title="Notifications" sub="Deadline reminders for the projects and scopes you are responsible for" actions={markAll} />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="grid content-start gap-3">
          {filters}
          <div className="overflow-hidden rounded-lg border border-line bg-white">{rows}</div>
        </div>
        <div className="grid content-start gap-4">
          <Card title="Scheduled for you" aside={<span>next 14 days</span>}>
            {upcoming.length === 0 && <p className="py-2 text-[12.5px] text-ink-3">Nothing scheduled.</p>}
            {upcoming.slice(0, 8).map((n) => (
              <div key={n.key} className="flex gap-2 border-b border-line py-1.5 text-[12.5px] last:border-0">
                <span className="w-[46px] shrink-0 font-mono text-[11.5px] text-ink">{fmt(n.trigger)}</span>
                <span className="min-w-0 text-ink-2">{STEP_LABEL[n.step]} · {n.scopeId ? n.project.scopes.find((s) => s.id === n.scopeId)?.type : 'Project'} <span className="text-ink-3">({n.project.number.slice(-4)})</span></span>
              </div>
            ))}
          </Card>
          <Card title="How reminders work">
            <ul className="grid gap-1.5 text-[12.5px] text-ink-2">
              <li><b className="text-ink">Assigned engineer:</b> {RECIPIENT_RULES.engineer.map((s) => STEP_LABEL[s].toLowerCase()).join(', ')}</li>
              <li><b className="text-ink">Project manager:</b> {RECIPIENT_RULES.pm.map((s) => STEP_LABEL[s].toLowerCase()).join(', ')}</li>
              <li><b className="text-ink">Salesperson:</b> overdue only</li>
              <li>Overdue alerts repeat weekly until the work is completed or cancelled.</li>
              <li>Changing a due date reschedules its reminders. Each reminder is sent once.</li>
            </ul>
            <div className="mt-3 grid gap-1 rounded-md bg-paper p-2.5 text-[12px]">
              <p><b className="text-ink">In-app</b> <span className="text-good">· shown here</span></p>
              <p><b className="text-ink">Browser alerts</b> <span className="text-ink-3">· full build, asks each user for permission</span></p>
              <p><b className="text-ink">Email</b> <span className="text-ink-3">· full build, needs a company mail account</span></p>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Prototype: reminders are worked out from the demo dates. In the full build a server job sends them daily, even when nobody is logged in. {shortName(me.id)} sees only their own.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

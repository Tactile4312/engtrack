import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Card, Chip, cx } from '../components/ui';
import { addDays, addMonths, dayName, fmt, monthLabel, parseISO, startOfMonth, startOfWeek } from '../lib/dates';
import { isClosed, STEP_LABEL } from '../lib/rules';
import { useInbox } from '../lib/hooks';
import type { Project, Scope } from '../types';

type Kind = 'project' | 'scope' | 'milestone' | 'finish';
interface Ev { date: string; kind: Kind; label: string; p: Project; s?: Scope; late: boolean; done: boolean }

function useEvents() {
  const { visible, today } = useApp();
  return useMemo(() => {
    const out: Ev[] = [];
    for (const p of visible) {
      if (p.status === 'Cancelled') continue;
      const pDone = p.status === 'Completed';
      out.push({ date: p.due, kind: 'project', label: p.name, p, late: !pDone && p.due < today, done: pDone });
      if (p.plannedFinish && p.plannedFinish !== p.due && !pDone) out.push({ date: p.plannedFinish, kind: 'finish', label: `Planned finish · ${p.name}`, p, late: false, done: false });
      for (const s of p.scopes) if (s.due && s.status !== 'Cancelled') out.push({ date: s.due, kind: 'scope', label: `${s.type} · ${p.name}`, p, s, late: !isClosed(s.status) && s.due < today, done: s.status === 'Completed' });
      for (const m of p.milestones) if (m.date && !m.done && !pDone) out.push({ date: m.date, kind: 'milestone', label: `${m.name} · ${p.name}`, p, late: false, done: false });
    }
    return out;
  }, [visible, today]);
}

function EvChip({ e, onOpen }: { e: Ev; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      title={`${e.kind === 'project' ? 'Project due' : e.kind === 'scope' ? 'Scope due' : e.kind === 'milestone' ? 'Milestone' : 'Planned finish'}: ${e.label} (${e.p.number})`}
      className={cx(
        'flex w-full items-center gap-1 truncate rounded px-1.5 py-[2px] text-left text-[11px] leading-tight',
        e.done ? 'text-ink-3 line-through' : e.late ? 'bg-crit font-semibold text-white' : e.kind === 'project' ? 'bg-ink text-white' : e.kind === 'milestone' ? 'bg-[#f1effc] text-[#4a3aa7]' : e.kind === 'finish' ? 'border border-dashed border-line-2 text-ink-2' : 'border border-[#86b6ef] bg-brand-50 text-[#184f95]',
      )}
    >
      {e.kind === 'milestone' && <Diamond size={9} fill="currentColor" className="shrink-0" />}
      <span className="truncate">{e.kind === 'scope' ? e.label.split(' · ')[0] + ' · ' + e.p.number.slice(-4) : e.kind === 'project' ? `${e.p.number.slice(-4)} ${e.p.name}` : e.label}</span>
    </button>
  );
}

export function Calendar() {
  const { today, go, isMobile } = useApp();
  const events = useEvents();
  const [view, setView] = useState<'month' | 'week'>(isMobile ? 'week' : 'month');
  const [anchor, setAnchor] = useState(today);
  const [types, setTypes] = useState<Record<Kind, boolean>>({ project: true, scope: true, milestone: true, finish: false });
  const { items, upcoming } = useInbox();
  const shown = events.filter((e) => types[e.kind]);
  const on = (d: string) => shown.filter((e) => e.date === d).sort((a, b) => ['project', 'scope', 'milestone', 'finish'].indexOf(a.kind) - ['project', 'scope', 'milestone', 'finish'].indexOf(b.kind));
  const open = (e: Ev) => go({ page: 'project', id: e.p.id, scopeId: e.s?.id });

  const first = view === 'month' ? startOfWeek(startOfMonth(anchor)) : startOfWeek(anchor);
  const days = view === 'month' ? 42 : 7;
  const cells = Array.from({ length: days }, (_, i) => addDays(first, i));
  const month = anchor.slice(0, 7);
  const move = (n: number) => setAnchor(view === 'month' ? addMonths(anchor, n) : addDays(anchor, 7 * n));
  const title = view === 'month' ? monthLabel(anchor) : `${fmt(first)} – ${fmt(addDays(first, 6), true)}`;

  const legend = (
    <div className="flex flex-wrap gap-2">
      {([['project', 'Project due'], ['scope', 'Scope due'], ['milestone', 'Milestones'], ['finish', 'Planned finish']] as [Kind, string][]).map(([k, l]) => (
        <Chip key={k} on={types[k]} onClick={() => setTypes((t) => ({ ...t, [k]: !t[k] }))}>{l}</Chip>
      ))}
      <span className="flex items-center gap-1.5 text-[12px] text-ink-2"><span className="h-3 w-3 rounded-sm bg-crit" />Overdue</span>
      <span className="flex items-center gap-1.5 text-[12px] text-ink-3 line-through">Completed</span>
    </div>
  );

  const nav = (
    <div className="flex items-center gap-2">
      <Button className="h-9 px-2" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={16} /></Button>
      <Button className="h-9" onClick={() => setAnchor(today)}>Today</Button>
      <Button className="h-9 px-2" onClick={() => move(1)} aria-label="Next"><ChevronRight size={16} /></Button>
      <h2 className="ml-1 text-[17px] font-semibold text-ink">{title}</h2>
    </div>
  );

  if (isMobile) {
    return (
      <div className="grid gap-3 p-4">
        <h1 className="text-[20px] font-semibold text-ink">Calendar</h1>
        {nav}
        <div className="-mx-4 overflow-x-auto px-4">{legend}</div>
        {cells.map((d) => {
          const list = on(d);
          return (
            <section key={d} className={cx('rounded-xl border bg-white p-3', d === today ? 'border-2 border-ink' : 'border-line')}>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">{dayName(d)} {fmt(d)}{d === today && <span className="ml-2 rounded bg-ink px-1.5 text-[11px] text-white">Today</span>}</h3>
              {list.length ? <div className="grid gap-1">{list.map((e, i) => <EvChip key={i} e={e} onOpen={() => open(e)} />)}</div> : <p className="text-[12px] text-ink-3">Nothing due</p>}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      <PageHead title="Calendar" sub="Project deadlines, scope deadlines, milestones and planned finish dates" actions={<><Chip on={view === 'month'} onClick={() => setView('month')}>Month</Chip><Chip on={view === 'week'} onClick={() => setView('week')}>Week</Chip></>} />
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="grid content-start gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">{nav}{legend}</div>
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-line bg-white">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="border-b border-line bg-paper px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2">{d}</div>)}
            {cells.map((d, i) => {
              const list = on(d);
              const max = view === 'month' ? 3 : 12;
              const out = view === 'month' && d.slice(0, 7) !== month;
              return (
                <div key={d} className={cx('flex min-w-0 flex-col gap-1 border-line p-1.5', i % 7 !== 6 && 'border-r', i < days - 7 && 'border-b', view === 'month' ? 'min-h-[112px]' : 'min-h-[380px]', out && 'bg-[#f8fafc]', d === today && 'shadow-[inset_0_0_0_2px_#14202b]')}>
                  <span className={cx('self-start rounded px-1 text-[12px] font-semibold', d === today ? 'bg-ink text-white' : out ? 'text-ink-3' : 'text-ink')}>{parseISO(d).getDate()}</span>
                  {list.slice(0, max).map((e, k) => <EvChip key={k} e={e} onOpen={() => open(e)} />)}
                  {list.length > max && <button className="text-left text-[11px] font-medium text-brand" onClick={() => { setAnchor(d); setView('week'); }}>+{list.length - max} more</button>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid content-start gap-4">
          <Card title="Your latest reminders" aside={<button className="text-brand underline" onClick={() => go({ page: 'notifications' })}>All</button>}>
            {items.slice(0, 5).map((n) => (
              <button key={n.key} onClick={() => go({ page: 'notifications' })} className="flex w-full items-start gap-2 border-b border-line py-2 text-left last:border-0">
                <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'border border-line-2' : 'bg-brand')} aria-label={n.read ? 'Read' : 'Unread'} />
                <span className="min-w-0 text-[12.5px]"><b className={cx('font-semibold', n.step === 'overdue' ? 'text-crit-700' : 'text-ink')}>{STEP_LABEL[n.step]}</b> · <span className="text-ink">{n.scopeId ? n.project.scopes.find((s) => s.id === n.scopeId)?.type : n.project.name}</span><span className="block text-[11.5px] text-ink-3">{n.project.number} · {fmt(n.trigger)}</span></span>
              </button>
            ))}
            {items.length === 0 && <p className="py-3 text-[12.5px] text-ink-3">No reminders for you.</p>}
          </Card>
          <Card title="Scheduled reminders" aside={<span>next 14 days</span>}>
            {upcoming.slice(0, 6).map((n) => (
              <div key={n.key} className="flex gap-2 border-b border-line py-1.5 text-[12.5px] last:border-0">
                <span className="w-[46px] shrink-0 font-mono text-[11.5px] text-ink">{fmt(n.trigger)}</span>
                <span className="min-w-0 text-ink-2">{STEP_LABEL[n.step]} · {n.scopeId ? n.project.scopes.find((s) => s.id === n.scopeId)?.type : 'Project'} <span className="text-ink-3">({n.project.number.slice(-4)})</span></span>
              </div>
            ))}
            {upcoming.length === 0 && <p className="py-3 text-[12.5px] text-ink-3">Nothing scheduled for you.</p>}
            <p className="mt-2 text-[11.5px] text-ink-3">Who gets each reminder depends on your role on the project.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Diamond } from 'lucide-react';
import { shortName, useApp, userName } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Chip, DueFlag, Progress, cx, inputCls } from '../components/ui';
import { addDays, diffDays, fmt, monthShort, parseISO, startOfWeek } from '../lib/dates';
import { isClosed, projectEngineers, projectProgress } from '../lib/rules';
import { SCOPE_TYPES, type Project, type Scope } from '../types';

type Zoom = 'day' | 'week' | 'month';
const ZOOM: Record<Zoom, number> = { day: 34, week: 15, month: 5 };
const ROW = 34;

interface Row { kind: 'project' | 'scope'; p: Project; s?: Scope }

/** Open scopes of one engineer whose dates overlap, where at least one is overdue. */
function clashes(projects: Project[], today: string) {
  const items = projects.flatMap((p) => p.scopes.filter((s) => s.engineerId && s.start && s.due && !isClosed(s.status)).map((s) => ({ p, s })));
  const out: { eng: string; a: (typeof items)[0]; b: (typeof items)[0]; from: string; to: string }[] = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.s.engineerId !== b.s.engineerId) continue;
      const from = a.s.start! > b.s.start! ? a.s.start! : b.s.start!;
      const to = a.s.due! < b.s.due! ? a.s.due! : b.s.due!;
      if (from > to) continue;
      // Only flag overlaps that involve overdue work: that is when one job is likely delaying the other.
      if ([a, b].some((x) => x.s.due! < today)) out.push({ eng: a.s.engineerId!, a, b, from, to });
    }
  return out;
}

function delays(projects: Project[], today: string) {
  const out: { p: Project; s: Scope; pre: Scope }[] = [];
  for (const p of projects)
    for (const s of p.scopes) {
      if (isClosed(s.status)) continue;
      for (const d of s.dependsOn) {
        const pre = p.scopes.find((x) => x.id === d);
        if (pre && !isClosed(pre.status) && pre.due && pre.due < today) out.push({ p, s, pre });
      }
    }
  return out;
}

export function Gantt({ projects, compact }: { projects: Project[]; compact?: boolean }) {
  const { today, go } = useApp();
  const [zoom, setZoom] = useState<Zoom>('week');
  const [from, setFrom] = useState(() => addDays(startOfWeek(today), -21));
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const px = ZOOM[zoom];
  const span = compact ? 56 : zoom === 'day' ? 42 : zoom === 'week' ? 84 : 210;
  const to = addDays(from, span - 1);
  const x = (d: string) => diffDays(from, d) * px;
  const leftW = compact ? 150 : 330;

  const rows: Row[] = projects.flatMap((p) => [{ kind: 'project' as const, p }, ...(closed[p.id] ? [] : p.scopes.map((s) => ({ kind: 'scope' as const, p, s })))]);
  const yOf = (scopeId: string) => rows.findIndex((r) => r.s?.id === scopeId);

  const ticks: { d: string; label: string; major: boolean }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const dt = parseISO(d);
    if (zoom === 'day') ticks.push({ d, label: String(dt.getDate()), major: dt.getDay() === 1 });
    else if (zoom === 'week' && dt.getDay() === 1) ticks.push({ d, label: fmt(d), major: true });
    else if (zoom === 'month' && dt.getDate() === 1) ticks.push({ d, label: `${monthShort(d)} ${dt.getFullYear()}`, major: true });
  }
  const shift = (n: number) => setFrom(addDays(from, n));
  const width = span * px;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button kind="secondary" className="h-8 px-2" onClick={() => shift(-Math.round(span / 3))} aria-label="Earlier"><ChevronLeft size={16} /></Button>
        <Button kind="secondary" className="h-8" onClick={() => setFrom(addDays(startOfWeek(today), zoom === 'day' ? -7 : -21))}>Today</Button>
        <Button kind="secondary" className="h-8 px-2" onClick={() => shift(Math.round(span / 3))} aria-label="Later"><ChevronRight size={16} /></Button>
        <span className="text-[12.5px] text-ink-2">{fmt(from, true)} – {fmt(to, true)}</span>
        <span className="flex-1" />
        {!compact && (['day', 'week', 'month'] as Zoom[]).map((z) => <Chip key={z} on={zoom === z} onClick={() => setZoom(z)}>{z[0].toUpperCase() + z.slice(1)}</Chip>)}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <div className="relative" style={{ width: leftW + width }}>
          {/* header */}
          <div className="sticky top-0 z-20 flex h-10 border-b-2 border-line-2 bg-paper">
            <div className="sticky left-0 z-30 flex shrink-0 items-end gap-2 border-r border-line bg-paper px-3 pb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2" style={{ width: leftW }}>
              <span className="flex-1">Project / scope</span>{!compact && <><span className="w-[84px]">Owner</span><span className="w-[60px] text-right">Progress</span></>}
            </div>
            <div className="relative" style={{ width }}>
              {ticks.map((t) => (
                <span key={t.d} className={cx('absolute bottom-1 whitespace-nowrap pl-1 text-[11px]', t.major ? 'font-semibold text-ink' : 'text-ink-3')} style={{ left: x(t.d) }}>{t.label}</span>
              ))}
            </div>
          </div>
          {/* grid + today */}
          <div className="pointer-events-none absolute bottom-0 top-10" style={{ left: leftW, width }}>
            {zoom === 'day' && Array.from({ length: span }, (_, i) => addDays(from, i)).filter((d) => [0, 6].includes(parseISO(d).getDay())).map((d) => (
              <span key={d} className="absolute inset-y-0 bg-[#f4f6f8]" style={{ left: x(d), width: px }} />
            ))}
            {ticks.map((t) => <span key={t.d} className="absolute inset-y-0 border-l border-[#eef1f4]" style={{ left: x(t.d) }} />)}
            {today >= from && today <= to && (
              <span className="absolute inset-y-0 z-10 border-l-2 border-ink" style={{ left: x(today) + px / 2 }}>
                <span className="absolute -top-0 -translate-x-1/2 whitespace-nowrap rounded-b bg-ink px-1.5 text-[10px] font-medium text-white">Today</span>
              </span>
            )}
          </div>
          {/* rows */}
          {rows.map((r) => {
            const item = r.s ?? r.p;
            const start = (r.s ? r.s.start : r.p.start) ?? r.p.requested;
            const due = item.due;
            const prog = r.s ? r.s.progress : projectProgress(r.p);
            const late = !!due && due < today && !isClosed(item.status);
            const hold = item.status === 'On Hold';
            const done = item.status === 'Completed';
            const owner = r.s ? shortName(r.s.engineerId) : shortName(r.p.pmId);
            return (
              <div key={(r.s?.id ?? r.p.id) + r.kind} className={cx('relative flex border-b border-[#eef1f4]', r.kind === 'project' && 'bg-[#f8fafc]')} style={{ height: ROW }}>
                <div className={cx('sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-line px-3 text-[12.5px]', r.kind === 'project' ? 'bg-[#f8fafc]' : 'bg-white')} style={{ width: leftW }}>
                  {r.kind === 'project' ? (
                    <button className="flex min-w-0 flex-1 items-center gap-1 text-left" onClick={() => setClosed((c) => ({ ...c, [r.p.id]: !c[r.p.id] }))} aria-expanded={!closed[r.p.id]} title={`${r.p.number} · ${r.p.name}`}>
                      <ChevronDown size={14} className={cx('shrink-0 text-ink-3 transition-transform', closed[r.p.id] && '-rotate-90')} />
                      <span className="truncate font-semibold text-ink">{compact ? r.p.name : `${r.p.number.slice(-4)} · ${r.p.name}`}</span>
                    </button>
                  ) : (
                    <button className="min-w-0 flex-1 truncate pl-5 text-left text-ink-2 hover:text-ink" onClick={() => go({ page: 'project', id: r.p.id, scopeId: r.s!.id })}>{r.s!.type}</button>
                  )}
                  {!compact && <><span className="w-[84px] truncate text-ink-3">{owner}</span><span className={cx('w-[60px] text-right tabular-nums', late ? 'font-semibold text-crit-700' : 'text-ink-2')}>{late ? 'Late' : `${prog}%`}</span></>}
                </div>
                <div className="relative" style={{ width }}>
                  {due && start <= to && due >= from && (
                    <button
                      onClick={() => go({ page: 'project', id: r.p.id, scopeId: r.s?.id })}
                      title={`${r.s ? r.s.type + ' · ' : ''}${r.p.name}\n${fmt(start)} – ${fmt(due)} · ${prog}% · ${item.status}${late ? ' · overdue' : ''}`}
                      className={cx('absolute z-[5] overflow-hidden rounded-[4px] border', r.kind === 'project' ? 'top-[8px] h-[18px]' : 'top-[10px] h-[14px]', late ? 'border-crit bg-crit-50' : done ? 'border-[#127a12] bg-good-50' : 'border-[#86b6ef] bg-brand-50', hold && 'border-dashed bg-[repeating-linear-gradient(45deg,#f4f6f8_0_4px,#fff_4px_8px)]')}
                      style={{ left: Math.max(0, x(start)), width: Math.max(px, x(due) + px - Math.max(0, x(start))) }}
                    >
                      <span className={cx('absolute inset-y-0 left-0', done ? 'bg-[#127a12]' : late ? 'bg-crit' : r.kind === 'project' ? 'bg-brand-600' : 'bg-brand')} style={{ width: `${prog}%` }} />
                    </button>
                  )}
                  {late && due && (
                    <span className="absolute top-[15px] z-[4] h-[3px] bg-[repeating-linear-gradient(90deg,#c63434_0_4px,transparent_4px_7px)]" style={{ left: x(due) + px, width: Math.max(0, x(today) - x(due)) }} title="Days past due" />
                  )}
                  {r.kind === 'project' && r.p.milestones.filter((m) => m.date && !m.done && m.date >= today && m.date >= from && m.date <= to).map((m) => (
                    <span key={m.id} className="absolute top-[9px] z-[6] -translate-x-1/2 text-[#4a3aa7]" style={{ left: x(m.date!) + px / 2 }} title={`${m.name} · ${fmt(m.date)}`}><Diamond size={15} fill="currentColor" stroke="#fff" strokeWidth={1.5} /></span>
                  ))}
                </div>
              </div>
            );
          })}
          {/* dependency arrows */}
          <svg className="pointer-events-none absolute left-0 top-10 z-[7] overflow-visible" width={leftW + width} height={rows.length * ROW} aria-hidden>
            {rows.filter((r) => r.s && r.s.dependsOn.length).flatMap((r) => r.s!.dependsOn.map((dep) => {
              const pi = yOf(dep);
              const si = rows.indexOf(r);
              const pre = r.p.scopes.find((z) => z.id === dep);
              if (pi < 0 || !pre?.due || !r.s!.start) return null;
              const x1 = leftW + x(pre.due) + px, y1 = pi * ROW + ROW / 2;
              const x2 = leftW + Math.max(0, x(r.s!.start)), y2 = si * ROW + ROW / 2;
              return <path key={dep + r.s!.id} d={`M${x1} ${y1} H${x1 + 6} V${y2} H${x2 - 2}`} fill="none" stroke="#4a5560" strokeWidth={1.3} markerEnd="url(#arr)" />;
            }))}
            <defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#4a5560" /></marker></defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Timeline() {
  const { visible, today, users, isMobile, go } = useApp();
  const [proj, setProj] = useState('');
  const [eng, setEng] = useState('');
  const [scope, setScope] = useState('');
  const [status, setStatus] = useState<'open' | 'all'>('open');
  const [mode, setMode] = useState<'list' | 'bars'>('list');

  const projects = useMemo(
    () => visible
      .filter((p) => (status === 'open' ? !isClosed(p.status) : p.status !== 'Cancelled'))
      .filter((p) => !proj || p.id === proj)
      .filter((p) => !eng || projectEngineers(p).includes(eng))
      .filter((p) => !scope || p.scopes.some((s) => s.type === scope))
      .sort((a, b) => a.due.localeCompare(b.due)),
    [visible, status, proj, eng, scope],
  );
  const cl = clashes(projects, today);
  const dl = delays(projects, today);

  if (isMobile) {
    type It = { date: string; kind: 'Project' | 'Scope' | 'Milestone'; label: string; p: Project; s?: Scope; prog?: number; status?: Project['status'] };
    const items: It[] = projects.flatMap((p) => [
      { date: p.due, kind: 'Project' as const, label: p.name, p, prog: projectProgress(p), status: p.status },
      ...p.scopes.filter((s) => s.due && !isClosed(s.status)).map((s) => ({ date: s.due!, kind: 'Scope' as const, label: `${s.type} · ${p.name}`, p, s, prog: s.progress, status: s.status })),
      ...p.milestones.filter((m) => m.date && !m.done && m.date >= today).map((m) => ({ date: m.date!, kind: 'Milestone' as const, label: `${m.name} · ${p.name}`, p })),
    ]).sort((a, b) => a.date.localeCompare(b.date));
    const weekEnd = addDays(startOfWeek(today), 6);
    const groups: [string, It[]][] = [
      ['Overdue', items.filter((i) => i.date < today && i.kind !== 'Milestone')],
      [`Today · ${fmt(today)}`, items.filter((i) => i.date === today)],
      ['Rest of this week', items.filter((i) => i.date > today && i.date <= weekEnd)],
      ['Next week', items.filter((i) => i.date > weekEnd && i.date <= addDays(weekEnd, 7))],
      ['Later', items.filter((i) => i.date > addDays(weekEnd, 7)).slice(0, 12)],
    ];
    return (
      <div className="grid gap-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-ink">Timeline</h1>
          <div className="flex overflow-hidden rounded-md border border-line-2" role="group" aria-label="View">
            {(['list', 'bars'] as const).map((m) => <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={cx('h-9 px-3 text-[13px]', mode === m ? 'bg-ink text-white' : 'bg-white text-ink-2')}>{m === 'list' ? 'List' : 'Bars'}</button>)}
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          <select aria-label="Engineer" className={cx(inputCls(), 'h-9 !w-auto')} value={eng} onChange={(e) => setEng(e.target.value)}><option value="">All engineers</option>{users.filter((u) => u.role === 'Engineer').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select aria-label="Scope" className={cx(inputCls(), 'h-9 !w-auto')} value={scope} onChange={(e) => setScope(e.target.value)}><option value="">All scopes</option>{SCOPE_TYPES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        {mode === 'bars' ? <Gantt projects={projects} compact /> : groups.filter(([, l]) => l.length).map(([g, list]) => (
          <section key={g} className="grid gap-2">
            <h2 className={cx('text-[12px] font-semibold uppercase tracking-wider', g === 'Overdue' ? 'text-crit-700' : 'text-ink-3')}>{g}</h2>
            {list.map((i, k) => (
              <button key={k} onClick={() => go({ page: 'project', id: i.p.id, scopeId: i.s?.id })} className={cx('grid gap-1.5 rounded-xl border bg-white p-3 text-left', g === 'Overdue' ? 'border-2 border-crit' : 'border-line')}>
                <span className="flex items-center justify-between gap-2">
                  <span className={cx('rounded px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-wide', i.kind === 'Project' ? 'bg-ink text-white' : i.kind === 'Milestone' ? 'bg-[#f1effc] text-[#4a3aa7]' : 'border border-line-2 text-ink-2')}>{i.kind}</span>
                  {i.status ? <DueFlag due={i.date} status={i.status} today={today} /> : <span className="text-[12px] text-ink-3">{fmt(i.date)}</span>}
                </span>
                <span className="text-[14px] font-medium leading-snug text-ink">{i.label}</span>
                <span className="text-[12px] text-ink-3">{i.p.number} · due {fmt(i.date)}{i.s ? ` · ${shortName(i.s.engineerId)}` : ''}</span>
                {i.prog != null && <Progress value={i.prog} />}
              </button>
            ))}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      <PageHead title="Timeline" sub="Projects with their engineering scopes underneath. Click a bar to open it." />
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Project" className={cx(inputCls(), 'h-9 !w-auto max-w-[260px]')} value={proj} onChange={(e) => setProj(e.target.value)}><option value="">All projects</option>{visible.map((p) => <option key={p.id} value={p.id}>{p.number} · {p.name}</option>)}</select>
        <select aria-label="Engineer" className={cx(inputCls(), 'h-9 !w-auto')} value={eng} onChange={(e) => setEng(e.target.value)}><option value="">All engineers</option>{users.filter((u) => u.role === 'Engineer').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select aria-label="Scope" className={cx(inputCls(), 'h-9 !w-auto')} value={scope} onChange={(e) => setScope(e.target.value)}><option value="">All scopes</option>{SCOPE_TYPES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Status" className={cx(inputCls(), 'h-9 !w-auto')} value={status} onChange={(e) => setStatus(e.target.value as 'open' | 'all')}><option value="open">Open projects</option><option value="all">Include completed</option></select>
        <span className="flex-1" />
        <span className="flex flex-wrap items-center gap-3 text-[12px] text-ink-2">
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded-[3px] border border-[#86b6ef] bg-[linear-gradient(90deg,#2a78d6_55%,#ecf3fc_55%)]" />Progress</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded-[3px] border border-crit bg-[linear-gradient(90deg,#c63434_55%,#fcecec_55%)]" />Overdue</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded-[3px] border border-dashed border-[#86b6ef]" />On hold</span>
          <span className="flex items-center gap-1.5 text-[#4a3aa7]"><Diamond size={12} fill="currentColor" /><span className="text-ink-2">Milestone</span></span>
          <span className="flex items-center gap-1.5"><svg width="20" height="8"><path d="M0 4 H16" stroke="#4a5560" strokeWidth="1.3" /><path d="M14 1 L19 4 L14 7z" fill="#4a5560" /></svg>Depends on</span>
        </span>
      </div>
      {(cl.length > 0 || dl.length > 0) && (
        <div className="grid gap-1.5 rounded-lg border border-[#f1d58f] bg-[#fdf4dd] px-4 py-3 text-[12.5px] text-[#5c3d00]">
          <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle size={15} />Schedule risks</p>
          {[...new Set(cl.map((c) => c.eng))].map((eng) => {
            const mine = cl.filter((c) => c.eng === eng);
            const scopes = [...new Map(mine.flatMap((c) => [c.a, c.b]).map((x) => [x.s.id, `${x.s.type} (${x.p.number.slice(-4)})`])).values()];
            const a = mine.map((c) => c.from).sort()[0];
            const b = mine.map((c) => c.to).sort().reverse()[0];
            return <p key={eng}><b>{userName(eng)}</b> has {scopes.length} overlapping scopes between {fmt(a)} and {fmt(b)}: {scopes.join(', ')}.</p>;
          })}
          {dl.slice(0, 3).map((d, i) => (
            <p key={'d' + i}><b>{d.s.type}</b> on {d.p.number} waits for <b>{d.pre.type}</b>, which is overdue. Its start may slip.</p>
          ))}
        </div>
      )}
      {projects.length ? <Gantt projects={projects} /> : <p className="py-10 text-center text-[13px] text-ink-3">No projects match these filters.</p>}
    </div>
  );
}

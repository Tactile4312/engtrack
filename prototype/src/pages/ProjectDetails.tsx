import { useState } from 'react';
import { Archive, ArchiveRestore, CheckCircle2, ChevronDown, Copy, Diamond, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { shortName, useApp, userName } from '../store/AppStore';
import { Avatar, Button, Card, DueFlag, Empty, Field, Modal, PriorityTag, Progress, StatusBadge, Tabs, cx, inputCls } from '../components/ui';
import { can, isClosed, projectEngineers, projectProgress } from '../lib/rules';
import { diffDays, fmt, relTime, showVal } from '../lib/dates';
import { STATUSES, type Project, type Scope, type Status } from '../types';

type Tab = 'tasks' | 'notes' | 'files' | 'activity';

export function ProjectDetails({ id, scopeId, tab: initialTab }: { id: string; scopeId?: string; tab?: string }) {
  const { visibleAll, s, me, go, dispatch, isMobile, today } = useApp();
  const p = visibleAll.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? 'tasks');
  const [editing, setEditing] = useState<Scope | null>(scopeId ? p?.scopes.find((x) => x.id === scopeId) ?? null : null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openScope, setOpenScope] = useState<string | null>(scopeId ?? null);

  if (!p) {
    return (
      <div className="p-6">
        <Empty title="This project is not available">It may have been deleted, or your role does not include it. <button className="text-brand underline" onClick={() => go({ page: 'projects' })}>Back to projects</button></Empty>
      </div>
    );
  }
  const client = s.clients.find((c) => c.id === p.clientId)!;
  const progress = projectProgress(p);
  const engineers = projectEngineers(p);

  const actions = (
    <>
      {can(me, 'status', p) && <Button onClick={() => setStatusOpen(true)}>Change status</Button>}
      {can(me, 'create') && <Button kind="ghost" onClick={() => go({ page: 'new', copyFrom: p.id })}><Copy size={15} />Duplicate</Button>}
      {can(me, 'archive', p) && (
        <Button kind="ghost" onClick={() => dispatch({ t: 'archive', projectId: p.id, archived: !p.archived })}>
          {p.archived ? <><ArchiveRestore size={15} />Restore</> : <><Archive size={15} />Archive</>}
        </Button>
      )}
      {can(me, 'delete', p) && <Button kind="ghost" className="text-crit-700" onClick={() => setConfirmDelete(true)}><Trash2 size={15} />Delete</Button>}
      {can(me, 'edit', p) && <Button kind="primary" onClick={() => go({ page: 'edit', id: p.id })}><Pencil size={15} />Edit project</Button>}
    </>
  );

  const info: [string, React.ReactNode][] = [
    ['Client', <span key="c"><b className="font-medium text-ink">{client.name}</b><br /><span className="text-ink-3">{client.contact} · {client.phone}</span></span>],
    ['Salesperson', userName(p.salesId)],
    ['Project manager', userName(p.pmId)],
    ['Engineers', engineers.length ? engineers.map(userName).join(', ') : 'Not assigned yet'],
    ['Requested', fmt(p.requested, true)],
    ['Start', fmt(p.start, true)],
    ['Due', <span key="d" className="inline-flex flex-wrap items-center gap-1.5"><b className="font-semibold text-ink">{fmt(p.due, true)}</b><DueFlag due={p.due} status={p.status} today={today} /></span>],
    ['Planned finish', fmt(p.plannedFinish, true)],
    ['Actual finish', fmt(p.actualFinish, true)],
    ['Created', `${shortName(p.createdBy)} · ${fmt(p.createdAt.slice(0, 10), true)}`],
    ['Last updated', `${shortName(p.updatedBy)} · ${relTime(p.updatedAt)}`],
  ];

  const tabs = (
    <div>
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'tasks', label: 'Tasks & milestones' },
          { id: 'notes', label: `Notes (${p.notes.length})` },
          { id: 'files', label: 'Attachments' },
          { id: 'activity', label: 'Activity history' },
        ]}
      />
      <div className="pt-3">
        {tab === 'tasks' && <TasksMilestones p={p} />}
        {tab === 'notes' && <Notes p={p} />}
        {tab === 'files' && <Files />}
        {tab === 'activity' && <ActivityList p={p} />}
      </div>
    </div>
  );

  const modals = (
    <>
      {editing && <ScopeUpdate p={p} scope={editing} onClose={() => setEditing(null)} />}
      {statusOpen && <StatusChange p={p} onClose={() => setStatusOpen(false)} />}
      {confirmDelete && (
        <Modal title="Delete this project?" onClose={() => setConfirmDelete(false)} footer={<><Button onClick={() => setConfirmDelete(false)}>Keep it</Button><Button kind="danger" onClick={() => dispatch({ t: 'delete', projectId: p.id })}>Delete permanently</Button></>}>
          <p className="text-[13.5px] text-ink-2"><b className="text-ink">{p.number} · {p.name}</b> and its scopes, tasks and history will be removed. Archiving keeps the record for reports and is usually the better choice.</p>
        </Modal>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="grid gap-3 p-4">
        <div>
          <p className="font-mono text-[12px] text-ink-2">{p.number}</p>
          <h1 className="text-[19px] font-semibold leading-snug text-ink">{p.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2"><StatusBadge status={p.status} /><PriorityTag p={p.priority} /><DueFlag due={p.due} status={p.status} today={today} /></div>
          {p.archived && <p className="mt-1 text-[12px] font-medium text-ink-3">Archived</p>}
        </div>
        <Card>
          <Progress value={progress} size="lg" />
          <p className="mt-1 text-[11.5px] text-ink-3">Average of {p.scopes.filter((x) => x.status !== 'Cancelled').length} scopes</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
            <div><dt className="text-ink-3">Client</dt><dd className="font-medium text-ink">{client.name}</dd></div>
            <div><dt className="text-ink-3">Due</dt><dd className="font-medium text-ink">{fmt(p.due, true)}</dd></div>
            <div><dt className="text-ink-3">Requested</dt><dd className="text-ink">{fmt(p.requested, true)}</dd></div>
            <div><dt className="text-ink-3">Project manager</dt><dd className="text-ink">{userName(p.pmId)}</dd></div>
            <div><dt className="text-ink-3">Engineers</dt><dd className="text-ink">{engineers.map(shortName).join(', ') || '—'}</dd></div>
            <div><dt className="text-ink-3">Salesperson</dt><dd className="text-ink">{userName(p.salesId)}</dd></div>
          </dl>
        </Card>
        <h2 className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-ink-3">Engineering scopes ({p.scopes.length})</h2>
        {p.scopes.map((sc) => {
          const open = openScope === sc.id;
          return (
            <div key={sc.id} className={cx('rounded-xl border bg-white', sc.due && sc.due < today && !isClosed(sc.status) ? 'border-2 border-crit' : 'border-line')}>
              <button className="flex w-full items-center gap-2 px-3.5 py-3 text-left" onClick={() => setOpenScope(open ? null : sc.id)} aria-expanded={open}>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><b className="text-[14px] font-semibold text-ink">{sc.type}</b><StatusBadge status={sc.status} short /></span>
                  <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-2">{shortName(sc.engineerId)} · due {fmt(sc.due)} <DueFlag due={sc.due} status={sc.status} today={today} compact /></span>
                </span>
                <ChevronDown size={18} className={cx('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} aria-hidden />
              </button>
              {open && (
                <div className="grid gap-2.5 border-t border-line px-3.5 py-3">
                  <Progress value={sc.progress} size="md" />
                  <p className="text-[12.5px] text-ink-2">{fmt(sc.start)} – {fmt(sc.due)}{sc.dependsOn.length > 0 && <> · after {p.scopes.find((x) => x.id === sc.dependsOn[0])?.type}</>}</p>
                  {p.tasks.filter((t) => t.scopeId === sc.id).map((t) => (
                    <p key={t.id} className={cx('text-[12.5px]', t.done ? 'text-ink-3 line-through' : 'text-ink')}>• {t.name}</p>
                  ))}
                  {can(me, 'updateScope', p, sc) ? (
                    <Button kind="primary" className="h-11" onClick={() => setEditing(sc)}>Update progress</Button>
                  ) : (
                    <p className="text-[11.5px] text-ink-3">Only the assigned engineer or a project manager can update this scope.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <Card>{tabs}</Card>
        <div className="grid gap-2">
          {can(me, 'status', p) && <Button className="h-11" onClick={() => setStatusOpen(true)}>Change status</Button>}
          {can(me, 'edit', p) && <Button className="h-11" onClick={() => go({ page: 'edit', id: p.id })}><Pencil size={15} />Edit project</Button>}
        </div>
        {modals}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      <div>
        <button className="text-[12.5px] text-ink-3 hover:text-ink" onClick={() => go({ page: 'projects' })}>Projects</button>
        <span className="text-[12.5px] text-ink-3"> / {p.number}</span>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-ink"><span className="font-mono text-[18px] text-ink-2">{p.number}</span> · {p.name}</h1>
            <StatusBadge status={p.status} />
            <PriorityTag p={p.priority} />
            {p.archived && <span className="rounded bg-[#e3e8ed] px-2 py-0.5 text-[11.5px] font-medium text-ink-2">Archived</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      </div>
      <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-4">
        <div className="grid content-start gap-4">
          <Card title="Overall progress">
            <Progress value={progress} size="lg" />
            <p className="mt-1.5 text-[12px] text-ink-3">Calculated: average of the {p.scopes.filter((x) => x.status !== 'Cancelled').length} scopes. Update a scope to change it.</p>
          </Card>
          <Card title="Project information">
            <dl className="grid grid-cols-[108px_1fr] gap-x-3 gap-y-2 text-[12.5px]">
              {info.map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-ink-3">{k}</dt><dd className="min-w-0 text-ink-2">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Description"><p className="text-[13px] leading-relaxed text-ink-2">{p.description || '—'}</p></Card>
        </div>
        <div className="grid min-w-0 content-start gap-4">
          <Card title="Engineering scopes" aside={<span>Each scope has its own engineer, dates and progress</span>} pad={false}>
            <div className="overflow-x-auto px-2 pb-2">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11.5px] uppercase tracking-wide text-ink-3">
                    <th className="px-2 py-2 font-semibold">Scope</th><th className="px-2 py-2 font-semibold">Engineer</th><th className="px-2 py-2 font-semibold">Start</th><th className="px-2 py-2 font-semibold">Due</th>
                    <th className="px-2 py-2 font-semibold">Status</th><th className="w-[150px] px-2 py-2 font-semibold">Progress</th><th className="px-2 py-2 font-semibold">Depends on</th><th />
                  </tr>
                </thead>
                <tbody>
                  {p.scopes.map((sc) => (
                    <tr key={sc.id} className={cx('border-t border-line', scopeId === sc.id && 'bg-brand-50')}>
                      <td className="px-2 py-2.5 font-semibold text-ink">{sc.type}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-ink-2">{sc.engineerId ? userName(sc.engineerId) : <span className="text-ink-3">Unassigned</span>}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-ink-2">{fmt(sc.start)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5"><span className="mr-1.5 text-ink">{fmt(sc.due)}</span><DueFlag due={sc.due} status={sc.status} today={today} compact /></td>
                      <td className="px-2 py-2.5"><StatusBadge status={sc.status} short /></td>
                      <td className="px-2 py-2.5"><Progress value={sc.progress} /></td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-ink-3">{sc.dependsOn.map((d) => p.scopes.find((x) => x.id === d)?.type).join(', ') || '—'}</td>
                      <td className="px-2 py-2.5 text-right">
                        {can(me, 'updateScope', p, sc) ? <Button kind="secondary" className="h-8" onClick={() => setEditing(sc)}>Update</Button> : <span className="text-[11.5px] text-ink-3">View only</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Schedule" aside={<span>{fmt(p.start ?? p.requested)} – {fmt(p.due)}</span>}><MiniTimeline p={p} /></Card>
          <Card>{tabs}</Card>
        </div>
      </div>
      {modals}
    </div>
  );
}

function MiniTimeline({ p }: { p: Project }) {
  const { today } = useApp();
  const starts = [p.start ?? p.requested, ...p.scopes.map((x) => x.start ?? p.requested)];
  const ends = [p.due, ...p.scopes.map((x) => x.due ?? p.due), today];
  const a = starts.sort()[0];
  const b = ends.sort()[ends.length - 1];
  const span = Math.max(1, diffDays(a, b) + 1);
  const x = (d: string) => `${(diffDays(a, d) / span) * 100}%`;
  const w = (s: string, e: string) => `${Math.max(1, ((diffDays(s, e) + 1) / span) * 100)}%`;
  return (
    <div className="relative">
      <div className="grid gap-2">
        {p.scopes.map((sc) => {
          const late = sc.due && sc.due < today && !isClosed(sc.status);
          return (
            <div key={sc.id} className="grid grid-cols-[120px_1fr] items-center gap-3 text-[12px]">
              <span className="truncate text-ink-2">{sc.type}</span>
              <div className="relative h-4">
                {sc.start && sc.due && (
                  <div className={cx('absolute top-0 h-4 overflow-hidden rounded-[4px] border', late ? 'border-crit bg-crit-50' : 'border-[#9ec5f4] bg-brand-50')} style={{ left: x(sc.start), width: w(sc.start, sc.due) }}>
                    <div className={cx('h-full', sc.progress >= 100 ? 'bg-[#127a12]' : late ? 'bg-crit' : 'bg-brand')} style={{ width: `${sc.progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-[132px] right-0">
        <div className="absolute -top-1 bottom-0 border-l-2 border-ink" style={{ left: x(today) }}>
          <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1 text-[10px] text-white">Today</span>
        </div>
        {p.milestones.filter((m) => m.date && m.date >= a && m.date <= b && !m.done).slice(0, 3).map((m) => (
          <span key={m.id} className="absolute -bottom-5 -translate-x-1/2 text-[#4a3aa7]" style={{ left: x(m.date!) }} title={`${m.name} · ${fmt(m.date)}`}><Diamond size={12} fill="currentColor" /></span>
        ))}
      </div>
      <div className="mt-6 flex justify-between pl-[132px] text-[11px] text-ink-3"><span>{fmt(a)}</span><span>{fmt(b)}</span></div>
    </div>
  );
}

function TasksMilestones({ p }: { p: Project }) {
  const { dispatch, me } = useApp();
  const canTick = me.role !== 'Salesperson';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-ink-3">Tasks</h4>
        {p.tasks.length === 0 && <p className="py-3 text-[13px] text-ink-3">No tasks yet.</p>}
        {p.tasks.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-start gap-2.5 border-b border-line py-2 last:border-0">
            <input type="checkbox" id={`task-${t.id}`} checked={t.done} disabled={!canTick} onChange={() => dispatch({ t: 'task', projectId: p.id, taskId: t.id })} className="mt-0.5 h-4 w-4 accent-[#2a78d6]" />
            <span className="min-w-0 flex-1 text-[13px]">
              <span className={cx('block', t.done ? 'text-ink-3 line-through' : 'text-ink')}>{t.name}</span>
              <span className="block text-[11.5px] text-ink-3">{t.scopeId ? p.scopes.find((s) => s.id === t.scopeId)?.type : 'Project'} · {shortName(t.assigneeId)} · due {fmt(t.due)}</span>
            </span>
          </label>
        ))}
      </div>
      <div>
        <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-ink-3">Milestones</h4>
        {p.milestones.map((m) => (
          <button key={m.id} disabled={!canTick} onClick={() => dispatch({ t: 'milestone', projectId: p.id, milestoneId: m.id })} className="flex w-full items-center gap-2.5 border-b border-line py-2 text-left last:border-0 enabled:hover:bg-paper">
            {m.done ? <CheckCircle2 size={16} className="shrink-0 text-good" aria-label="Reached" /> : <Diamond size={14} className="shrink-0 text-[#4a3aa7]" aria-label="Planned" />}
            <span className={cx('flex-1 text-[13px]', m.done ? 'text-ink-2' : 'font-medium text-ink')}>{m.name}</span>
            <span className="text-[12px] text-ink-3">{fmt(m.date)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Notes({ p }: { p: Project }) {
  const { dispatch, me } = useApp();
  const [text, setText] = useState('');
  return (
    <div className="grid gap-3">
      {can(me, 'note', p) && (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { dispatch({ t: 'note', projectId: p.id, text: text.trim() }); setText(''); } }}>
          <textarea id="new-note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note for the team" className={cx(inputCls(), 'h-20 py-2')} />
          <Button kind="primary" type="submit" className="justify-self-end" disabled={!text.trim()}>Add note</Button>
        </form>
      )}
      {p.notes.length === 0 && <p className="text-[13px] text-ink-3">No notes yet.</p>}
      {p.notes.map((n) => (
        <div key={n.id} className="flex gap-2.5 border-b border-line pb-2.5 last:border-0">
          <Avatar name={userName(n.userId)} size={26} />
          <div className="text-[13px]"><b className="font-semibold text-ink">{userName(n.userId)}</b> <span className="text-[11.5px] text-ink-3">{relTime(n.at)}</span><p className="text-ink-2">{n.text}</p></div>
        </div>
      ))}
    </div>
  );
}

function Files() {
  const files = [['Client lift request.pdf', '1.2 MB'], ['Site layout plan.dwg', '3.8 MB'], ['Crane load chart 750t.pdf', '640 KB']];
  return (
    <div className="grid gap-2">
      {files.map(([n, sz]) => (
        <div key={n} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2 text-[13px]"><Paperclip size={15} className="text-ink-3" aria-hidden /><span className="flex-1 text-ink">{n}</span><span className="text-ink-3">{sz}</span></div>
      ))}
      <p className="text-[12px] text-ink-3">Prototype: sample file names only. Uploading and downloading documents comes with the full build.</p>
    </div>
  );
}

function ActivityList({ p }: { p: Project }) {
  return (
    <ol className="grid gap-0">
      {p.activity.map((a) => (
        <li key={a.id} className="flex gap-2.5 border-b border-line py-2 text-[13px] last:border-0">
          <Avatar name={userName(a.userId)} size={26} />
          <div className="min-w-0 flex-1">
            <span className="text-ink"><b className="font-semibold">{userName(a.userId)}</b> · {a.action}</span>
            {(a.from || a.to) && <span className="block text-[12px] text-ink-2">{showVal(a.from)} → <b className="font-medium text-ink">{showVal(a.to)}</b></span>}
          </div>
          <span className="shrink-0 text-[11.5px] text-ink-3" title={new Date(a.at).toLocaleString()}>{relTime(a.at)}</span>
        </li>
      ))}
    </ol>
  );
}

function ScopeUpdate({ p, scope, onClose }: { p: Project; scope: Scope; onClose: () => void }) {
  const { dispatch, me, users } = useApp();
  const pm = me.role === 'Administrator' || me.role === 'Project Manager';
  const allowed = can(me, 'updateScope', p, scope);
  const [status, setStatus] = useState<Status>(scope.status);
  const [progress, setProgress] = useState(scope.progress);
  const [due, setDue] = useState(scope.due ?? '');
  const [eng, setEng] = useState(scope.engineerId ?? '');
  const [note, setNote] = useState('');
  const dueErr = scope.start && due && due < scope.start ? 'The due date is before this scope’s start date.' : undefined;
  return (
    <Modal
      title={`${scope.type} · ${p.number}`}
      onClose={onClose}
      footer={allowed ? (
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" disabled={!!dueErr} onClick={() => {
            dispatch({ t: 'scope', projectId: p.id, scopeId: scope.id, patch: { status, progress: status === 'Completed' ? 100 : progress, due: due || null, engineerId: eng || null }, note: note.trim() || undefined });
            onClose();
          }}>Save update</Button>
        </>
      ) : <Button onClick={onClose}>Close</Button>}
    >
      <div className="grid gap-4">
        <dl className="grid grid-cols-2 gap-2 rounded-md bg-paper p-3 text-[12.5px]">
          <div><dt className="text-ink-3">Engineer</dt><dd className="font-medium text-ink">{userName(scope.engineerId)}</dd></div>
          <div><dt className="text-ink-3">Dates</dt><dd className="font-medium text-ink">{fmt(scope.start)} – {fmt(scope.due)}</dd></div>
        </dl>
        {!allowed && <p className="text-[12.5px] text-ink-2">You can view this scope. Only {userName(scope.engineerId)} or a project manager can update it.</p>}
        {allowed && (
          <>
            <Field label="Status" htmlFor="scope-status">
              <select id="scope-status" className={inputCls()} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUSES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label={`Progress: ${status === 'Completed' ? 100 : progress}%`} htmlFor="scope-progress" hint="Project progress is recalculated from all scopes when you save.">
              <input id="scope-progress" type="range" min={0} max={100} step={5} value={status === 'Completed' ? 100 : progress} disabled={status === 'Completed'} onChange={(e) => setProgress(Number(e.target.value))} className="h-8 w-full accent-[#2a78d6]" />
            </Field>
            {pm && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Due date" htmlFor="scope-due" error={dueErr} hint="Changing it reschedules this scope’s reminders.">
                  <input id="scope-due" type="date" className={inputCls(dueErr)} value={due} onChange={(e) => setDue(e.target.value)} />
                </Field>
                <Field label="Engineer" htmlFor="scope-eng">
                  <select id="scope-eng" className={inputCls()} value={eng} onChange={(e) => setEng(e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.filter((u) => u.role === 'Engineer').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <Field label="Note (optional)" htmlFor="scope-note">
              <textarea id="scope-note" className={cx(inputCls(), 'h-16 py-2')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed, any blockers" />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

function StatusChange({ p, onClose }: { p: Project; onClose: () => void }) {
  const { dispatch } = useApp();
  const [status, setStatus] = useState<Status>(p.status);
  const openScopes = p.scopes.filter((x) => !isClosed(x.status)).length;
  return (
    <Modal title="Change project status" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" disabled={status === p.status} onClick={() => { dispatch({ t: 'status', projectId: p.id, status }); onClose(); }}>Save status</Button></>}>
      <div className="grid gap-3">
        <Field label="Status" htmlFor="proj-status">
          <select id="proj-status" className={inputCls()} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        {status === 'Completed' && openScopes > 0 && (
          <p className="rounded-md bg-[#fdf4dd] px-3 py-2 text-[12.5px] text-[#5c3d00]">{openScopes} scope{openScopes > 1 ? 's are' : ' is'} still open. You can still complete the project; its reminders will stop.</p>
        )}
        {isClosed(status) && <p className="text-[12.5px] text-ink-3">Completed and cancelled projects stop receiving deadline reminders and stay in the reports.</p>}
      </div>
    </Modal>
  );
}


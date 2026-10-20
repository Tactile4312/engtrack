import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Download, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { EMPTY_FILTERS, shortName, useApp, type ProjectFilters } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Chip, DueFlag, Empty, Modal, PriorityTag, Progress, ScopeTags, StatusBadge, cx, inputCls } from '../components/ui';
import { ExportModal } from '../components/ExportModal';
import { filterProjects, type SortKey } from '../lib/metrics';
import { can, projectEngineers, projectProgress } from '../lib/rules';
import { fmt } from '../lib/dates';
import { PRIORITIES, SCOPE_TYPES, STATUSES, type Project } from '../types';

const PAGE = 10;

export function Projects({ initial }: { initial?: Partial<ProjectFilters> }) {
  const { visibleAll, today, go, me, users, s, isMobile } = useApp();
  const [f, setF] = useState<ProjectFilters>({ ...EMPTY_FILTERS, ...initial });
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'due', dir: 1 });
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState(false);
  const clientNames = useMemo(() => Object.fromEntries(s.clients.map((c) => [c.id, c.name])), [s.clients]);
  const rows = useMemo(() => filterProjects(visibleAll, f, today, sort, clientNames), [visibleAll, f, today, sort, clientNames]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const set = (patch: Partial<ProjectFilters>) => { setF((x) => ({ ...x, ...patch })); setPage(0); };
  const engineers = users.filter((u) => u.role === 'Engineer');
  const sales = users.filter((u) => u.role === 'Salesperson');
  const active = (Object.keys(f) as (keyof ProjectFilters)[]).filter((k) => f[k] !== EMPTY_FILTERS[k]);

  const exportRows = rows.map((p) => [
    p.number, p.name, clientNames[p.clientId], p.scopes.map((x) => x.type).join('; '), shortName(p.salesId), shortName(p.pmId),
    projectEngineers(p).map(shortName).join('; '), p.requested, p.start ?? '', p.due, p.priority, p.status, `${projectProgress(p)}%`,
  ]);
  const exportHeader = ['CRM No.', 'Project', 'Client', 'Engineering scopes', 'Salesperson', 'Project manager', 'Engineers', 'Requested', 'Start', 'Due', 'Priority', 'Status', 'Progress'];

  const selects = (
    <>
      <Sel id="f-status" label="Status" value={f.status} onChange={(v) => set({ status: v as ProjectFilters['status'] })} opts={STATUSES.map((x) => [x, x])} />
      <Sel id="f-scope" label="Scope" value={f.scope} onChange={(v) => set({ scope: v })} opts={SCOPE_TYPES.map((x) => [x, x])} />
      <Sel id="f-client" label="Client" value={f.clientId} onChange={(v) => set({ clientId: v })} opts={s.clients.map((c) => [c.id, c.name])} />
      <Sel id="f-sales" label="Salesperson" value={f.salesId} onChange={(v) => set({ salesId: v })} opts={sales.map((u) => [u.id, u.name])} />
      <Sel id="f-eng" label="Engineer" value={f.engineerId} onChange={(v) => set({ engineerId: v })} opts={engineers.map((u) => [u.id, u.name])} />
      <Sel id="f-pri" label="Priority" value={f.priority} onChange={(v) => set({ priority: v })} opts={PRIORITIES.map((x) => [x, x])} />
      <Sel id="f-due" label="Due date" value={f.due} onChange={(v) => set({ due: v as ProjectFilters['due'] })} opts={[['overdue', 'Overdue'], ['today', 'Due today'], ['week', 'Due this week'], ['30d', 'Due within 30 days']]} />
    </>
  );

  const searchBox = (
    <label className={cx('flex items-center gap-2 rounded-md border border-line-2 bg-white px-3', isMobile ? 'h-11' : 'h-9 w-[300px]')}>
      <Search size={16} className="text-ink-3" aria-hidden />
      <input id="projects-search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search CRM no., project or client" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-3" />
      {f.q && <button onClick={() => set({ q: '' })} aria-label="Clear search"><X size={14} className="text-ink-3" /></button>}
    </label>
  );

  if (isMobile) {
    return (
      <div className="grid gap-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-ink">Projects</h1>
          {can(me, 'create') && <Button kind="primary" onClick={() => go({ page: 'new' })}><Plus size={16} />New</Button>}
        </div>
        {searchBox}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip on={!f.due && !f.showCompleted && !f.status} onClick={() => set({ due: '', showCompleted: false, status: '' })}>Open</Chip>
          <Chip on={f.due === 'overdue'} onClick={() => set({ due: f.due === 'overdue' ? '' : 'overdue' })}>Overdue</Chip>
          <Chip on={f.due === 'week'} onClick={() => set({ due: f.due === 'week' ? '' : 'week' })}>This week</Chip>
          <Chip on={f.status === 'Completed'} onClick={() => set({ status: f.status === 'Completed' ? '' : 'Completed' })}>Completed</Chip>
          <Chip on={sheet} onClick={() => setSheet(true)}><SlidersHorizontal size={14} />Filters{active.length ? ` (${active.length})` : ''}</Chip>
        </div>
        <p className="text-[12px] text-ink-3">{rows.length} project{rows.length === 1 ? '' : 's'}</p>
        {rows.length === 0 && <Empty title="No projects match">Try clearing a filter or searching for a different name.</Empty>}
        <div className="grid gap-2.5">
          {rows.map((p) => <ProjectCard key={p.id} p={p} client={clientNames[p.clientId]} />)}
        </div>
        {sheet && (
          <Modal title="Filters" onClose={() => setSheet(false)} footer={<><Button onClick={() => { setF({ ...EMPTY_FILTERS }); setSheet(false); }}>Clear all</Button><Button kind="primary" onClick={() => setSheet(false)}>Show {rows.length}</Button></>}>
            <div className="grid gap-3">{selects}</div>
          </Modal>
        )}
      </div>
    );
  }

  const Th = ({ k, children, className }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cx('whitespace-nowrap border-b-2 border-line-2 px-2.5 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-2', className)} aria-sort={k && sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
      {k ? (
        <button className="inline-flex items-center gap-1 uppercase hover:text-ink" onClick={() => setSort((x) => ({ key: k, dir: x.key === k ? (x.dir === 1 ? -1 : 1) : 1 }))}>
          {children}
          {sort.key === k ? (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <span className="w-3" />}
        </button>
      ) : children}
    </th>
  );

  return (
    <div className="grid gap-4 p-6">
      <PageHead
        title="Projects"
        sub={`${rows.length} of ${visibleAll.length} projects`}
        actions={
          <>
            <Button onClick={() => setExporting(true)}><Download size={16} />Export</Button>
            {can(me, 'create') && <Button kind="primary" onClick={() => go({ page: 'new' })}><Plus size={16} />Add project</Button>}
          </>
        }
      />
      <div className="grid gap-3 rounded-lg border border-line bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          {searchBox}
          {selects}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip on={f.due === 'overdue'} onClick={() => set({ due: f.due === 'overdue' ? '' : 'overdue' })}>Overdue only</Chip>
          <Chip on={f.showCompleted} onClick={() => set({ showCompleted: !f.showCompleted })}>Show completed &amp; cancelled</Chip>
          <Chip on={f.showArchived} onClick={() => set({ showArchived: !f.showArchived })}>Show archived</Chip>
          {active.length > 0 && <button className="ml-1 text-[12.5px] text-brand underline" onClick={() => { setF({ ...EMPTY_FILTERS }); setPage(0); }}>Clear all filters</button>}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <Th k="number">CRM No.</Th><Th k="name">Project / client</Th><Th>Scope</Th><Th>Engineer / sales</Th>
              <Th>Requested / start</Th><Th k="due">Due</Th><Th k="priority">Priority</Th><Th k="status" className="w-[150px]">Status / progress</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const engs = projectEngineers(p);
              const late = p.due < today && p.status !== 'Completed' && p.status !== 'Cancelled';
              return (
                <tr key={p.id} onClick={() => go({ page: 'project', id: p.id })} className={cx('cursor-pointer border-b border-line hover:bg-[#f6f9fc]', p.archived && 'opacity-60')}>
                  <td className={cx('whitespace-nowrap px-2.5 py-2.5 font-mono text-[12px] text-ink', late && 'shadow-[inset_3px_0_0_#c63434]')}>{p.number}</td>
                  <td className="max-w-[250px] px-2.5 py-2 leading-tight"><span className="block truncate font-medium text-ink">{p.name}</span><span className="block truncate text-[12px] text-ink-3">{clientNames[p.clientId]}{p.archived && ' · Archived'}</span></td>
                  <td className="whitespace-nowrap px-2.5 py-2.5"><ScopeTags types={p.scopes.map((x) => x.type)} /></td>
                  <td className="whitespace-nowrap px-2.5 py-2 leading-tight text-ink-2">{engs.length ? shortName(engs[0]) + (engs.length > 1 ? ` +${engs.length - 1}` : '') : <span className="text-ink-3">Unassigned</span>}<br /><span className="text-[12px] text-ink-3">{shortName(p.salesId)}</span></td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-[12.5px] leading-tight text-ink-2">{fmt(p.requested)}<br /><span className="text-ink-3">{fmt(p.start)}</span></td>
                  <td className="whitespace-nowrap px-2.5 py-2.5"><span className="mr-1.5 text-ink">{fmt(p.due)}</span><DueFlag due={p.due} status={p.status} today={today} compact /></td>
                  <td className="px-2.5 py-2.5"><PriorityTag p={p.priority} /></td>
                  <td className="px-2.5 py-2"><div className="grid w-[140px] gap-1"><span><StatusBadge status={p.status} short /></span><Progress value={projectProgress(p)} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <Empty title="No projects match these filters">Clear a filter or search for a different CRM number, project or client.</Empty>}
      </div>
      <div className="flex items-center justify-between text-[12.5px] text-ink-2">
        <span>{rows.length ? `Showing ${page * PAGE + 1}–${Math.min(rows.length, (page + 1) * PAGE)} of ${rows.length}` : ''}</span>
        <div className="flex items-center gap-1">
          <Button kind="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} aria-current={i === page ? 'page' : undefined} className={cx('h-8 w-8 rounded-md', i === page ? 'bg-ink font-semibold text-white' : 'hover:bg-white')}>{i + 1}</button>
          ))}
          <Button kind="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
      {exporting && <ExportModal title="Export projects" filename={`engtrack-projects-${today}`} header={exportHeader} rows={exportRows} onClose={() => setExporting(false)} />}
    </div>
  );
}

function Sel({ id, label, value, onChange, opts }: { id: string; label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls(), 'h-9 !w-auto max-w-[180px] pr-7 text-[13px]', value ? 'border-ink font-medium' : 'text-ink-2')}>
      <option value="">{label}: all</option>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function ProjectCard({ p, client }: { p: Project; client: string }) {
  const { go, today } = useApp();
  const late = p.due < today && p.status !== 'Completed' && p.status !== 'Cancelled';
  return (
    <button onClick={() => go({ page: 'project', id: p.id })} className={cx('grid gap-1.5 rounded-xl border bg-white p-3.5 text-left active:bg-paper', late ? 'border-2 border-crit' : 'border-line')}>
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11.5px] text-ink-2">{p.number}</span>
        <DueFlag due={p.due} status={p.status} today={today} />
      </span>
      <span className="text-[15px] font-semibold leading-snug text-ink">{p.name}</span>
      <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-2">{client} · <ScopeTags types={p.scopes.map((x) => x.type)} max={2} /></span>
      <span className="flex items-center justify-between gap-2 text-[12.5px]">
        <span className="text-ink-2">Due <b className="font-semibold text-ink">{fmt(p.due)}</b></span>
        <StatusBadge status={p.status} short />
      </span>
      <span className="flex items-center gap-2"><span className="flex-1"><Progress value={projectProgress(p)} /></span><ChevronRight size={16} className="text-ink-3" aria-hidden /></span>
    </button>
  );
}

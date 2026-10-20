import { useMemo, useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { shortName, useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Card, Field, StatusBadge, cx, inputCls } from '../components/ui';
import { BarList, MonthlyColumns, SplitBars } from '../components/charts';
import { ExportModal } from '../components/ExportModal';
import { addDays, diffDays, fmt } from '../lib/dates';
import { isClosed, projectEngineers, projectProgress } from '../lib/rules';
import { byScope, monthly, workload } from '../lib/metrics';
import { SCOPE_TYPES, STATUSES, type Project, type Status } from '../types';
import type { Cell } from '../lib/exporting';

const REPORTS = [
  ['active', 'All active projects'],
  ['overdue', 'Overdue projects'],
  ['due7', 'Due within 7 days'],
  ['due30', 'Due within 30 days'],
  ['monthly', 'Completed by month'],
  ['stats', 'Completion statistics'],
  ['scope', 'Projects by engineering scope'],
  ['client', 'Projects by client'],
  ['workload', 'Workload per engineer'],
  ['hold', 'Projects on hold'],
  ['delays', 'Scope-level delays'],
] as const;
type RId = (typeof REPORTS)[number][0];

interface Table { header: string[]; rows: Cell[][]; ids?: string[]; status?: (Status | null)[] }

export function Reports() {
  const { visible, today, users, s, go, isMobile } = useApp();
  const [rid, setRid] = useState<RId>('stats');
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(addDays(today, 60));
  const [status, setStatus] = useState('');
  const [eng, setEng] = useState('');
  const [scope, setScope] = useState('');
  const [exporting, setExporting] = useState(false);
  const engineers = users.filter((u) => u.role === 'Engineer');
  const cname = (id: string) => s.clients.find((c) => c.id === id)?.name ?? '';

  // Filters apply to every report: date range (on the due date, or completion date for completed work), status, engineer, scope.
  const base = useMemo(() => visible.filter((p) => {
    const d = p.status === 'Completed' ? p.actualFinish ?? p.due : p.due;
    return (!from || d >= from) && (!to || d <= to) && (!status || p.status === status) && (!eng || projectEngineers(p).includes(eng)) && (!scope || p.scopes.some((x) => x.type === scope));
  }), [visible, from, to, status, eng, scope]);
  const open = base.filter((p) => !isClosed(p.status));
  const completed = base.filter((p) => p.status === 'Completed');
  const late = completed.filter((p) => p.actualFinish && p.actualFinish > p.due);

  const projTable = (list: Project[]): Table => ({
    header: ['CRM No.', 'Project', 'Client', 'Engineers', 'Due', 'Days', 'Status', 'Progress'],
    rows: list.map((p) => [p.number, p.name, cname(p.clientId), projectEngineers(p).map(shortName).join(', '), p.due, isClosed(p.status) ? '' : diffDays(today, p.due), p.status, `${projectProgress(p)}%`]),
    ids: list.map((p) => p.id),
    status: list.map((p) => p.status),
  });

  let chart: ReactNode = null;
  let table: Table;
  switch (rid) {
    case 'active': table = projTable(open.sort((a, b) => a.due.localeCompare(b.due))); break;
    case 'overdue': table = projTable(open.filter((p) => p.due < today).sort((a, b) => a.due.localeCompare(b.due))); break;
    case 'due7': table = projTable(open.filter((p) => p.due >= today && diffDays(today, p.due) <= 7)); break;
    case 'due30': table = projTable(open.filter((p) => p.due >= today && diffDays(today, p.due) <= 30)); break;
    case 'hold': table = projTable(base.filter((p) => p.status === 'On Hold')); break;
    case 'monthly':
    case 'stats': {
      chart = (
        <div className="grid gap-4">
          {rid === 'stats' && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Completed" value={String(completed.length)} />
              <Stat label="Finished on time" value={completed.length ? `${Math.round(((completed.length - late.length) / completed.length) * 100)}%` : '—'} />
              <Stat label="Average days late (late ones)" value={late.length ? (late.reduce((t, p) => t + diffDays(p.due, p.actualFinish!), 0) / late.length).toFixed(1) : '0'} />
              <Stat label="Overdue now" value={String(open.filter((p) => p.due < today).length)} alert />
            </div>
          )}
          <Card title="Completed per month" aside={<span>last 12 months</span>}><MonthlyColumns data={monthly(base, today, 12)} height={220} /></Card>
        </div>
      );
      table = { header: ['CRM No.', 'Project', 'Client', 'Due', 'Finished', 'Days late', 'Status'], rows: completed.sort((a, b) => (b.actualFinish ?? '').localeCompare(a.actualFinish ?? '')).map((p) => [p.number, p.name, cname(p.clientId), p.due, p.actualFinish ?? '', Math.max(0, diffDays(p.due, p.actualFinish ?? p.due)), p.status]), ids: completed.map((p) => p.id), status: completed.map((p) => p.status) };
      break;
    }
    case 'scope': {
      const rows = byScope(base);
      chart = <Card title="Projects by engineering scope"><BarList rows={rows} /></Card>;
      table = {
        header: ['Scope', 'Projects', 'Open scopes', 'Overdue scopes', 'Completed scopes'],
        rows: SCOPE_TYPES.map((t) => {
          const sc = base.flatMap((p) => p.scopes.filter((x) => x.type === t));
          return [t, rows.find((r) => r.label === t)!.value, sc.filter((x) => !isClosed(x.status)).length, sc.filter((x) => !isClosed(x.status) && x.due && x.due < today).length, sc.filter((x) => x.status === 'Completed').length];
        }),
      };
      break;
    }
    case 'client':
      table = {
        header: ['Client', 'Projects', 'Open', 'Overdue', 'Completed'],
        rows: s.clients.map((c) => {
          const l = base.filter((p) => p.clientId === c.id);
          return [c.name, l.length, l.filter((p) => !isClosed(p.status)).length, l.filter((p) => !isClosed(p.status) && p.due < today).length, l.filter((p) => p.status === 'Completed').length];
        }).filter((r) => (r[1] as number) > 0),
      };
      break;
    case 'workload': {
      const w = workload(base, eng ? engineers.filter((e) => e.id === eng) : engineers, today);
      chart = <Card title="Open scopes per engineer"><SplitBars rows={w} /></Card>;
      table = {
        header: ['Engineer', 'Open scopes', 'Overdue', 'Due in 7 days'],
        rows: w.map((r) => [r.label, r.a + r.b, r.b, base.flatMap((p) => p.scopes).filter((x) => x.engineerId === r.key && !isClosed(x.status) && x.due && x.due >= today && diffDays(today, x.due) <= 7).length]),
      };
      break;
    }
    case 'delays': {
      const list = base.flatMap((p) => p.scopes.filter((x) => !isClosed(x.status) && x.due && x.due < today).map((x) => ({ p, x }))).sort((a, b) => a.x.due!.localeCompare(b.x.due!));
      table = { header: ['CRM No.', 'Project', 'Scope', 'Engineer', 'Due', 'Days late', 'Progress', 'Status'], rows: list.map(({ p, x }) => [p.number, p.name, x.type, shortName(x.engineerId), x.due, diffDays(x.due!, today), `${x.progress}%`, x.status]), ids: list.map(({ p }) => p.id), status: list.map(({ x }) => x.status) };
      break;
    }
  }

  const title = REPORTS.find((r) => r[0] === rid)![1];
  const filters = (
    <div className={cx('grid gap-3 rounded-lg border border-line bg-white p-3', isMobile ? 'grid-cols-2' : 'grid-cols-[150px_150px_1fr_1fr_1fr]')}>
      <Field label="From" htmlFor="r-from"><input id="r-from" type="date" className={inputCls()} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
      <Field label="To" htmlFor="r-to"><input id="r-to" type="date" className={inputCls()} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      <Field label="Status" htmlFor="r-status"><select id="r-status" className={inputCls()} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Engineer" htmlFor="r-eng"><select id="r-eng" className={inputCls()} value={eng} onChange={(e) => setEng(e.target.value)}><option value="">All</option>{engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="Scope" htmlFor="r-scope"><select id="r-scope" className={inputCls()} value={scope} onChange={(e) => setScope(e.target.value)}><option value="">All</option>{SCOPE_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
    </div>
  );

  const tableEl = (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full text-[13px]">
        <thead><tr>{table.header.map((h) => <th key={h} className="whitespace-nowrap border-b-2 border-line-2 px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-2">{h}</th>)}</tr></thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i} onClick={table.ids ? () => go({ page: 'project', id: table.ids![i] }) : undefined} className={cx('border-b border-line', table.ids && 'cursor-pointer hover:bg-[#f6f9fc]')}>
              {r.map((c, j) => {
                const h = table.header[j];
                const st = table.status?.[i];
                return (
                  <td key={j} className={cx('whitespace-nowrap px-3 py-2', j === 0 && h === 'CRM No.' ? 'font-mono text-[12px] text-ink' : 'text-ink-2')}>
                    {h === 'Status' && st ? <StatusBadge status={st} short /> : ['Due', 'Finished'].includes(h) && typeof c === 'string' && c ? fmt(c, true) : h === 'Days' && typeof c === 'number' ? (c < 0 ? <b className="text-crit-700">{-c} late</b> : `in ${c}`) : h === 'Days late' ? <b className={cx(Number(c) > 0 && 'text-crit-700')}>{c}</b> : c}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length === 0 && <p className="py-10 text-center text-[13px] text-ink-3">No records match these filters.</p>}
    </div>
  );

  const exportBtn = <Button onClick={() => setExporting(true)}><Download size={16} />Export</Button>;

  return (
    <div className={cx('grid gap-4', isMobile ? 'p-4' : 'p-6')}>
      {isMobile ? (
        <>
          <div className="flex items-center justify-between"><h1 className="text-[20px] font-semibold text-ink">Reports</h1>{exportBtn}</div>
          <select aria-label="Report" className={inputCls()} value={rid} onChange={(e) => setRid(e.target.value as RId)}>{REPORTS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>
          {filters}{chart}{tableEl}
        </>
      ) : (
        <>
          <PageHead title="Reports" sub="Every report uses the filters below. Exports include only what you can see." actions={exportBtn} />
          <div className="grid grid-cols-[230px_minmax(0,1fr)] gap-4">
            <nav className="grid content-start gap-0.5 rounded-lg border border-line bg-white p-2" aria-label="Reports">
              {REPORTS.map(([id, l]) => (
                <button key={id} onClick={() => setRid(id)} aria-current={rid === id ? 'page' : undefined} className={cx('rounded-md px-3 py-2 text-left text-[13px]', rid === id ? 'bg-brand-50 font-semibold text-[#184f95]' : 'text-ink-2 hover:bg-paper')}>{l}</button>
              ))}
            </nav>
            <div className="grid min-w-0 content-start gap-4">
              <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
              {filters}{chart}{tableEl}
            </div>
          </div>
        </>
      )}
      {exporting && <ExportModal title={`Export · ${title}`} filename={`engtrack-${rid}-${today}`} header={table.header} rows={table.rows} onClose={() => setExporting(false)} />}
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={cx('rounded-lg border bg-white px-4 py-3', alert && value !== '0' ? 'border-crit/60' : 'border-line')}>
      <p className="text-[12px] text-ink-2">{label}</p>
      <p className={cx('text-[26px] font-semibold', alert && value !== '0' ? 'text-crit-700' : 'text-ink')}>{value}</p>
    </div>
  );
}

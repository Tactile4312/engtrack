import { AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import { shortName, useApp, userName, type ProjectFilters } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { RemoveSampleData } from './People';
import { Avatar, Button, Card, DueFlag, cx } from '../components/ui';
import { BarList, MonthlyColumns, Ratio, SplitBars } from '../components/charts';
import { byScope, byStatus, deadlines, monthly, recentActivity, summary, workload, type Deadline } from '../lib/metrics';
import { diffDays, fmt, fmtLong, relTime, showVal } from '../lib/dates';
import { can } from '../lib/rules';

export function DeadlineRow({ d, onOpen }: { d: Deadline; onOpen: () => void; compact?: boolean }) {
  const { today } = useApp();
  return (
    <button onClick={onOpen} className="flex w-full min-w-0 items-center gap-3 border-b border-line py-2 text-left last:border-0 hover:bg-paper">
      <span className={cx('w-[46px] shrink-0 font-mono text-[11.5px]', d.due === today ? 'font-semibold text-crit-700' : 'text-ink')}>{d.due === today ? 'Today' : fmt(d.due)}</span>
      <span className={cx('shrink-0 rounded px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-wide', d.kind === 'project' ? 'bg-ink text-white' : 'border border-line-2 text-ink-2')}>
        {d.kind === 'project' ? 'Project' : 'Scope'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{d.scope ? `${d.scope.type} · ${d.project.name}` : d.project.name}</span>
        <span className="block truncate text-[11.5px] text-ink-3">{d.project.number} · {shortName(d.ownerId)}</span>
      </span>
      <ChevronRight size={15} className="shrink-0 text-ink-3" aria-hidden />
    </button>
  );
}

function Kpi({ label, value, sub, alert, onClick }: { label: string; value: number; sub?: string; alert?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx('min-w-0 rounded-lg border bg-white px-3.5 py-3 text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand', alert && value > 0 ? 'border-crit/60 bg-crit-50/40' : 'border-line')}
    >
      <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
        {alert && value > 0 && <AlertTriangle size={13} className="text-crit" aria-hidden />}
        {label}
      </span>
      <span className={cx('mt-0.5 block text-[28px] font-semibold leading-tight', alert && value > 0 ? 'text-crit-700' : 'text-ink')}>{value}</span>
      <span className="block truncate text-[11.5px] text-ink-3">{sub ?? ' '}</span>
    </button>
  );
}

export function Dashboard() {
  const { visible, today, go, me, peopleIn, isMobile } = useApp();
  const sm = summary(visible, today);
  const dl = deadlines(visible);
  const upcoming = dl.filter((d) => d.due >= today && diffDays(today, d.due) <= 14).slice(0, isMobile ? 5 : 6);
  const overdue = dl.filter((d) => d.due < today).sort((a, b) => a.due.localeCompare(b.due));
  const engineers = peopleIn('Engineer');
  const toList = (filters: Partial<ProjectFilters>) => go({ page: 'projects', filters });
  const openD = (d: Deadline) => go({ page: 'project', id: d.project.id, scopeId: d.scope?.id });
  const scopeNote = (n: number) => (n ? `+ ${n} scope${n > 1 ? 's' : ''}` : 'no scopes');
  const restricted = me.role === 'Engineer' || me.role === 'Salesperson';

  const kpis = (
    <>
      <Kpi label="Total projects" value={sm.total} sub="all statuses" onClick={() => toList({ showCompleted: true })} />
      <Kpi label="New requests" value={sm.newRequests} sub="awaiting review" onClick={() => toList({ status: 'New Request' })} />
      <Kpi label="Active" value={sm.active} sub="being worked on" onClick={() => toList({})} />
      <Kpi label="Due today" value={sm.dueToday} sub={scopeNote(sm.dueTodayScopes)} alert onClick={() => toList({ due: 'today' })} />
      <Kpi label="Due this week" value={sm.dueWeek} sub={scopeNote(sm.dueWeekScopes)} onClick={() => toList({ due: 'week' })} />
      <Kpi label="Overdue" value={sm.overdue} sub={scopeNote(sm.overdueScopes)} alert onClick={() => toList({ due: 'overdue' })} />
      <Kpi label="Completed" value={sm.completed} sub="all time" onClick={() => toList({ status: 'Completed' })} />
      <Kpi label="On hold" value={sm.onHold} sub={' '} onClick={() => toList({ status: 'On Hold' })} />
    </>
  );

  const overdueCard = (
    <Card title="Overdue" aside={<span>{overdue.length} items</span>} className={overdue.length ? 'border-crit/50' : ''}>
      {overdue.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-3">Nothing is overdue.</p>
      ) : (
        overdue.slice(0, 5).map((d) => (
          <button key={(d.scope?.id ?? d.project.id) + d.kind} onClick={() => openD(d)} className="flex w-full items-center gap-3 border-b border-line py-2 text-left last:border-0 hover:bg-paper">
            <DueFlag due={d.due} status={d.scope?.status ?? d.project.status} today={today} compact />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{d.scope ? `${d.scope.type} · ${d.project.name}` : d.project.name}</span>
              <span className="block truncate text-[11.5px] text-ink-3">{d.kind === 'project' ? 'Project' : 'Scope'} · {d.project.number} · due {fmt(d.due)} · {shortName(d.ownerId)}</span>
            </span>
          </button>
        ))
      )}
    </Card>
  );

  if (isMobile) {
    return (
      <div className="grid gap-3 p-4">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Hello, {me.name.split(' ')[0]}</h1>
          <p className="text-[12.5px] text-ink-3">{fmtLong(today)}</p>
        </div>
        <RemoveSampleData compact />
        {(sm.overdue > 0 || sm.overdueScopes > 0) && (
          <button onClick={() => toList({ due: 'overdue' })} className="flex items-center gap-3 rounded-lg border-2 border-crit bg-crit-50 px-3 py-3 text-left">
            <AlertTriangle className="shrink-0 text-crit" size={22} aria-hidden />
            <span className="flex-1 text-[13.5px] text-ink"><b>{sm.overdue} project{sm.overdue === 1 ? '' : 's'}</b> and <b>{sm.overdueScopes} scope{sm.overdueScopes === 1 ? '' : 's'}</b> are overdue</span>
            <ChevronRight size={18} className="text-ink-3" aria-hidden />
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Kpi label="Due today" value={sm.dueToday} sub={scopeNote(sm.dueTodayScopes)} alert onClick={() => toList({ due: 'today' })} />
          <Kpi label="Due this week" value={sm.dueWeek} sub={scopeNote(sm.dueWeekScopes)} onClick={() => toList({ due: 'week' })} />
          <Kpi label="Active" value={sm.active} onClick={() => toList({})} />
          <Kpi label="New requests" value={sm.newRequests} onClick={() => toList({ status: 'New Request' })} />
        </div>
        <Card title="Upcoming deadlines" aside={<span>next 14 days</span>}>
          {upcoming.length ? upcoming.map((d) => <DeadlineRow key={(d.scope?.id ?? d.project.id) + d.kind} d={d} onOpen={() => openD(d)} compact />) : <p className="py-4 text-center text-[13px] text-ink-3">No deadlines in the next 14 days.</p>}
        </Card>
        <Card title="Projects by status">
          <BarList rows={byStatus(visible)} onPick={(s) => toList({ status: s as ProjectFilters['status'] })} />
        </Card>
        {!restricted && (
          <Card title="Workload by engineer" aside={<span>open scopes</span>}>
            <SplitBars rows={workload(visible, engineers, today)} onPick={(id) => toList({ engineerId: id })} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      <PageHead
        title="Dashboard"
        sub={<>{fmtLong(today)}{restricted && <> · showing the {visible.length} projects {me.role === 'Engineer' ? 'assigned to you' : 'for your clients'}</>}</>}
        actions={can(me, 'create') && <Button kind="primary" onClick={() => go({ page: 'new' })}><Plus size={16} />New project</Button>}
      />
      <RemoveSampleData compact />
      <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">{kpis}</div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card title="Projects by status"><BarList rows={byStatus(visible)} onPick={(s) => toList({ status: s as ProjectFilters['status'], showCompleted: true })} /></Card>
        <Card title="Projects by engineering scope" aside={<span>a project can have several</span>}><BarList rows={byScope(visible)} onPick={(s) => toList({ scope: s })} /></Card>
        <Card title="Completed per month" aside={<span>last 6 months</span>}><MonthlyColumns data={monthly(visible, today)} /></Card>
        <Card title="On time vs overdue" aside={<span>open work</span>}>
          <div className="grid gap-5 pt-2">
            <div><p className="mb-1.5 text-[12.5px] font-medium text-ink">Projects</p><Ratio a={sm.openCount - sm.overdue} b={sm.overdue} labels={['on time', 'overdue']} /></div>
            <div><p className="mb-1.5 text-[12.5px] font-medium text-ink">Engineering scopes</p><Ratio a={sm.openScopeCount - sm.overdueScopes} b={sm.overdueScopes} labels={['on time', 'overdue']} /></div>
            <Button kind="ghost" className="justify-self-start px-1 text-brand" onClick={() => toList({ due: 'overdue' })}>See overdue work <ChevronRight size={15} /></Button>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card title="Upcoming deadlines" aside={<span>next 14 days</span>}>
          {upcoming.length ? upcoming.map((d) => <DeadlineRow key={(d.scope?.id ?? d.project.id) + d.kind} d={d} onOpen={() => openD(d)} />) : <p className="py-6 text-center text-[13px] text-ink-3">No deadlines in the next 14 days.</p>}
        </Card>
        {overdueCard}
        <Card title="Workload by engineer" aside={<span>open scopes</span>}>
          <SplitBars rows={workload(visible, engineers, today)} onPick={(id) => toList({ engineerId: id })} />
        </Card>
        <Card title="Recent activity">
          {recentActivity(visible).map((a) => (
            <button key={a.id} onClick={() => go({ page: 'project', id: a.project.id, tab: 'activity' })} className="flex w-full gap-2.5 border-b border-line py-2 text-left last:border-0 hover:bg-paper">
              <Avatar name={userName(a.userId)} size={26} />
              <span className="min-w-0 flex-1 text-[12.5px]">
                <span className="block text-ink"><b className="font-semibold">{shortName(a.userId)}</b> {a.action.toLowerCase()}{a.to ? <> → <b className="font-semibold">{showVal(a.to)}</b></> : null}</span>
                <span className="block truncate text-[11.5px] text-ink-3">{a.project.number} · {relTime(a.at)}</span>
              </span>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}

// My week: everything that is the signed-in person's own job, overdue or due in the next 7 days.
import { useMemo } from 'react';
import { ChevronRight, Diamond, FolderKanban, ListChecks, Wrench } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Card, cx, staggerAt } from '../components/ui';
import { celebrate } from '../components/Confetti';
import { addDays, dayName, fmt } from '../lib/dates';
import { myWeek, type WeekItem, type WeekKind } from '../lib/myweek';
import { finishesAll } from '../lib/fun';

const KIND: Record<WeekKind, { label: string; Icon: typeof Diamond; tone: string }> = {
  project: { label: 'Project due', Icon: FolderKanban, tone: 'bg-ink text-white' },
  milestone: { label: 'Milestone', Icon: Diamond, tone: 'bg-[#f1effc] text-[#4a3aa7]' },
  scope: { label: 'Scope due', Icon: Wrench, tone: 'bg-brand-50 text-[#880e40]' },
  task: { label: 'Task', Icon: ListChecks, tone: 'bg-[#e8f6ee] text-[#1d6b43]' },
};

const EMPTY_DAY = ['Nothing due. Suspicious.', 'Clear skies.', 'A rare quiet day.', 'Free. Enjoy it.', 'Nothing here. Yet.'];

export function MyWeek() {
  const { visible, me, today, go, dispatch } = useApp();
  const { groups, count } = useMemo(() => myWeek(visible, me.id, today), [visible, me.id, today]);
  const overdue = groups[0]?.day === 'overdue' ? groups[0].items.length : 0;

  const open = (it: WeekItem) =>
    go(it.kind === 'task' ? { page: 'project', id: it.project.id, tab: 'tasks' } : { page: 'project', id: it.project.id, scopeId: it.scopeId });

  const tick = (it: WeekItem, el: HTMLElement) => {
    if (!it.taskId) return;
    if (finishesAll(it.project.tasks, it.taskId)) celebrate({ big: true });
    else {
      const r = el.getBoundingClientRect();
      celebrate({ x: r.left + r.width / 2, y: r.top });
    }
    dispatch({ t: 'task', projectId: it.project.id, taskId: it.taskId });
  };

  const title = (day: string) =>
    day === 'overdue' ? 'Overdue' : day === today ? 'Today' : day === addDays(today, 1) ? 'Tomorrow' : dayName(day);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 p-4 sm:p-6">
      <PageHead
        title="My week"
        sub={count === 0 ? 'Nothing on your plate for the next 7 days. 🎉' : <>{count} {count === 1 ? 'thing' : 'things'} for you in the next 7 days{overdue > 0 && <> · <span className="font-semibold text-crit">{overdue} overdue</span></>}</>}
      />
      <div className="stagger grid min-w-0 grid-cols-1 gap-3">
        {groups.map((g, gi) => (
          <div key={g.day} className="min-w-0 animate-rise" style={staggerAt(gi)}>
          <Card
            className={cx(g.day === 'overdue' && 'border-[#f0b9a6]')}
            title={<span className={cx(g.day === 'overdue' && 'text-crit')}>{title(g.day)}{g.day !== 'overdue' && <span className="ml-2 font-normal text-ink-3">{fmt(g.day)}</span>}</span>}
            aside={g.items.length > 0 && <span className="text-[12px] text-ink-3">{g.items.length}</span>}
          >
            <div className="min-w-0">
              {g.items.length === 0 ? (
                <p className="text-[13px] text-ink-3">{EMPTY_DAY[gi % EMPTY_DAY.length]}</p>
              ) : (
                <ul className="grid min-w-0 grid-cols-1">
                  {g.items.map((it) => {
                    const k = KIND[it.kind];
                    return (
                      <li key={it.key} className="flex min-w-0 items-center gap-3 border-b border-line py-2 last:border-0">
                        {it.kind === 'task' ? (
                          <input type="checkbox" aria-label={`Done: ${it.label}`} className="h-4 w-4 shrink-0 accent-[#c72a6b]" checked={false} onChange={(e) => tick(it, e.currentTarget)} />
                        ) : (
                          <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-md', k.tone)} title={k.label}><k.Icon size={13} aria-hidden /></span>
                        )}
                        <button onClick={() => open(it)} className="group flex min-w-0 flex-1 items-center gap-2 text-left">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] text-ink group-hover:underline">{it.label}</span>
                            <span className="block truncate text-[11.5px] text-ink-3">{k.label} · {it.project.number}{it.kind !== 'project' && ` · ${it.project.name}`}{g.day === 'overdue' && ` · was due ${fmt(it.date)}`}</span>
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

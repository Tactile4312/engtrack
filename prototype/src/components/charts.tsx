import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cx } from './ui';

const BLUE = '#2a78d6';
const RED = '#c63434';
const GRID = '#e6eaee';
const MUTED = '#7b858f';

/** Single-series horizontal bars. Each row is a button that opens the matching filtered list. */
export function BarList({ rows, onPick, unit }: { rows: { label: string; value: number; key?: string }[]; onPick?: (key: string) => void; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-1.5">
      {rows.map((r) => (
        <li key={r.label}>
          <button
            type="button"
            disabled={!onPick}
            onClick={() => onPick?.(r.key ?? r.label)}
            className="group grid w-full grid-cols-[118px_1fr] items-center gap-3 rounded px-1 py-0.5 text-left text-[12.5px] enabled:hover:bg-paper"
            title={`${r.label}: ${r.value}${unit ? ' ' + unit : ''}`}
          >
            <span className="truncate text-ink-2">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded-r-[4px] transition-opacity group-enabled:group-hover:opacity-80" style={{ width: `${(r.value / max) * 85}%`, minWidth: r.value ? 4 : 0, background: BLUE }} />
              <span className="tabular-nums text-ink">{r.value}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Two-part horizontal bars (on track vs overdue), separated by a 2px surface gap. */
export function SplitBars({ rows, onPick, labels = ['On track', 'Overdue'] }: { rows: { label: string; a: number; b: number; key?: string }[]; onPick?: (key: string) => void; labels?: [string, string] }) {
  const max = Math.max(1, ...rows.map((r) => r.a + r.b));
  return (
    <div>
      <Legend items={[[labels[0], BLUE], [labels[1], RED]]} />
      <ul className="mt-2 grid gap-1.5">
        {rows.map((r) => (
          <li key={r.label}>
            <button
              type="button"
              disabled={!onPick}
              onClick={() => onPick?.(r.key ?? r.label)}
              className="group grid w-full grid-cols-[118px_1fr] items-center gap-3 rounded px-1 py-0.5 text-left text-[12.5px] enabled:hover:bg-paper"
              title={`${r.label}: ${r.a} ${labels[0].toLowerCase()}, ${r.b} ${labels[1].toLowerCase()}`}
            >
              <span className="truncate text-ink-2">{r.label}</span>
              <span className="flex items-center gap-2">
                <span className="flex h-3 gap-[2px]" style={{ width: `${((r.a + r.b) / max) * 85}%` }}>
                  {r.a > 0 && <span className={cx('h-full', r.b ? '' : 'rounded-r-[4px]')} style={{ flex: r.a, background: BLUE }} />}
                  {r.b > 0 && <span className="h-full rounded-r-[4px]" style={{ flex: r.b, background: RED }} />}
                </span>
                <span className="tabular-nums text-ink">{r.a + r.b}</span>
                {r.b > 0 && <span className="whitespace-nowrap text-[11px] font-medium text-crit-700">{r.b} overdue</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
      {items.map(([l, c]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} aria-hidden />
          {l}
        </span>
      ))}
    </div>
  );
}

interface MonthRow { month: string; onTime: number; late: number }

function MonthTip({ active, payload, label }: { active?: boolean; payload?: { payload: MonthRow }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-[12px] shadow-md">
      <div className="mb-1 text-ink-3">{label}</div>
      <div className="flex items-center gap-2"><span className="h-0.5 w-3" style={{ background: BLUE }} /><b className="tabular-nums text-ink">{r.onTime}</b><span className="text-ink-2">on time</span></div>
      <div className="flex items-center gap-2"><span className="h-0.5 w-3" style={{ background: RED }} /><b className="tabular-nums text-ink">{r.late}</b><span className="text-ink-2">late</span></div>
    </div>
  );
}

/** Completions per month, stacked: on time (blue) and finished after the due date (red). */
export function MonthlyColumns({ data, height = 190 }: { data: MonthRow[]; height?: number }) {
  return (
    <div>
      <Legend items={[['On time', BLUE], ['Late', RED]]} />
      <div style={{ height }} className="mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#c5ccd3' }} tick={{ fill: MUTED, fontSize: 11.5 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11.5 }} width={40} />
            <Tooltip content={<MonthTip />} cursor={{ fill: '#eef2f6' }} />
            <Bar dataKey="onTime" stackId="a" fill={BLUE} maxBarSize={24} stroke="#fff" strokeWidth={1} isAnimationActive={false} />
            <Bar dataKey="late" stackId="a" fill={RED} maxBarSize={24} radius={[4, 4, 0, 0]} stroke="#fff" strokeWidth={1} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** One horizontal 100% bar with two labelled parts. */
export function Ratio({ a, b, labels }: { a: number; b: number; labels: [string, string] }) {
  const t = Math.max(1, a + b);
  return (
    <div className="grid gap-1.5">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={`${a} ${labels[0]}, ${b} ${labels[1]}`}>
        {a > 0 && <span style={{ flex: a, background: BLUE }} />}
        {b > 0 && <span style={{ flex: b, background: RED }} />}
      </div>
      <div className="flex justify-between text-[12px]">
        <span className="text-ink-2"><b className="tabular-nums text-ink">{a}</b> {labels[0]} · {Math.round((a / t) * 100)}%</span>
        <span className="text-ink-2"><b className="tabular-nums text-crit-700">{b}</b> {labels[1]}</span>
      </div>
    </div>
  );
}

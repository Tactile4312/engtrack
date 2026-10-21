import { useEffect, type ReactNode } from 'react';
import {
  AlertTriangle, CheckCircle2, CircleDot, Clock, Eye, PauseCircle, PlayCircle, X, XCircle,
} from 'lucide-react';
import type { ISODate, Priority, ScopeType, Status } from '../types';
import { diffDays } from '../lib/dates';
import { dueState } from '../lib/rules';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

const STATUS_STYLE: Record<Status, { cls: string; Icon: typeof CircleDot }> = {
  'New Request': { cls: 'bg-[#fdecf3] text-[#880e40] ring-[#f6c0d6]', Icon: CircleDot },
  'For Review': { cls: 'bg-[#f1effc] text-[#4a3aa7] ring-[#d6d0f5]', Icon: Eye },
  'In Progress': { cls: 'bg-[#c72a6b] text-white ring-[#c72a6b]', Icon: PlayCircle },
  'On Hold': { cls: 'bg-[#eef0f2] text-[#4a5560] ring-[#c5ccd3]', Icon: PauseCircle },
  'Waiting for Client': { cls: 'bg-[#fdf4dd] text-[#7a5200] ring-[#f1d58f]', Icon: Clock },
  'Waiting for Engineering': { cls: 'bg-[#fdf4dd] text-[#7a5200] ring-[#f1d58f]', Icon: Clock },
  Completed: { cls: 'bg-[#e8f5e8] text-[#0e5f0e] ring-[#b9dfb9]', Icon: CheckCircle2 },
  Cancelled: { cls: 'bg-[#f4f6f8] text-[#7b858f] ring-[#dde2e7] line-through', Icon: XCircle },
};

export function StatusBadge({ status, short }: { status: Status; short?: boolean }) {
  const { cls, Icon } = STATUS_STYLE[status];
  const label = short ? status.replace('Waiting for ', 'Waiting · ') : status;
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', cls)}>
      <Icon size={12} strokeWidth={2.2} aria-hidden />
      {label}
    </span>
  );
}

const PRI: Record<Priority, string> = {
  Low: 'bg-[#dde2e7]',
  Normal: 'bg-[#8fa3b6]',
  High: 'bg-[#b77a00]',
  Critical: 'bg-[#c2410c]',
};

export function PriorityTag({ p }: { p: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink-2">
      <span className={cx('h-2 w-2 rounded-sm', PRI[p])} aria-hidden />
      {p}
    </span>
  );
}

export function Progress({ value, size = 'sm', label = true }: { value: number; size?: 'sm' | 'md' | 'lg'; label?: boolean }) {
  const h = size === 'lg' ? 'h-2.5' : size === 'md' ? 'h-2' : 'h-1.5';
  return (
    <div className="flex min-w-0 items-center gap-2" role="img" aria-label={`${value}% complete`}>
      <div className={cx('relative w-full min-w-[48px] overflow-hidden rounded-full bg-[#e3e8ed]', h)}>
        <div className={cx('absolute inset-y-0 left-0 rounded-full', value >= 100 ? 'bg-[#127a12]' : 'bg-[#c72a6b]')} style={{ width: `${value}%` }} />
      </div>
      {label && <span className={cx('shrink-0 tabular-nums text-ink-2', size === 'lg' ? 'text-base font-semibold text-ink' : 'text-[12px]')}>{value}%</span>}
    </div>
  );
}

export function DueFlag({ due, status, today, compact }: { due: ISODate | null; status: Status; today: ISODate; compact?: boolean }) {
  const st = dueState(due, status, today);
  if (st === 'overdue') {
    const n = diffDays(due!, today);
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-crit px-1.5 py-[1px] text-[11px] font-semibold text-white">
        <AlertTriangle size={11} strokeWidth={2.5} aria-hidden />
        {compact ? `${n} d` : `${n} d overdue`}
      </span>
    );
  }
  if (st === 'today')
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-crit-50 px-1.5 py-[1px] text-[11px] font-semibold text-crit-700 ring-1 ring-inset ring-[#f6c4a8]"><Clock size={11} strokeWidth={2.5} aria-hidden />Due today</span>;
  if (st === 'soon' && !compact) {
    const n = diffDays(today, due!);
    return <span className="whitespace-nowrap text-[11px] font-medium text-warn">in {n} d</span>;
  }
  return null;
}

export function ScopeTags({ types, max = 1 }: { types: ScopeType[]; max?: number }) {
  if (!types.length) return <span className="text-ink-3">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {types.slice(0, max).map((t) => (
        <span key={t} className="whitespace-nowrap rounded border border-line bg-paper px-1.5 py-[1px] text-[11px] text-ink-2">{t}</span>
      ))}
      {types.length > max && <span className="rounded bg-[#e3e8ed] px-1.5 py-[1px] text-[11px] font-medium text-ink-2" title={types.slice(max).join(', ')}>+{types.length - max}</span>}
    </span>
  );
}

export function Card({ title, aside, children, className, pad = true, onTitleClick }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; pad?: boolean; onTitleClick?: () => void }) {
  return (
    <section className={cx('min-w-0 rounded-lg border border-line bg-paper-2', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
          <h3 className={cx('text-[13.5px] font-semibold text-ink', onTitleClick && 'cursor-pointer hover:underline')} onClick={onTitleClick}>{title}</h3>
          {aside && <div className="flex items-center gap-2 text-[12px] text-ink-3">{aside}</div>}
        </header>
      )}
      <div className={pad ? 'px-4 pb-4 pt-2' : ''}>{children}</div>
    </section>
  );
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ kind = 'secondary', children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind }) {
  const k: Record<BtnKind, string> = {
    primary: 'bg-brand text-white hover:bg-brand-600 border-brand',
    secondary: 'bg-white text-ink border-line-2 hover:bg-paper',
    ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-[#e9edf1]',
    danger: 'bg-crit text-white border-crit hover:bg-crit-700',
  };
  return (
    <button
      type="button"
      {...rest}
      className={cx('inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50', k[kind], className)}
    >
      {children}
    </button>
  );
}

export function Field({ label, required, error, hint, children, htmlFor }: { label: string; required?: boolean; error?: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="grid min-w-0 gap-1">
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink">
        {label}
        {required && <span className="text-crit"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-[12px] font-medium text-crit-700" role="alert">
          <AlertTriangle size={13} className="mt-[1px] shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputCls = (err?: string) =>
  cx('h-10 w-full min-w-0 rounded-md border bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100', err ? 'border-crit ring-2 ring-crit-50' : 'border-line-2');

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-[#14202b]/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('max-h-[92%] w-full overflow-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl', wide ? 'max-w-2xl' : 'max-w-md')} onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-3">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <button className="rounded p-1 text-ink-3 hover:bg-paper" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-1 px-6 py-12 text-center">
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {children && <div className="max-w-sm text-[13px] text-ink-3">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-[#f3dce6] font-semibold text-[#880e40]" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}

export function Chip({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx('inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-[12.5px] font-medium', on ? 'border-ink bg-ink text-white' : 'border-line-2 bg-white text-ink-2 hover:bg-paper')}
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px]', value === t.id ? 'border-brand font-semibold text-ink' : 'border-transparent text-ink-3 hover:text-ink')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

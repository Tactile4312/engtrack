// The look of the signed-out and loading screens (live mode). No data or sign-in logic lives here.
import type { ReactNode } from 'react';
import { BellRing, CalendarRange, CheckCircle2, Layers } from 'lucide-react';
import { Logo } from './Shell';
import { cx } from './ui';

const POINTS = [
  { Icon: Layers, text: 'Every engineering scope tracked on its own: engineer, dates, progress.' },
  { Icon: CalendarRange, text: 'Timeline and calendar views of what is due and what is slipping.' },
  { Icon: BellRing, text: 'Reminders 7, 3 and 1 days before a deadline, and when it passes.' },
];

/** A small made-up card for the welcome panel, showing what the app tracks. */
function PreviewCard({ className, title, sub, progress, flag }: { className?: string; title: string; sub: string; progress: number; flag: ReactNode }) {
  return (
    <div className={cx('w-[250px] rounded-xl border border-white/10 bg-white/[0.07] p-3.5 shadow-pop backdrop-blur-md', className)} aria-hidden>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{title}</p>
          <p className="truncate text-[11.5px] text-rail-3">{sub}</p>
        </div>
        {flag}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full origin-left animate-grow rounded-full bg-brand" style={{ width: `${progress}%`, animationDelay: '300ms' }} />
      </div>
      <p className="mt-1.5 text-right text-[11px] tabular-nums text-rail-3">{progress}%</p>
    </div>
  );
}

/** Left half of the sign-in screen on wide screens: what EngTrack is, in a few lines. */
export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-rail p-10 lg:flex lg:flex-col">
      {/* Soft glows in the brand colour; purely decorative. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#7a2a8c]/25 blur-3xl" aria-hidden />
      <div className="relative animate-fade"><Logo dark /></div>
      <div className="relative my-auto grid max-w-[440px] gap-6 pt-10">
        <h2 className="animate-rise text-[30px] font-semibold leading-tight tracking-tight text-white">Every project, scope and deadline in one place.</h2>
        <ul className="stagger grid gap-3.5">
          {POINTS.map(({ Icon, text }, i) => (
            <li key={text} className="flex animate-rise items-start gap-3 text-[14px] text-rail-3" style={{ ['--i' as string]: i + 2 }}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white"><Icon size={16} aria-hidden /></span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex flex-wrap gap-4">
        <PreviewCard
          className="animate-rise [animation-delay:450ms]"
          title="Reactor Vessel Lift"
          sub="Lifting · J. Cruz"
          progress={60}
          flag={<span className="shrink-0 rounded-full bg-warn/90 px-2 py-0.5 text-[10.5px] font-semibold text-white">in 3 d</span>}
        />
        <PreviewCard
          className="animate-rise [animation-delay:550ms] xl:translate-y-6"
          title="Route Survey"
          sub="Transport · M. Tan"
          progress={100}
          flag={<CheckCircle2 size={18} className="shrink-0 text-[#7fd17f]" />}
        />
      </div>
    </aside>
  );
}

/** Stands in for the app while the signed-in person's data loads: the same layout, shimmering. */
export function AppSkeleton() {
  const bar = (className: string) => <div className={cx('skeleton animate-shimmer', className)} />;
  return (
    <div className="flex h-full bg-paper" role="status" aria-live="polite">
      <span className="sr-only">Loading your projects…</span>
      <div className="hidden w-[232px] shrink-0 flex-col gap-3 bg-rail px-5 py-5 md:flex" aria-hidden>
        <Logo dark />
        <div className="mt-4 grid gap-3">{Array.from({ length: 7 }, (_, i) => <div key={i} className="h-4 rounded bg-white/10" style={{ width: `${60 + ((i * 17) % 35)}%` }} />)}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col" aria-hidden>
        <div className="flex h-[60px] items-center gap-4 border-b border-line bg-white px-6">{bar('h-9 w-full max-w-[420px]')}</div>
        <div className="grid gap-4 p-6">
          {bar('h-7 w-48')}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-[92px] animate-shimmer rounded-xl" />)}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-64 animate-shimmer rounded-xl" />)}</div>
        </div>
      </div>
    </div>
  );
}

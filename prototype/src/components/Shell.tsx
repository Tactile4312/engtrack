import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, Bell, BarChart3, Building2, CalendarDays, Check, FolderKanban, GanttChartSquare, Home, LayoutDashboard, LogOut, Menu, Monitor, RotateCcw, Search, Smartphone, Users,
} from 'lucide-react';
import { useApp, type Route } from '../store/AppStore';
import { useInbox } from '../lib/hooks';
import { Avatar, cx } from './ui';
import { LIVE } from '../lib/cloud';
import { signOut } from './LiveGate';
import { PersonModal } from '../pages/People';

const NAV: { page: Route['page']; label: string; Icon: typeof Home }[] = [
  { page: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { page: 'projects', label: 'Projects', Icon: FolderKanban },
  { page: 'timeline', label: 'Timeline', Icon: GanttChartSquare },
  { page: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { page: 'notifications', label: 'Notifications', Icon: Bell },
  { page: 'reports', label: 'Reports', Icon: BarChart3 },
  { page: 'clients', label: 'Clients', Icon: Building2 },
  ...(LIVE ? [{ page: 'people' as const, label: 'People', Icon: Users }] : []),
];

/** Live mode: shows whether the latest change has been saved. */
export function SaveBadge() {
  const { save } = useApp();
  if (!save) return null;
  if (save === 'error') return <span role="status" className="flex items-center gap-1 text-[12px] font-medium text-crit"><AlertTriangle size={14} aria-hidden />Not saved, retrying…</span>;
  if (save === 'saving') return <span role="status" className="text-[12px] text-ink-3">Saving…</span>;
  return <span role="status" className="flex items-center gap-1 text-[12px] text-ink-3"><Check size={14} aria-hidden />Saved</span>;
}

const sectionOf = (r: Route): Route['page'] => (r.page === 'project' || r.page === 'new' || r.page === 'edit' ? 'projects' : r.page);

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <rect width="30" height="30" rx="7" fill="#c72a6b" />
        <path d="M8 21h14M10 21V11l5-3 5 3v10M13 21v-5h4v5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className={cx('text-[16px] font-semibold tracking-tight', dark ? 'text-white' : 'text-ink')}>EngTrack</span>
    </span>
  );
}

export function PrototypeBar() {
  const { me, users, dispatch, device, setDevice } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#f1d58f] bg-[#fdf4dd] px-4 py-2 text-[12.5px] text-[#5c3d00]">
      <span className="font-semibold uppercase tracking-wider">Prototype</span>
      <span className="hidden md:inline">Fictional demo data. Changes are kept only until you reload.</span>
      <span className="flex-1" />
      <label className="flex items-center gap-2">
        <span>Viewing as</span>
        <select
          id="viewas"
          className="h-8 rounded-md border border-[#e3c26d] bg-white px-2 text-[12.5px] text-ink"
          value={me.id}
          onChange={(e) => dispatch({ t: 'user', id: e.target.value })}
        >
          {(['Administrator', 'Project Manager', 'Engineer', 'Salesperson'] as const).map((role) => (
            <optgroup key={role} label={role}>
              {users.filter((u) => u.role === role).map((u) => (
                <option key={u.id} value={u.id}>{u.name} · {role}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="flex overflow-hidden rounded-md border border-[#e3c26d] bg-white" role="group" aria-label="Preview size">
        {([['auto', 'Auto', null], ['desktop', 'Desktop', Monitor], ['mobile', 'Mobile', Smartphone]] as const).map(([d, label, Icon]) => (
          <button key={d} onClick={() => setDevice(d)} aria-pressed={device === d} className={cx('flex h-8 items-center gap-1 px-2.5', device === d ? 'bg-ink text-white' : 'text-ink-2 hover:bg-paper')}>
            {Icon && <Icon size={14} aria-hidden />}
            {label}
          </button>
        ))}
      </div>
      <button className="flex h-8 items-center gap-1 rounded-md border border-[#e3c26d] bg-white px-2.5 text-ink-2 hover:bg-paper" onClick={() => dispatch({ t: 'reset' })}>
        <RotateCcw size={14} aria-hidden /> Reset demo
      </button>
    </div>
  );
}

function GlobalSearch({ big }: { big?: boolean }) {
  const { go } = useApp();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className={cx('flex items-center gap-2 rounded-md border border-line-2 bg-white px-3', big ? 'h-11 w-full' : 'h-9 w-full max-w-[420px]')}
      onSubmit={(e) => {
        e.preventDefault();
        go({ page: 'projects', filters: { q } });
      }}
    >
      <Search size={16} className="text-ink-3" aria-hidden />
      <input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search CRM no., project or client" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-3" />
    </form>
  );
}

/** Live mode: the signed-in person can click their name to change it. */
function Profile() {
  const { me, s } = useApp();
  const [open, setOpen] = useState(false);
  const inner = (
    <>
      <Avatar name={me.name} size={34} />
      <div className="text-left leading-tight">
        <div className="text-[13px] font-semibold text-ink">{me.name}</div>
        <div className="text-[11.5px] text-ink-3">{LIVE ? 'Edit my name' : me.role}</div>
      </div>
    </>
  );
  if (!LIVE) return <div className="flex items-center gap-2.5">{inner}</div>;
  const self = s.people.find((u) => u.id === me.id);
  return (
    <>
      <button id="profile-edit" onClick={() => setOpen(true)} className="flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-paper" title="Edit my name">{inner}</button>
      {open && <PersonModal person={self} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DesktopShell({ children }: { children: ReactNode }) {
  const { s, go } = useApp();
  const { unread } = useInbox();
  const cur = sectionOf(s.route);
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-[232px] shrink-0 flex-col bg-rail px-3 py-4 text-[13.5px]">
        <div className="px-2 pb-5"><Logo dark /></div>
        <nav className="grid gap-0.5" aria-label="Main">
          {NAV.map(({ page, label, Icon }) => (
            <button
              key={page}
              onClick={() => go({ page } as Route)}
              aria-current={cur === page ? 'page' : undefined}
              className={cx('flex items-center gap-3 rounded-md px-3 py-2 text-left', cur === page ? 'bg-rail-2 font-medium text-white' : 'text-rail-3 hover:bg-rail-2/60 hover:text-white')}
            >
              <Icon size={17} aria-hidden />
              {label}
              {page === 'notifications' && unread > 0 && <span className="ml-auto rounded-full bg-crit px-1.5 text-[11px] font-semibold text-white">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
        {LIVE ? (
          <button onClick={() => void signOut()} className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-rail-3 hover:bg-rail-2/60 hover:text-white"><LogOut size={17} aria-hidden />Sign out</button>
        ) : (
          <p className="px-3 text-[11px] leading-snug text-rail-3">Prototype v0.2<br />Sample records only</p>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-line bg-white px-6">
          <GlobalSearch />
          <span className="flex-1" />
          <SaveBadge />
          <button onClick={() => go({ page: 'notifications' })} className="relative grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 hover:bg-paper" aria-label={`Notifications, ${unread} unread`}>
            <Bell size={17} />
            {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-crit px-1.5 text-[10.5px] font-semibold leading-4 text-white">{unread}</span>}
          </button>
          <Profile />
        </header>
        <main className="min-h-0 flex-1 overflow-auto bg-paper" id="main">{children}</main>
      </div>
    </div>
  );
}

export function MobileShell({ children, title, back }: { children: ReactNode; title?: string; back?: boolean }) {
  const { s, go, me, dispatch } = useApp();
  const { unread } = useInbox();
  const cur = sectionOf(s.route);
  const tabs: { page: Route['page']; label: string; Icon: typeof Home; badge?: number }[] = [
    { page: 'dashboard', label: 'Home', Icon: Home },
    { page: 'projects', label: 'Projects', Icon: FolderKanban },
    { page: 'timeline', label: 'Timeline', Icon: GanttChartSquare },
    { page: 'notifications', label: 'Alerts', Icon: Bell, badge: unread },
    { page: 'more', label: 'More', Icon: Menu },
  ];
  const moreActive = ['calendar', 'reports', 'clients', 'people', 'more'].includes(cur);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
        {back ? (
          <button onClick={() => dispatch({ t: 'back' })} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        ) : (
          <Logo />
        )}
        {title && <h1 className="min-w-0 truncate text-[16px] font-semibold text-ink">{title}</h1>}
        <span className="flex-1" />
        <SaveBadge />
        {!back && (
          <>
            <button onClick={() => go({ page: 'notifications' })} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2" aria-label={`Notifications, ${unread} unread`}>
              <Bell size={20} />
              {unread > 0 && <span className="absolute right-0.5 top-0.5 rounded-full bg-crit px-1.5 text-[10.5px] font-semibold leading-4 text-white">{unread}</span>}
            </button>
            <button onClick={() => go({ page: 'more' })} aria-label="Profile and more"><Avatar name={me.name} size={32} /></button>
          </>
        )}
      </header>
      <main className="min-h-0 flex-1 overflow-auto" id="main">{children}</main>
      <nav className="grid shrink-0 grid-cols-5 border-t border-line bg-white pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5" aria-label="Main">
        {tabs.map(({ page, label, Icon, badge }) => {
          const on = page === 'more' ? moreActive : cur === page;
          return (
            <button key={page} onClick={() => go({ page } as Route)} aria-current={on ? 'page' : undefined} className={cx('relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px]', on ? 'font-semibold text-brand' : 'text-ink-3')}>
              <Icon size={21} strokeWidth={on ? 2.3 : 1.8} aria-hidden />
              {label}
              {!!badge && <span className="absolute left-1/2 top-0 ml-2 rounded-full bg-crit px-1.5 text-[10px] font-semibold leading-4 text-white">{badge}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        {sub && <div className="mt-0.5 text-[13px] text-ink-3">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

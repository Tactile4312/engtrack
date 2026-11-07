// Quick search (Ctrl+K / Cmd+K, or "/"): jump to any project, client or screen, or start a new project.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BarChart3, Bell, Building2, CalendarDays, CornerDownLeft, FolderKanban, GanttChartSquare, LayoutDashboard, PartyPopper, Plus, Search, Users, type LucideIcon,
} from 'lucide-react';
import { useApp, type Route } from '../store/AppStore';
import { LIVE } from '../lib/cloud';
import { can } from '../lib/rules';
import { matches, searchClients, searchProjects, words } from '../lib/search';
import { StatusBadge, cx } from './ui';
import { celebrate } from './Confetti';

/** Other parts of the app open quick search by sending this event (e.g. the search button in the header). */
export const OPEN_QUICK_SEARCH = 'engtrack:quick-search';
export const openQuickSearch = () => window.dispatchEvent(new Event(OPEN_QUICK_SEARCH));

interface Item {
  id: string;
  group: 'Actions' | 'Projects' | 'Clients' | 'Go to';
  label: string;
  sub?: string;
  Icon: LucideIcon;
  aside?: ReactNode;
  run: () => void;
}

const PAGES: { page: Route['page']; label: string; Icon: LucideIcon; liveOnly?: boolean }[] = [
  { page: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { page: 'projects', label: 'Projects', Icon: FolderKanban },
  { page: 'timeline', label: 'Timeline', Icon: GanttChartSquare },
  { page: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { page: 'notifications', label: 'Notifications', Icon: Bell },
  { page: 'reports', label: 'Reports', Icon: BarChart3 },
  { page: 'clients', label: 'Clients', Icon: Building2 },
  { page: 'people', label: 'People and backups', Icon: Users, liveOnly: true },
];

export const typingIn = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

export function CommandPalette() {
  const { visibleAll, s, go, me } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !open && !typingIn(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_QUICK_SEARCH, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_QUICK_SEARCH, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setAt(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const close = (f: () => void) => () => {
      setOpen(false);
      f();
    };
    const q2 = words(q);
    const out: Item[] = [];
    if (can(me, 'create') && (!q2.length || matches(q2, 'new project create add'))) {
      out.push({ id: 'new', group: 'Actions', label: 'New project', sub: 'Create a project with its scopes', Icon: Plus, run: close(() => go({ page: 'new' })) });
    }
    if (q2.length && matches(q2, 'party confetti celebrate fun')) {
      out.push({ id: 'party', group: 'Actions', label: 'Throw a party', sub: 'Confetti. Because you deserve it.', Icon: PartyPopper, run: close(() => celebrate({ big: true })) });
    }
    if (q2.length) {
      for (const p of searchProjects(visibleAll, s.clients, q)) {
        const client = s.clients.find((c) => c.id === p.clientId)?.name;
        out.push({ id: `p:${p.id}`, group: 'Projects', label: p.name, sub: [p.number, client].filter(Boolean).join(' · '), Icon: FolderKanban, aside: <StatusBadge status={p.status} short />, run: close(() => go({ page: 'project', id: p.id })) });
      }
      for (const c of searchClients(s.clients, q)) {
        out.push({ id: `c:${c.id}`, group: 'Clients', label: c.name, sub: c.contact, Icon: Building2, run: close(() => go({ page: 'projects', filters: { clientId: c.id, showCompleted: true } })) });
      }
    }
    for (const pg of PAGES) {
      if (pg.liveOnly && !LIVE) continue;
      if (q2.length && !matches(q2, pg.label)) continue;
      out.push({ id: `g:${pg.page}`, group: 'Go to', label: pg.label, Icon: pg.Icon, run: close(() => go({ page: pg.page } as Route)) });
    }
    return out;
  }, [q, visibleAll, s.clients, me, go]);

  // Keep the highlighted row valid and in view.
  useEffect(() => setAt(0), [q]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${at}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [at]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAt((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAt((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[at]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[65] flex animate-fade items-start justify-center bg-[#14202b]/45 px-3 pt-[12vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Quick search" className="w-full max-w-[600px] animate-pop overflow-hidden rounded-2xl border border-line bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-ink-3" aria-hidden />
          <input
            autoFocus
            id="quick-search"
            role="combobox"
            aria-expanded
            aria-controls="quick-search-list"
            aria-activedescendant={items[at] ? `qs-${items[at].id}` : undefined}
            aria-label="Search projects, clients and screens"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search projects, clients, screens…"
            className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
            autoComplete="off"
          />
          <kbd className="hidden shrink-0 rounded border border-line-2 px-1.5 py-0.5 font-sans text-[11px] text-ink-3 sm:block">Esc</kbd>
        </div>
        <ul id="quick-search-list" role="listbox" ref={list} className="max-h-[min(420px,60vh)] overflow-auto p-2">
          {items.length === 0 && <li className="px-3 py-10 text-center text-[13.5px] text-ink-3">Nothing matches “{q.trim()}”.</li>}
          {items.map((it, i) => {
            const heading = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {heading && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3" aria-hidden>{heading}</p>}
                <div
                  id={`qs-${it.id}`}
                  role="option"
                  aria-selected={i === at}
                  data-index={i}
                  onMouseMove={() => setAt(i)}
                  onClick={it.run}
                  className={cx('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100', i === at ? 'bg-brand-50' : '')}
                >
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors', i === at ? 'bg-brand text-white' : 'bg-paper text-ink-2')}><it.Icon size={16} aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{it.label}</span>
                    {it.sub && <span className="block truncate text-[12px] text-ink-3">{it.sub}</span>}
                  </span>
                  {it.aside}
                  {i === at && <CornerDownLeft size={15} className="shrink-0 text-ink-3" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="hidden items-center gap-4 border-t border-line bg-paper px-4 py-2 text-[11.5px] text-ink-3 sm:flex">
          <span><kbd className="font-sans font-semibold">↑ ↓</kbd> to move</span>
          <span><kbd className="font-sans font-semibold">Enter</kbd> to open</span>
          <span className="ml-auto"><kbd className="font-sans font-semibold">Ctrl K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}

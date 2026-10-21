import { useState } from 'react';
import { BarChart3, Building2, CalendarDays, ChevronRight, LogOut, Mail, Pencil, Phone, Plus, Search, Users } from 'lucide-react';
import { LIVE } from '../lib/cloud';
import { signOut } from '../components/LiveGate';
import { PersonModal } from './People';
import { shortName, useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Avatar, Button, Card, Empty, StatusBadge } from '../components/ui';
import { ClientModal } from '../components/ClientModal';
import { can, canEditClient, isClosed } from '../lib/rules';
import type { Client } from '../types';

export function Clients() {
  const { s, me, visibleAll, go, isMobile } = useApp();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ client?: Client } | null>(null);
  const list = s.clients.filter((c) => [c.name, c.company ?? '', c.contact, c.email].some((v) => v.toLowerCase().includes(q.toLowerCase())));
  const projectsOf = (id: string) => visibleAll.filter((p) => p.clientId === id);
  const cur = s.clients.find((c) => c.id === sel);

  const search = (
    <label className="flex h-10 items-center gap-2 rounded-md border border-line-2 bg-white px-3">
      <Search size={16} className="text-ink-3" aria-hidden />
      <input id="client-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, contact or email" className="w-full bg-transparent text-[13.5px] outline-none" />
    </label>
  );

  const detail = cur && (
    <Card title={cur.name} aside={<><span>Sales: {shortName(cur.salesId)}</span>{canEditClient(me, cur) && <Button kind="ghost" className="h-7 px-2" id="client-edit" onClick={() => setForm({ client: cur })}><Pencil size={14} />Edit</Button>}</>}>
      <div className="grid gap-1.5 text-[13px] text-ink-2">
        {cur.company && <p className="text-[12.5px] text-ink-3">{cur.company}</p>}
        <p className="font-medium text-ink">{cur.contact}</p>
        <p className="flex items-center gap-2"><Mail size={14} aria-hidden /><span className="select-all">{cur.email}</span></p>
        <p className="flex items-center gap-2"><Phone size={14} aria-hidden /><span className="select-all">{cur.phone}</span></p>
        {cur.address && <p>{cur.address}</p>}
        {cur.notes && <p className="rounded-md bg-paper px-2.5 py-1.5 text-[12.5px]">{cur.notes}</p>}
      </div>
      <h4 className="mb-1 mt-4 text-[12px] font-semibold uppercase tracking-wider text-ink-3">Related projects</h4>
      {projectsOf(cur.id).length === 0 && <p className="text-[12.5px] text-ink-3">None that you can see.</p>}
      {projectsOf(cur.id).map((p) => (
        <button key={p.id} onClick={() => go({ page: 'project', id: p.id })} className="flex w-full items-center gap-2 border-b border-line py-2 text-left last:border-0 hover:bg-paper">
          <span className="font-mono text-[11.5px] text-ink-2">{p.number}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{p.name}</span>
          <StatusBadge status={p.status} short />
        </button>
      ))}
    </Card>
  );

  const addBtn = can(me, 'addClient') && <Button kind="primary" id="client-add" className={isMobile ? 'h-10' : ''} onClick={() => setForm({})}><Plus size={16} />Add client</Button>;

  return (
    <div className={isMobile ? 'grid gap-3 p-4' : 'grid gap-4 p-6'}>
      {form && <ClientModal client={form.client} onClose={() => setForm(null)} onSaved={(c) => { setSel(c.id); setQ(''); }} />}
      {isMobile ? (
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[20px] font-semibold text-ink">Clients</h1>
          {addBtn}
        </div>
      ) : <PageHead title="Clients" sub={LIVE ? `${s.clients.length} clients` : `${s.clients.length} clients · fictional demo records`} actions={addBtn} />}
      <div className={isMobile ? 'grid gap-3' : 'grid grid-cols-[minmax(0,1fr)_420px] items-start gap-4'}>
        <div className="grid gap-3">
          {search}
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            {list.length === 0 && <Empty title="No clients match" />}
            {list.map((c) => {
              const ps = projectsOf(c.id);
              return (
                <button key={c.id} onClick={() => setSel(c.id === sel ? null : c.id)} aria-expanded={c.id === sel} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-[#fdf6f9]">
                  <Avatar name={c.name} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
                    <span className="block truncate text-[12px] text-ink-3">{c.contact} · {c.phone}</span>
                  </span>
                  <span className="text-right text-[12px] text-ink-2"><b className="text-ink">{ps.filter((p) => !isClosed(p.status)).length}</b> open<br /><span className="text-ink-3">{ps.length} total</span></span>
                  <ChevronRight size={16} className="text-ink-3" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
        {isMobile ? cur && detail : detail ?? <Card><p className="py-8 text-center text-[13px] text-ink-3">Select a client to see contact details and related projects.</p></Card>}
      </div>
    </div>
  );
}

export function More() {
  const { go, me, users, dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const links = [
    { page: 'calendar', label: 'Calendar', Icon: CalendarDays },
    { page: 'reports', label: 'Reports', Icon: BarChart3 },
    { page: 'clients', label: 'Clients', Icon: Building2 },
    ...(LIVE ? [{ page: 'people', label: 'People', Icon: Users }] as const : []),
  ] as const;
  return (
    <div className="grid gap-3 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
        <Avatar name={me.name} size={44} />
        <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-ink">{me.name}</p><p className="truncate text-[12.5px] text-ink-3">{LIVE ? me.email : `${me.role} · ${me.email}`}</p></div>
        {LIVE && <Button id="more-edit-name" onClick={() => setEditing(true)}><Pencil size={14} />Edit name</Button>}
      </div>
      {editing && <PersonModal person={users.find((u) => u.id === me.id)} onClose={() => setEditing(false)} />}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {links.map(({ page, label, Icon }) => (
          <button key={page} onClick={() => go({ page })} className="flex min-h-[52px] w-full items-center gap-3 border-b border-line px-4 text-left text-[14.5px] text-ink last:border-0">
            <Icon size={20} className="text-ink-2" aria-hidden />{label}<ChevronRight size={18} className="ml-auto text-ink-3" aria-hidden />
          </button>
        ))}
      </div>
      {LIVE ? (
        <button onClick={() => void signOut()} className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-line bg-white px-4 text-left text-[14.5px] text-ink"><LogOut size={20} className="text-ink-2" aria-hidden />Sign out</button>
      ) : (
      <label className="grid gap-1 rounded-xl border border-[#f1d58f] bg-[#fdf4dd] p-4 text-[12.5px] text-[#5c3d00]">
        <span className="font-semibold">Prototype: view as another person</span>
        <select id="more-viewas" className="h-11 rounded-md border border-[#e3c26d] bg-white px-2 text-[14px] text-ink" value={me.id} onChange={(e) => dispatch({ t: 'user', id: e.target.value })}>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
        </select>
      </label>
      )}
    </div>
  );
}

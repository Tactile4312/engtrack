import { useState, type ChangeEvent } from 'react';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Avatar, Button, Card, cx } from '../components/ui';
import { makeBackup, parseBackup, type Backup } from '../lib/backup';
import { LIVE } from '../lib/cloud';
import { fmt } from '../lib/dates';
import { download } from '../lib/exporting';
import { PersonModal, TITLES } from '../components/PersonModal';
import type { User } from '../types';

/** Adds the sample projects, clients and people back (People page only). */
function AddSampleData() {
  const { dispatch } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-4 text-[13px] text-ink-2">
      <p className="min-w-0 flex-1">Want sample projects to try things out? They can be removed again in one step.</p>
      <Button id="demo-add" onClick={() => dispatch({ t: 'addDemo' })}><Plus size={15} />Add sample data</Button>
    </div>
  );
}

/** Banner and button for removing the sample records added on first sign-in. */
export function RemoveSampleData({ compact }: { compact?: boolean }) {
  const { s, dispatch } = useApp();
  const [sure, setSure] = useState(false);
  if (!s.demo) return null;
  const n = s.demo.projects.filter((id) => s.projects.some((p) => p.id === id)).length;
  return (
    <div className={cx('flex flex-wrap items-center gap-3 rounded-lg border border-[#f1d58f] bg-[#fdf4dd] text-[13px] text-[#5c3d00]', compact ? 'px-3 py-2' : 'p-4')}>
      <p className="min-w-0 flex-1">
        {sure
          ? `Remove the ${n} sample projects and the sample clients and people? Your own records stay. This cannot be undone.`
          : 'The sample projects, clients and people are still here. Remove them when you have added your own.'}
      </p>
      {sure ? (
        <>
          <Button onClick={() => setSure(false)}>Keep them</Button>
          <Button kind="primary" id="demo-remove-confirm" className="!border-crit !bg-crit" onClick={() => dispatch({ t: 'removeDemo' })}><Trash2 size={15} />Remove sample data</Button>
        </>
      ) : (
        <Button id="demo-remove" onClick={() => setSure(true)}><Trash2 size={15} />Remove sample data</Button>
      )}
    </div>
  );
}

const BACKUP_DUE_DAYS = 7;

/** Download all data as a file, or replace all data from one. The app has no automatic backups on the free database. */
function BackupCard() {
  const { s, dispatch, me, today } = useApp();
  const [error, setError] = useState('');
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null);

  const due = !s.lastBackup || Date.now() - new Date(s.lastBackup).getTime() > BACKUP_DUE_DAYS * 86400000;

  const backUp = () => {
    setError('');
    const at = new Date().toISOString();
    const text = JSON.stringify(makeBackup(s, at), null, 2);
    if (download(`engtrack-backup-${today}.json`, text, 'application/json')) dispatch({ t: 'backedUp', at });
    else setError('This browser blocked the download. Try again in a normal browser tab.');
  };

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setPendingRestore(null);
    try {
      setPendingRestore(parseBackup(await file.text(), me.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This file could not be read.');
    }
  };

  return (
    <Card title="Backup" aside={<span>{s.lastBackup ? `Last: ${fmt(s.lastBackup.slice(0, 10), true)}` : 'None yet'}</span>}>
      <p className="text-[13px] text-ink-2">Download a copy of all your projects, clients and people. Keep it somewhere safe, such as a cloud drive.</p>
      {due && <p className="mt-2 rounded-md border border-[#f1d58f] bg-[#fdf4dd] px-3 py-2 text-[12.5px] text-[#5c3d00]" id="backup-due">{s.lastBackup ? `Your last backup is more than ${BACKUP_DUE_DAYS} days old.` : 'You have not downloaded a backup yet.'}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button kind="primary" id="backup-download" onClick={backUp}><Download size={15} />Download backup</Button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line-2 bg-white px-3 text-[13px] font-medium text-ink hover:bg-paper focus-within:ring-2 focus-within:ring-brand">
          <Upload size={15} aria-hidden />Restore from file
          <input id="backup-file" type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void choose(e)} />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-crit bg-crit-50 px-3 py-2 text-[13px] text-crit">{error}</p>}
      {pendingRestore && (
        <div className="mt-3 grid gap-2 rounded-md border border-crit bg-crit-50 p-3 text-[13px] text-ink" role="alert">
          <p>Replace everything in EngTrack with this backup from <b>{fmt(pendingRestore.exportedAt.slice(0, 10), true)}</b>? It has {pendingRestore.projects.length} projects, {pendingRestore.clients.length} clients and {pendingRestore.people.length} people. Anything added since then will be lost, so download a backup first if you are unsure.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPendingRestore(null)}>Cancel</Button>
            <Button kind="primary" id="backup-restore-confirm" className="!border-crit !bg-crit" onClick={() => { dispatch({ t: 'restore', backup: pendingRestore }); setPendingRestore(null); }}>Replace my data</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function People() {
  const { s, me, dispatch, isMobile } = useApp();
  const [form, setForm] = useState<{ person?: User } | null>(null);
  const [blocked, setBlocked] = useState('');

  const inUse = (id: string) =>
    s.clients.some((c) => c.salesId === id) ||
    s.projects.some((p) => p.salesId === id || p.pmId === id || p.scopes.some((x) => x.engineerId === id) || p.tasks.some((t) => t.assigneeId === id));

  const remove = (u: User) => {
    if (inUse(u.id)) return setBlocked(`${u.name} is still assigned to projects, scopes, tasks or clients. Reassign those first.`);
    setBlocked('');
    dispatch({ t: 'unperson', id: u.id });
  };

  const groups = TITLES.map((t) => ({ title: t, list: s.people.filter((u) => (u.role === 'Administrator' ? 'Project Manager' : u.role) === t) }));
  const addBtn = <Button kind="primary" id="person-add" onClick={() => setForm({})}><Plus size={16} />Add person</Button>;

  return (
    <div className={isMobile ? 'grid gap-3 p-4' : 'grid max-w-[900px] gap-4 p-6'}>
      {form && <PersonModal person={form.person} onClose={() => setForm(null)} />}
      <PageHead title="People" sub="Names you can assign as engineer, project manager or salesperson. Only you can sign in." actions={addBtn} />
      {LIVE && <BackupCard />}
      {s.demo ? <RemoveSampleData /> : <AddSampleData />}
      {blocked && <p role="alert" className="rounded-md border border-crit bg-crit-50 px-3 py-2 text-[13px] text-crit">{blocked}</p>}
      {groups.map(({ title, list }) => (
        <Card key={title} title={title === 'Salesperson' ? 'Salespeople' : `${title}s`} aside={<span>{list.length}</span>}>
          {list.length === 0 && <p className="text-[13px] text-ink-3">No one yet.</p>}
          {list.map((u) => (
            <div key={u.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
              <Avatar name={u.name} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-ink">{u.name}{u.id === me.id && <span className="ml-2 rounded bg-brand-100 px-1.5 text-[11px] font-semibold text-brand">You</span>}</span>
                {u.email && <span className="block truncate text-[12px] text-ink-3">{u.email}</span>}
              </span>
              <Button kind="ghost" className="h-8 px-2" aria-label={`Edit ${u.name}`} onClick={() => setForm({ person: u })}><Pencil size={14} /></Button>
              {u.id !== me.id && <Button kind="ghost" className="h-8 px-2" aria-label={`Remove ${u.name}`} onClick={() => remove(u)}><Trash2 size={14} /></Button>}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

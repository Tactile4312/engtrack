import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Avatar, Button, Card, Field, Modal, cx, inputCls } from '../components/ui';
import type { Role, User } from '../types';

// Job titles offered when adding a person. They decide which pickers a name appears in
// (engineer, project manager, salesperson); in this single-user version they grant no access.
const TITLES: Role[] = ['Engineer', 'Project Manager', 'Salesperson'];

const uid = () => Math.random().toString(36).slice(2, 9);

export function PersonModal({ person, onClose }: { person?: User; onClose: () => void }) {
  const { s, me, dispatch } = useApp();
  const [name, setName] = useState(person?.name ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [role, setRole] = useState<Role>(person?.role === 'Administrator' ? 'Project Manager' : person?.role ?? 'Engineer');
  const [error, setError] = useState('');

  const save = () => {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return setError('Enter a name.');
    if (s.people.some((u) => u.id !== person?.id && u.name.toLowerCase() === n.toLowerCase())) return setError('Someone with this name is already on the list.');
    dispatch({ t: 'person', person: { id: person?.id ?? `u-${uid()}`, name: n, email: email.trim(), role }, isNew: !person });
    onClose();
  };

  return (
    <Modal
      title={person ? `Edit ${person.name}` : 'Add person'}
      onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" id="pf-save" onClick={save}>{person ? 'Save changes' : 'Add person'}</Button></>}
    >
      <div className="grid gap-3">
        <Field label="Name" required htmlFor="pf-name" error={error || undefined}>
          <input id="pf-name" className={inputCls(error || undefined)} value={name} onChange={(e) => { setName(e.target.value); setError(''); }} autoComplete="off" />
        </Field>
        <Field label="Job title" htmlFor="pf-role" hint={person?.id === me.id ? 'You are offered in every list anyway.' : 'Decides which lists this name appears in.'}>
          <select id="pf-role" className={inputCls()} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {TITLES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Email" htmlFor="pf-email">
          <input id="pf-email" type="email" className={inputCls()} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
      </div>
    </Modal>
  );
}

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

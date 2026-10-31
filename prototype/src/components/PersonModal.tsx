import { useState } from 'react';
import { useApp } from '../store/AppStore';
import { Button, Field, Modal, inputCls } from './ui';
import { uid } from '../lib/ids';
import type { Role, User } from '../types';

// Job titles offered when adding a person. They decide which pickers a name appears in
// (engineer, project manager, salesperson); in this single-user version they grant no access.
export const TITLES: Role[] = ['Engineer', 'Project Manager', 'Salesperson'];

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

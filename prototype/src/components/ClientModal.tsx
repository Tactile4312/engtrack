import { useState } from 'react';
import { useApp } from '../store/AppStore';
import { Button, Field, Modal, cx, inputCls } from './ui';
import { validateClient, type ClientDraft, type Errors } from '../lib/validation';
import type { Client } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);

/** Add or edit a client. Calls onSaved with the stored record. */
export function ClientModal({ client, onClose, onSaved }: { client?: Client; onClose: () => void; onSaved?: (c: Client) => void }) {
  const { s, me, peopleIn, dispatch, isMobile } = useApp();
  const isSales = me.role === 'Salesperson';
  const [d, setD] = useState<ClientDraft>(() => client
    ? { name: client.name, company: client.company ?? '', contact: client.contact, email: client.email, phone: client.phone, address: client.address, notes: client.notes, salesId: client.salesId }
    : { name: '', company: '', contact: '', email: '', phone: '', address: '', notes: '', salesId: isSales ? me.id : '' });
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const sales = peopleIn('Salesperson');

  const set = (patch: Partial<ClientDraft>) => {
    const next = { ...d, ...patch };
    setD(next);
    if (tried) setErrors(validateClient(next, s.clients, client?.id));
  };

  const save = () => {
    setTried(true);
    const e = validateClient(d, s.clients, client?.id);
    setErrors(e);
    if (Object.keys(e).length) return;
    const saved: Client = {
      id: client?.id ?? `c-${uid()}`,
      name: d.name.trim().replace(/\s+/g, ' '), company: d.company?.trim() || undefined, contact: d.contact.trim(),
      email: d.email.trim(), phone: d.phone.trim(), address: d.address.trim(), notes: d.notes.trim(), salesId: d.salesId,
    };
    dispatch({ t: 'client', client: saved, isNew: !client });
    onSaved?.(saved);
    onClose();
  };

  const text = (key: 'name' | 'company' | 'contact' | 'email' | 'phone' | 'address', label: string, opts: { required?: boolean; type?: string; placeholder?: string; hint?: string } = {}) => (
    <Field label={label} required={opts.required} htmlFor={`cf-${key}`} error={errors[key]} hint={opts.hint}>
      <input id={`cf-${key}`} type={opts.type ?? 'text'} className={inputCls(errors[key])} value={d[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} placeholder={opts.placeholder} autoComplete="off" />
    </Field>
  );

  return (
    <Modal
      title={client ? `Edit ${client.name}` : 'Add client'}
      onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button kind="primary" onClick={save} id="cf-save">{client ? 'Save changes' : 'Add client'}</Button></>}
    >
      <div className="grid gap-3">
        {text('name', 'Client name', { required: true, placeholder: 'e.g. Eastport Terminals' })}
        {text('company', 'Company name', { hint: 'Registered name, if different from the client name.' })}
        {text('contact', 'Contact person', { required: true })}
        <div className={cx('grid gap-3', !isMobile && 'grid-cols-2')}>
          {text('email', 'Email', { required: true, type: 'email', placeholder: 'name@company.com' })}
          {text('phone', 'Phone number', { required: true, type: 'tel', placeholder: '+63 917 000 0000' })}
        </div>
        {text('address', 'Address')}
        <Field label="Salesperson" required htmlFor="cf-sales" error={errors.salesId} hint={isSales ? 'Clients you add are assigned to you.' : 'Decides which salesperson sees this client’s projects.'}>
          <select id="cf-sales" className={inputCls(errors.salesId)} value={d.salesId} onChange={(e) => set({ salesId: e.target.value })} disabled={isSales}>
            <option value="">Choose…</option>{sales.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Notes" htmlFor="cf-notes">
          <textarea id="cf-notes" className={cx(inputCls(), 'h-20 py-2')} value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Site access rules, reporting preferences" />
        </Field>
        <p className="text-[11.5px] text-ink-3">Prototype: the new client is kept until the page is reloaded.</p>
      </div>
    </Modal>
  );
}

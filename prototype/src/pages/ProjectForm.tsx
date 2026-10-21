import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useApp } from '../store/AppStore';
import { PageHead } from '../components/Shell';
import { Button, Card, Field, cx, inputCls } from '../components/ui';
import { ClientModal } from '../components/ClientModal';
import { validateProject, type Errors, type ProjectDraft, type ScopeDraft } from '../lib/validation';
import { can, nextFreeNumber } from '../lib/rules';
import { DEFAULT_MILESTONES, PRIORITIES, SCOPE_TYPES, STATUSES, type Priority, type Project, type Scope, type ScopeType, type Status } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);
const NEW_CLIENT = '__new';

export function ProjectForm({ editId, copyFrom }: { editId?: string; copyFrom?: string }) {
  const { s, me, peopleIn, go, dispatch, today, isMobile, visibleAll } = useApp();
  const editing = editId ? visibleAll.find((p) => p.id === editId) : undefined;
  const source = editing ?? (copyFrom ? visibleAll.find((p) => p.id === copyFrom) : undefined);
  const isSales = me.role === 'Salesperson';
  const suggestion = useMemo(() => nextFreeNumber(s.projects, Number(today.slice(0, 4))), [s.projects, today]);

  const [d, setD] = useState<ProjectDraft>(() => {
    if (source) {
      return {
        number: editing ? source.number : '',
        name: editing ? source.name : `${source.name} (copy)`,
        clientId: source.clientId, description: source.description, requested: editing ? source.requested : today,
        start: source.start ?? '', due: source.due, priority: source.priority, status: editing ? source.status : 'New Request',
        salesId: source.salesId, pmId: source.pmId,
        scopes: source.scopes.map((x) => ({ id: editing ? x.id : undefined, type: x.type, engineerId: x.engineerId ?? '', start: x.start ?? '', due: x.due ?? '', priority: x.priority })),
      };
    }
    return {
      number: '', name: '', clientId: '', description: '', requested: today, start: '', due: '', priority: 'Normal', status: 'New Request',
      salesId: isSales ? me.id : '', pmId: me.role === 'Project Manager' ? me.id : '', scopes: [],
    };
  });
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [addClient, setAddClient] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  if (!can(me, editing ? 'edit' : 'create', editing)) {
    return <div className="p-6 text-[13.5px] text-ink-2">Your role cannot {editing ? 'edit' : 'create'} projects. <button className="text-brand underline" onClick={() => go({ page: 'projects' })}>Back to projects</button></div>;
  }

  const set = (patch: Partial<ProjectDraft>) => {
    const next = { ...d, ...patch };
    setD(next);
    if (tried) setErrors(validateProject(next, s.projects, editing?.id));
  };
  const toggleScope = (t: ScopeType) => {
    const has = d.scopes.some((x) => x.type === t);
    set({ scopes: has ? d.scopes.filter((x) => x.type !== t) : [...d.scopes, { type: t, engineerId: '', start: d.start, due: d.due, priority: d.priority }].sort((a, b) => SCOPE_TYPES.indexOf(a.type) - SCOPE_TYPES.indexOf(b.type)) });
  };
  const setScope = (t: ScopeType, patch: Partial<ScopeDraft>) => set({ scopes: d.scopes.map((x) => (x.type === t ? { ...x, ...patch } : x)) });

  const submit = () => {
    setTried(true);
    const e = validateProject(d, s.projects, editing?.id);
    setErrors(e);
    if (Object.keys(e).length) {
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const at = new Date().toISOString();
    const number = d.number.trim().toUpperCase();
    const scopes: Scope[] = d.scopes.map((x) => {
      const old = editing?.scopes.find((o) => o.id === x.id || o.type === x.type);
      return {
        id: old?.id ?? uid(), type: x.type, engineerId: x.engineerId || null, description: old?.description ?? '', requested: null,
        start: x.start || null, due: x.due || null, priority: x.priority, status: old?.status ?? (d.status === 'New Request' ? 'New Request' : 'For Review'),
        progress: old?.progress ?? 0, dependsOn: old?.dependsOn ?? [], notes: old?.notes ?? '', completed: old?.completed ?? null,
      };
    });
    let project: Project;
    if (editing) {
      const changes: { action: string; from?: string; to?: string }[] = [];
      if (editing.due !== d.due) changes.push({ action: 'Due date changed', from: editing.due, to: d.due });
      if (editing.status !== d.status) changes.push({ action: 'Status changed', from: editing.status, to: d.status });
      if (editing.number !== number) changes.push({ action: 'Project number changed', from: editing.number, to: number });
      const added = scopes.filter((x) => !editing.scopes.some((o) => o.type === x.type)).map((x) => x.type);
      const removed = editing.scopes.filter((o) => !scopes.some((x) => x.type === o.type)).map((o) => o.type);
      if (added.length) changes.push({ action: 'Scope added', to: added.join(', ') });
      if (removed.length) changes.push({ action: 'Scope removed', from: removed.join(', ') });
      changes.push({ action: 'Project edited' });
      project = {
        ...editing, number, name: d.name.trim(), clientId: d.clientId, description: d.description, requested: d.requested, start: d.start || null, due: d.due,
        plannedFinish: editing.plannedFinish && editing.plannedFinish <= d.due ? editing.plannedFinish : d.due, priority: d.priority, status: d.status,
        salesId: d.salesId, pmId: d.pmId, scopes, updatedAt: at, updatedBy: me.id,
        activity: [...changes.map((c) => ({ id: uid(), at, userId: me.id, ...c })), ...editing.activity],
      };
    } else {
      project = {
        id: number, number, name: d.name.trim(), clientId: d.clientId, description: d.description, createdAt: at, createdBy: me.id, updatedAt: at, updatedBy: me.id,
        salesId: d.salesId, pmId: d.pmId, requested: d.requested, start: d.start || null, due: d.due, plannedFinish: d.due, actualFinish: null,
        priority: d.priority, status: isSales ? 'New Request' : d.status, archived: false, scopes, tasks: [], notes: [], attachments: [],
        milestones: DEFAULT_MILESTONES.map((name, i) => ({ id: uid(), name, date: i === 0 ? d.requested : i === DEFAULT_MILESTONES.length - 1 ? d.due : null, done: i === 0 })),
        activity: [{ id: uid(), at, userId: me.id, action: copyFrom ? `Project created (copied from ${source?.number})` : 'Project created' }],
      };
    }
    dispatch({ t: 'save', project, isNew: !editing });
    go({ page: 'project', id: project.id });
  };

  const errCount = Object.keys(errors).length;
  const pms = peopleIn('Project Manager');
  const engineers = peopleIn('Engineer');
  const sales = peopleIn('Salesperson');
  const title = editing ? `Edit ${editing.number}` : copyFrom ? 'Duplicate project' : isSales ? 'New project request' : 'Create project';

  const sec1 = (
    <Card title="1 · Project information">
      <div className={cx('grid gap-3', !isMobile && 'grid-cols-[220px_1fr]')}>
        <Field label="Project number" required htmlFor="pf-number" error={errors.number} hint={<>Format CRM-YYYY-NNNN. Next free: <button type="button" className="font-mono text-brand underline" onClick={() => set({ number: suggestion })}>{suggestion}</button></>}>
          <input id="pf-number" className={cx(inputCls(errors.number), 'font-mono uppercase')} value={d.number} onChange={(e) => set({ number: e.target.value })} placeholder="CRM-2026-0000" autoComplete="off" />
        </Field>
        <Field label="Project name" required htmlFor="pf-name" error={errors.name}>
          <input id="pf-name" className={inputCls(errors.name)} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Flare Stack Replacement Lift" />
        </Field>
        <div className={cx(!isMobile && 'col-span-2')}>
          <Field label="Client" required htmlFor="pf-client" error={errors.clientId}>
            <select id="pf-client" className={inputCls(errors.clientId)} value={d.clientId} onChange={(e) => (e.target.value === NEW_CLIENT ? setAddClient(true) : set({ clientId: e.target.value }))}>
              <option value="">Choose a client…</option>
              {s.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {can(me, 'addClient') && <option value={NEW_CLIENT}>+ New client…</option>}
            </select>
          </Field>
          {addClient && <ClientModal onClose={() => setAddClient(false)} onSaved={(c) => set({ clientId: c.id })} />}
        </div>
        <div className={cx(!isMobile && 'col-span-2')}>
          <Field label="Description" htmlFor="pf-desc">
            <textarea id="pf-desc" className={cx(inputCls(), 'h-20 py-2')} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Scope of work, site, special conditions" />
          </Field>
        </div>
      </div>
    </Card>
  );

  const sec2 = (
    <Card title="2 · Engineering scope" aside={<span>tick one or more</span>}>
      {errors.scopes && <p className="mb-2 flex items-center gap-1 text-[12px] font-medium text-crit-700" role="alert"><AlertTriangle size={13} />{errors.scopes}</p>}
      <div className={cx('grid gap-2', isMobile ? 'grid-cols-2' : 'grid-cols-3')}>
        {SCOPE_TYPES.map((t) => {
          const on = d.scopes.some((x) => x.type === t);
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => toggleScope(t)} className={cx('flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-left text-[13px]', on ? 'border-brand bg-brand-50 font-medium text-ink' : 'border-line-2 bg-white text-ink-2 hover:bg-paper')}>
              <span className={cx('grid h-4 w-4 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line-2')}>{on && <Check size={12} strokeWidth={3} />}</span>
              {t}
            </button>
          );
        })}
      </div>
      {d.scopes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12.5px] font-medium text-ink">Details for each selected scope</p>
          <div className="grid gap-2">
            {d.scopes.map((x) => (
              <div key={x.type} className={cx('grid gap-2 rounded-md border bg-paper p-2.5', errors[`scope:${x.type}`] ? 'border-crit' : 'border-line', isMobile ? 'grid-cols-2' : 'grid-cols-[130px_1fr_130px_130px_100px] items-end')}>
                <b className={cx('text-[13px] font-semibold text-ink', isMobile ? 'col-span-2' : 'pb-2.5')}>{x.type}</b>
                <label className="grid gap-0.5 text-[11.5px] text-ink-3">Engineer
                  {isSales ? <span className="h-10 py-2.5 text-[12.5px] text-ink-2">Assigned by the PM</span> : (
                    <select className={cx(inputCls(), 'h-10')} value={x.engineerId} onChange={(e) => setScope(x.type, { engineerId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  )}
                </label>
                <label className="grid gap-0.5 text-[11.5px] text-ink-3">Start<input type="date" className={cx(inputCls(), 'h-10')} value={x.start} onChange={(e) => setScope(x.type, { start: e.target.value })} /></label>
                <label className="grid gap-0.5 text-[11.5px] text-ink-3">Due<input type="date" className={cx(inputCls(errors[`scope:${x.type}`]), 'h-10')} value={x.due} onChange={(e) => setScope(x.type, { due: e.target.value })} /></label>
                <label className="grid gap-0.5 text-[11.5px] text-ink-3">Priority
                  <select className={cx(inputCls(), 'h-10')} value={x.priority} onChange={(e) => setScope(x.type, { priority: e.target.value as Priority })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
                </label>
                {errors[`scope:${x.type}`] && <p className="col-span-full text-[12px] font-medium text-crit-700" role="alert">{errors[`scope:${x.type}`]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const sec3 = (
    <Card title="3 · Scheduling">
      <div className={cx('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
        <Field label="Date requested" required htmlFor="pf-req" error={errors.requested}><input id="pf-req" type="date" className={inputCls(errors.requested)} value={d.requested} onChange={(e) => set({ requested: e.target.value })} /></Field>
        <Field label="Start date" htmlFor="pf-start" error={errors.start}><input id="pf-start" type="date" className={inputCls(errors.start)} value={d.start} onChange={(e) => set({ start: e.target.value })} /></Field>
        <Field label="Due date" required htmlFor="pf-due" error={errors.due}><input id="pf-due" type="date" className={inputCls(errors.due)} value={d.due} onChange={(e) => set({ due: e.target.value })} /></Field>
        <Field label="Priority" htmlFor="pf-pri"><select id="pf-pri" className={inputCls()} value={d.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        {editing && (
          <Field label="Status" htmlFor="pf-status"><select id="pf-status" className={inputCls()} value={d.status} onChange={(e) => set({ status: e.target.value as Status })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        )}
      </div>
    </Card>
  );

  const sec4 = (
    <Card title="4 · Assignments">
      <div className={cx('grid gap-3', !isMobile && 'grid-cols-2')}>
        <Field label="Salesperson" required htmlFor="pf-sales" error={errors.salesId}>
          <select id="pf-sales" className={inputCls(errors.salesId)} value={d.salesId} onChange={(e) => set({ salesId: e.target.value })} disabled={isSales}>
            <option value="">Choose…</option>{sales.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Project manager" required htmlFor="pf-pm" error={errors.pmId}>
          <select id="pf-pm" className={inputCls(errors.pmId)} value={d.pmId} onChange={(e) => set({ pmId: e.target.value })}>
            <option value="">Choose…</option>{pms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <p className="mt-2 text-[12px] text-ink-3">Engineers are assigned per scope in section 2.{!editing && ' The default milestones are added automatically.'}</p>
    </Card>
  );

  const banner = tried && errCount > 0 && (
    <div className="flex items-center gap-2 rounded-lg border-2 border-crit bg-crit-50 px-4 py-2.5 text-[13px] font-medium text-crit-700" role="alert">
      <AlertTriangle size={16} />{errCount} field{errCount > 1 ? 's need' : ' needs'} attention before this project can be saved.
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-full flex-col" ref={top}>
        <div className="grid gap-3 p-4">
          <h1 className="text-[19px] font-semibold text-ink">{title}</h1>
          {banner}{sec1}{sec2}{sec3}{sec4}
        </div>
        <div className="sticky bottom-0 mt-auto grid grid-cols-[1fr_1.5fr] gap-2 border-t border-line bg-white p-3">
          <Button className="h-12" onClick={() => go(editing ? { page: 'project', id: editing.id } : { page: 'projects' })}>Cancel</Button>
          <Button kind="primary" className="h-12" onClick={submit}>{editing ? 'Save changes' : isSales ? 'Submit request' : 'Create project'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6" ref={top}>
      <PageHead
        title={title}
        sub={isSales ? 'Your request goes to the project managers for review.' : 'Fields marked * are required.'}
        actions={<><Button onClick={() => go(editing ? { page: 'project', id: editing.id } : { page: 'projects' })}>Cancel</Button><Button kind="primary" onClick={submit}>{editing ? 'Save changes' : isSales ? 'Submit request' : 'Create project'}</Button></>}
      />
      {banner}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid content-start gap-4">{sec1}{sec3}{sec4}</div>
        <div className="grid content-start gap-4">{sec2}</div>
      </div>
    </div>
  );
}

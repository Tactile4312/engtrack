// Add, edit and remove a project's tasks and milestones. Ticking them off happens on the project page itself.
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { uid } from '../lib/ids';
import { PLAN_NAME_MAX, validateMilestone, validateTask, type Errors, type MilestoneDraft, type TaskDraft } from '../lib/validation';
import { useApp } from '../store/AppStore';
import type { Milestone, Project, Task, User } from '../types';
import { Button, Field, Modal, cx, inputCls } from './ui';

/** Footer with Save/Cancel, plus Remove (asked twice) when editing an existing item. */
function Footer({ what, editing, onSave, onRemove, onClose }: { what: string; editing: boolean; onSave: () => void; onRemove: () => void; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <>
        <span className="mr-auto self-center text-[13px] font-medium text-crit-700" role="alert">Remove this {what}? This can’t be undone.</span>
        <Button onClick={() => setConfirming(false)}>Keep</Button>
        <Button kind="danger" onClick={onRemove} id="plan-remove-confirm">Remove</Button>
      </>
    );
  }
  return (
    <>
      {editing && <Button className="mr-auto" onClick={() => setConfirming(true)} id="plan-remove"><Trash2 size={14} />Remove</Button>}
      <Button onClick={onClose}>Cancel</Button>
      <Button kind="primary" onClick={onSave} id="plan-save">{editing ? 'Save changes' : `Add ${what}`}</Button>
    </>
  );
}

/** The usual validate-on-save, then live re-check after the first try. */
function useDraft<D>(start: () => D, check: (d: D) => Errors) {
  const [d, setD] = useState<D>(start);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<D>) => {
    const next = { ...d, ...patch };
    setD(next);
    if (tried) setErrors(check(next));
  };
  /** Returns true when the draft is valid. */
  const ok = () => {
    setTried(true);
    const e = check(d);
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return { d, set, errors, ok };
}

function NameField({ id, label, value, error, placeholder, onChange }: { id: string; label: string; value: string; error?: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <Field label={label} required htmlFor={id} error={error}>
      <input id={id} className={inputCls(error)} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={PLAN_NAME_MAX + 20} autoComplete="off" autoFocus />
    </Field>
  );
}

const unique = (list: User[]) => [...new Map(list.map((u) => [u.id, u])).values()];

export function TaskModal({ p, task, onClose }: { p: Project; task?: Task; onClose: () => void }) {
  const { dispatch, peopleIn, isMobile } = useApp();
  const { d, set, errors, ok } = useDraft<TaskDraft>(
    () => ({ name: task?.name ?? '', scopeId: task?.scopeId ?? '', assigneeId: task?.assigneeId ?? '', due: task?.due ?? '' }),
    (x) => validateTask(x, p),
  );
  const people = unique([...peopleIn('Engineer'), ...peopleIn('Project Manager')]);

  // Choosing a scope suggests its engineer, unless someone is already picked.
  const chooseScope = (scopeId: string) => {
    const engineer = p.scopes.find((s) => s.id === scopeId)?.engineerId;
    set(!d.assigneeId && engineer ? { scopeId, assigneeId: engineer } : { scopeId });
  };

  const save = () => {
    if (!ok()) return;
    const saved: Task = {
      id: task?.id ?? `t-${uid()}`, name: d.name.trim().replace(/\s+/g, ' '), scopeId: d.scopeId || null, assigneeId: d.assigneeId || null,
      due: d.due || null, done: task?.done ?? false, completed: task?.completed ?? null,
    };
    dispatch({ t: 'saveTask', projectId: p.id, task: saved, isNew: !task });
    onClose();
  };

  return (
    <Modal
      title={task ? 'Edit task' : 'Add task'}
      onClose={onClose}
      footer={<Footer what="task" editing={!!task} onSave={save} onClose={onClose} onRemove={() => { dispatch({ t: 'removeTask', projectId: p.id, taskId: task!.id }); onClose(); }} />}
    >
      <div className="grid gap-3">
        <NameField id="task-name" label="Task" value={d.name} error={errors.name} placeholder="e.g. Ground bearing check against GBP data" onChange={(name) => set({ name })} />
        <Field label="Part of" htmlFor="task-scope" error={errors.scopeId}>
          <select id="task-scope" className={inputCls(errors.scopeId)} value={d.scopeId} onChange={(e) => chooseScope(e.target.value)}>
            <option value="">Whole project</option>
            {p.scopes.map((s) => <option key={s.id} value={s.id}>{s.type}</option>)}
          </select>
        </Field>
        <div className={cx('grid gap-3', !isMobile && 'grid-cols-2')}>
          <Field label="Assigned to" htmlFor="task-assignee">
            <select id="task-assignee" className={inputCls()} value={d.assigneeId} onChange={(e) => set({ assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {people.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Due date" htmlFor="task-due" error={errors.due}>
            <input id="task-due" type="date" className={inputCls(errors.due)} value={d.due} max={p.due} onChange={(e) => set({ due: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export function MilestoneModal({ p, milestone, onClose }: { p: Project; milestone?: Milestone; onClose: () => void }) {
  const { dispatch } = useApp();
  const { d, set, errors, ok } = useDraft<MilestoneDraft>(
    () => ({ name: milestone?.name ?? '', date: milestone?.date ?? '' }),
    (x) => validateMilestone(x, p, milestone?.id),
  );

  const save = () => {
    if (!ok()) return;
    const saved: Milestone = { id: milestone?.id ?? `m-${uid()}`, name: d.name.trim().replace(/\s+/g, ' '), date: d.date || null, done: milestone?.done ?? false };
    dispatch({ t: 'saveMilestone', projectId: p.id, milestone: saved, isNew: !milestone });
    onClose();
  };

  return (
    <Modal
      title={milestone ? 'Edit milestone' : 'Add milestone'}
      onClose={onClose}
      footer={<Footer what="milestone" editing={!!milestone} onSave={save} onClose={onClose} onRemove={() => { dispatch({ t: 'removeMilestone', projectId: p.id, milestoneId: milestone!.id }); onClose(); }} />}
    >
      <div className="grid gap-3">
        <NameField id="ms-name" label="Milestone" value={d.name} error={errors.name} placeholder="e.g. Method statement approved" onChange={(name) => set({ name })} />
        <Field label="Target date" htmlFor="ms-date" hint="Optional. Milestones are listed in date order.">
          <input id="ms-date" type="date" className={inputCls()} value={d.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

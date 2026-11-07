// Keyboard shortcuts sheet: press "?" anywhere (outside a text field) to see every shortcut and trick.
import { useEffect, useState } from 'react';
import { Modal } from './ui';
import { typingIn } from './CommandPalette';

const ROWS: [keys: string[], what: string][] = [
  [['Ctrl', 'K'], 'Quick search: projects, clients and screens'],
  [['/'], 'Quick search, without the Ctrl'],
  [['↑', '↓', 'Enter'], 'Move through results and open one'],
  [['Esc'], 'Close a dialog or quick search'],
  [['?'], 'Show this sheet'],
];

const SECRETS: [keys: string[], what: string][] = [
  [['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'], 'You know what this does'],
  [['Ctrl', 'K', '“party”'], 'Throw a party on demand'],
];

const Keys = ({ keys }: { keys: string[] }) => (
  <span className="flex shrink-0 justify-end gap-1">
    {keys.map((k, i) => (
      <kbd key={i} className="min-w-[20px] rounded-md border border-line border-b-2 bg-paper px-1 py-0.5 text-center font-mono text-[11.5px] text-ink">{k}</kbd>
    ))}
  </span>
);

const Table = ({ rows }: { rows: [string[], string][] }) => (
  <ul className="stagger grid gap-2">
    {rows.map(([keys, what], i) => (
      <li key={what} style={{ ['--i' as string]: i }} className="flex animate-rise items-center justify-between gap-4 text-[13px] text-ink-2">
        <span>{what}</span>
        <Keys keys={keys} />
      </li>
    ))}
  </ul>
);

export function Shortcuts() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !typingIn(e.target) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  return (
    <Modal title="Keyboard shortcuts" onClose={() => setOpen(false)}>
      <Table rows={ROWS} />
      <h3 className="mb-2 mt-5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">Secrets 🤫</h3>
      <Table rows={SECRETS} />
      <p className="mt-4 text-[12px] text-ink-3">Ticking a task throws a little confetti. Ticking a project's last task throws a lot.</p>
    </Modal>
  );
}

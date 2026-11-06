// Shown over the app when another device has changed the same data (live mode only).
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui';

export type SyncProblem =
  /** A save stopped: these records were changed elsewhere since this device loaded them. */
  | { kind: 'conflict'; items: string[] }
  /** Nothing is blocked, but another device has saved changes this one has not loaded. */
  | { kind: 'stale' };

export function SyncBanner({ problem, onReload, onKeepMine, onDismiss }: { problem: SyncProblem; onReload: () => void; onKeepMine: () => void; onDismiss: () => void }) {
  const conflict = problem.kind === 'conflict';
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-3">
      <div role="alert" className={`pointer-events-auto grid w-full max-w-[560px] animate-drop gap-3 rounded-xl border-2 bg-white p-4 shadow-pop ${conflict ? 'border-crit' : 'border-brand'}`}>
        <div className="flex gap-3">
          {conflict ? <AlertTriangle size={20} className="mt-0.5 shrink-0 text-crit" aria-hidden /> : <RefreshCw size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />}
          <div className="grid gap-1 text-[13.5px] text-ink-2">
            <p className="font-semibold text-ink">{conflict ? 'Changed on another device' : 'Newer data on another device'}</p>
            {conflict ? (
              <>
                <p>Your latest change has <b>not been saved</b>, because {problem.items.length === 1 ? 'this was' : 'these were'} also changed somewhere else:</p>
                <ul className="list-disc pl-5 text-ink">{problem.items.slice(0, 4).map((x) => <li key={x}>{x}</li>)}{problem.items.length > 4 && <li>and {problem.items.length - 4} more</li>}</ul>
                <p><b>Reload</b> to see the other version (your change here is lost), or <b>keep mine</b> to save over it.</p>
              </>
            ) : (
              <p>Something was saved from another device or tab. Reload to see it before you make changes here.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {conflict ? <Button kind="danger" onClick={onKeepMine} id="sync-keep">Keep mine</Button> : <Button onClick={onDismiss} id="sync-dismiss">Not now</Button>}
          <Button kind="primary" onClick={onReload} id="sync-reload"><RefreshCw size={14} />Reload</Button>
        </div>
      </div>
    </div>
  );
}

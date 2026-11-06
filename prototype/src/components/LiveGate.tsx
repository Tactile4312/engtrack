import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createAutosave } from '../lib/autosave';
import { ConflictError, ME_ID, changedElsewhere, loadAll, noVersions, saveDiff, saveSettings, setOwner, signOut, supabase, type Settings, type Snapshot, type TableVersions } from '../lib/cloud';
import { SyncBanner, type SyncProblem } from './SyncBanner';
import { buildSeed, USERS } from '../mock-data/seed';
import type { SaveState, State } from '../store/AppStore';
import type { User } from '../types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from './Shell';
import { Button, Field, cx, inputCls } from './ui';
import { AppSkeleton, BrandPanel } from './Welcome';

/** First sign-in: the user's own entry plus the sample projects, clients and people (removable later). */
function firstSnapshot(email: string): Snapshot {
  const { projects, clients } = buildSeed();
  const me: User = { id: ME_ID, name: email.split('@')[0], role: 'Engineer', email };
  return {
    projects, clients, people: [me, ...USERS],
    settings: { read: {}, demo: { projects: projects.map((p) => p.id), clients: clients.map((c) => c.id), people: USERS.map((u) => u.id) } },
  };
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
    } catch {
      setError('Could not reach the server. Check your internet connection.');
    }
    setBusy(false);
  };
  return (
    <div className="grid h-full overflow-auto bg-paper lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <BrandPanel />
      <div className="grid place-items-center p-4 sm:p-8">
        <form onSubmit={submit} className="grid w-full max-w-[380px] animate-pop gap-4 rounded-2xl border border-line bg-white p-7 shadow-lift">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">Sign in</h1>
            <p className="mt-0.5 text-[13px] text-ink-3">Welcome back. Your projects are where you left them.</p>
          </div>
          <Field label="Email" htmlFor="si-email">
            <input id="si-email" type="email" autoComplete="username" className={inputCls()} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password" htmlFor="si-password" error={error || undefined}>
            <div className="relative">
              <input id="si-password" type={show ? 'text' : 'password'} autoComplete="current-password" className={cx(inputCls(error || undefined), 'pr-11')} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-3 transition-colors hover:text-ink">
                {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>
          </Field>
          <Button kind="primary" type="submit" disabled={busy} className="h-11 text-[14px]" id="si-submit">
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <div className="grid h-full place-items-center bg-paper p-6 text-center text-[14px] text-ink-2">{children}</div>;
}

export interface LiveSession {
  snapshot: Snapshot;
  onState: (s: State) => void;
  save: SaveState;
  /** Saves any waiting change first, and asks before signing out if it could not be saved. */
  signOut: () => Promise<void>;
}

const UNSAVED_SIGN_OUT = 'Your latest changes could not be saved. Check your internet connection.\n\nSign out anyway and lose those changes?';

/** Names to show for records another device changed, looked up in this device's copy. */
function describe(e: ConflictError, s: State, base: { projects: State['projects']; clients: State['clients']; people: State['people'] }): string[] {
  return e.ids.map((id) => {
    if (e.table === 'projects') {
      const p = s.projects.find((x) => x.id === id) ?? base.projects.find((x) => x.id === id);
      return p ? `${p.number} · ${p.name}` : id;
    }
    const list: { id: string; name: string }[] = e.table === 'clients' ? [...s.clients, ...base.clients] : [...s.people, ...base.people];
    return list.find((x) => x.id === id)?.name ?? id;
  });
}

/** How often, at most, to check for changes from another device when this tab comes back into view. */
const RECHECK_MS = 15_000;

/** Loads the signed-in user's data, then saves every change back (debounced). */
function Loaded({ session, render }: { session: Session; render: (live: LiveSession) => ReactNode }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [save, setSave] = useState<SaveState>('saved');
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  const saved = useRef<{ projects: State['projects']; clients: State['clients']; people: State['people']; settings: string } | null>(null);
  const versions = useRef<TableVersions>(noVersions());
  const force = useRef(false);
  const leaving = useRef(false);
  const autosave = useRef<ReturnType<typeof createAutosave<State>> | null>(null);

  // One autosave per signed-in session. Stopping it when this screen closes means a change left
  // over from this session can never be saved after sign-out or under another account.
  useEffect(() => {
    const a = createAutosave<State>(async (s) => {
      const base = saved.current!;
      const settings: Settings = { read: s.read, demo: s.demo, lastBackup: s.lastBackup };
      const opts = { force: force.current };
      try {
        await saveDiff('people', base.people, s.people, versions.current.people, opts);
        await saveDiff('clients', base.clients, s.clients, versions.current.clients, opts);
        await saveDiff('projects', base.projects, s.projects, versions.current.projects, opts);
      } catch (e) {
        if (e instanceof ConflictError) setProblem({ kind: 'conflict', items: describe(e, s, base) });
        throw e;
      }
      const json = JSON.stringify(settings);
      if (json !== base.settings) await saveSettings(settings);
      saved.current = { projects: s.projects, clients: s.clients, people: s.people, settings: json };
      force.current = false;
      setProblem((p) => (p?.kind === 'conflict' ? null : p));
    }, setSave, { retryable: (e) => !(e instanceof ConflictError) });
    autosave.current = a;
    return () => a.stop();
  }, []);

  const reload = useCallback(() => {
    leaving.current = true;
    location.reload();
  }, []);

  const keepMine = useCallback(() => {
    force.current = true;
    void autosave.current?.flush();
  }, []);

  // Coming back to this tab or app: check whether another device saved something meanwhile.
  const lastCheck = useRef(0);
  const saveNow = useRef(save);
  saveNow.current = save;
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== 'visible' || !saved.current || saveNow.current !== 'saved') return;
      if (Date.now() - lastCheck.current < RECHECK_MS) return;
      lastCheck.current = Date.now();
      try {
        if (await changedElsewhere(versions.current)) setProblem((p) => p ?? { kind: 'stale' });
      } catch {
        // Offline or similar: the next save will report it.
      }
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  const signOutSafely = useCallback(async () => {
    const a = autosave.current;
    if (a && !(await a.flush()) && !window.confirm(UNSAVED_SIGN_OUT)) return;
    a?.stop();
    await signOut();
  }, []);

  useEffect(() => {
    setOwner(session.user.id);
    (async () => {
      try {
        const loaded = await loadAll();
        let data = loaded.snapshot;
        versions.current = loaded.versions;
        if (data.people.length === 0) {
          // First sign-in: store the starting data. People go last, so an interrupted
          // first load simply runs again (same ids, so nothing is duplicated; forced,
          // because the rows from the interrupted run are not in `versions` yet).
          const first = firstSnapshot(session.user.email ?? 'me@example.com');
          const v = versions.current;
          await saveDiff('projects', [], first.projects, v.projects, { force: true });
          await saveDiff('clients', [], first.clients, v.clients, { force: true });
          await saveSettings(first.settings);
          await saveDiff('people', [], first.people, v.people, { force: true });
          data = first;
        }
        saved.current = { projects: data.projects, clients: data.clients, people: data.people, settings: JSON.stringify(data.settings) };
        setSnap(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [session.user.id, session.user.email]);

  const onState = useCallback((s: State) => {
    const base = saved.current;
    if (!base) return;
    const same = base.projects === s.projects && base.clients === s.clients && base.people === s.people && base.settings === JSON.stringify({ read: s.read, demo: s.demo, lastBackup: s.lastBackup });
    if (!same) autosave.current?.push(s);
  }, []);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save !== 'saved' && !leaving.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  if (error) return <Message><div className="grid gap-2"><p className="font-semibold text-ink">Could not load your data.</p><p>{error}</p><p>Check your internet connection and reload the page.</p></div></Message>;
  if (!snap) return <AppSkeleton />;
  return (
    <>
      {render({ snapshot: snap, onState, save: problem?.kind === 'conflict' ? 'conflict' : save, signOut: signOutSafely })}
      {problem && <SyncBanner problem={problem} onReload={reload} onKeepMine={keepMine} onDismiss={() => setProblem(null)} />}
    </>
  );
}

export function LiveGate({ render }: { render: (live: LiveSession) => ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <AppSkeleton />;
  if (!session) return <SignIn />;
  return <Loaded key={session.user.id} session={session} render={render} />;
}


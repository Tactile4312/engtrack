import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createAutosave } from '../lib/autosave';
import { ME_ID, loadAll, saveDiff, saveSettings, setOwner, signOut, supabase, type Settings, type Snapshot } from '../lib/cloud';
import { buildSeed, USERS } from '../mock-data/seed';
import type { SaveState, State } from '../store/AppStore';
import type { User } from '../types';
import { Logo } from './Shell';
import { Button, Field, inputCls } from './ui';

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
    <div className="grid h-full place-items-center bg-paper p-4">
      <form onSubmit={submit} className="grid w-full max-w-[360px] gap-4 rounded-xl border border-line bg-white p-6 shadow-sm">
        <Logo />
        <h1 className="text-[18px] font-semibold text-ink">Sign in</h1>
        <Field label="Email" htmlFor="si-email">
          <input id="si-email" type="email" autoComplete="username" className={inputCls()} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="si-password" error={error || undefined}>
          <input id="si-password" type="password" autoComplete="current-password" className={inputCls(error || undefined)} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button kind="primary" type="submit" disabled={busy} className="h-11" id="si-submit">{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
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

/** Loads the signed-in user's data, then saves every change back (debounced). */
function Loaded({ session, render }: { session: Session; render: (live: LiveSession) => ReactNode }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [save, setSave] = useState<SaveState>('saved');
  const saved = useRef<{ projects: State['projects']; clients: State['clients']; people: State['people']; settings: string } | null>(null);
  const autosave = useRef<ReturnType<typeof createAutosave<State>> | null>(null);

  // One autosave per signed-in session. Stopping it when this screen closes means a change left
  // over from this session can never be saved after sign-out or under another account.
  useEffect(() => {
    const a = createAutosave<State>(async (s) => {
      const base = saved.current!;
      const settings: Settings = { read: s.read, demo: s.demo, lastBackup: s.lastBackup };
      await saveDiff('people', base.people, s.people);
      await saveDiff('clients', base.clients, s.clients);
      await saveDiff('projects', base.projects, s.projects);
      const json = JSON.stringify(settings);
      if (json !== base.settings) await saveSettings(settings);
      saved.current = { projects: s.projects, clients: s.clients, people: s.people, settings: json };
    }, setSave);
    autosave.current = a;
    return () => a.stop();
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
        let data = await loadAll();
        if (data.people.length === 0) {
          // First sign-in: store the starting data. People go last, so an interrupted
          // first load simply runs again (same ids, so nothing is duplicated).
          const first = firstSnapshot(session.user.email ?? 'me@example.com');
          await saveDiff('projects', [], first.projects);
          await saveDiff('clients', [], first.clients);
          await saveSettings(first.settings);
          await saveDiff('people', [], first.people);
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
      if (save !== 'saved') e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  if (error) return <Message><div className="grid gap-2"><p className="font-semibold text-ink">Could not load your data.</p><p>{error}</p><p>Check your internet connection and reload the page.</p></div></Message>;
  if (!snap) return <Message>Loading your projects…</Message>;
  return <>{render({ snapshot: snap, onState, save, signOut: signOutSafely })}</>;
}

export function LiveGate({ render }: { render: (live: LiveSession) => ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Message>Loading…</Message>;
  if (!session) return <SignIn />;
  return <Loaded key={session.user.id} session={session} render={render} />;
}


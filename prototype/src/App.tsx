import { CheckCircle2 } from 'lucide-react';
import { AppProvider, useApp, type Route } from './store/AppStore';
import { DesktopShell, MobileShell, PrototypeBar } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectForm } from './pages/ProjectForm';
import { Timeline } from './pages/Timeline';
import { Calendar } from './pages/Calendar';
import { Notifications } from './pages/Notifications';
import { Reports } from './pages/Reports';
import { Clients, More } from './pages/Clients';
import { People } from './pages/People';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { Confetti } from './components/Confetti';
import { Shortcuts } from './components/Shortcuts';
import { LiveGate } from './components/LiveGate';
import { LIVE } from './lib/cloud';

function Page({ r }: { r: Route }) {
  switch (r.page) {
    case 'dashboard': return <Dashboard />;
    case 'projects': return <Projects key={JSON.stringify(r.filters ?? {})} initial={r.filters} />;
    case 'project': return <ProjectDetails key={r.id + (r.scopeId ?? '') + (r.tab ?? '')} id={r.id} scopeId={r.scopeId} tab={r.tab} />;
    case 'new': return <ProjectForm key={'new' + (r.copyFrom ?? '')} copyFrom={r.copyFrom} />;
    case 'edit': return <ProjectForm key={'edit' + r.id} editId={r.id} />;
    case 'timeline': return <Timeline />;
    case 'calendar': return <Calendar />;
    case 'notifications': return <Notifications />;
    case 'reports': return <Reports />;
    case 'clients': return <Clients />;
    case 'people': return <People />;
    case 'more': return <More />;
  }
}

function Toast() {
  const { s } = useApp();
  if (!s.toast) return null;
  return (
    <div key={s.toast} role="status" className="pointer-events-none absolute bottom-24 left-1/2 z-[60] flex -translate-x-1/2 animate-toast items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white shadow-pop">
      <CheckCircle2 size={16} className="text-[#7fd17f]" aria-hidden />{s.toast}
    </div>
  );
}

export function Screen() {
  const { s, isMobile, device } = useApp();
  const r = s.route;
  // Keyed by route, so moving to another screen clears a previous failure.
  const page = <ErrorBoundary key={JSON.stringify(r)}><div className="h-full animate-fade"><Page r={r} /></div></ErrorBoundary>;
  const deep = r.page === 'project' || r.page === 'new' || r.page === 'edit';
  const title = r.page === 'project' ? r.id : r.page === 'new' ? 'New project' : r.page === 'edit' ? `Edit ${r.id}` : undefined;

  if (!isMobile) {
    return (
      <div className="relative flex min-h-0 flex-1">
        <DesktopShell>{page}</DesktopShell>
        <Toast />
        <CommandPalette />
        <Confetti />
        <Shortcuts />
      </div>
    );
  }
  const app = (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <MobileShell back={deep} title={title}>{page}</MobileShell>
      <Toast />
      <CommandPalette />
      <Confetti />
        <Shortcuts />
    </div>
  );
  // Forced mobile preview on a wide screen: show the app inside a 390 x 844 phone frame.
  if (device === 'mobile' && window.innerWidth >= 480) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#dfe4ea] py-6">
        <div className="flex h-[844px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[44px] border-[10px] border-[#14202b] bg-white shadow-2xl">
          <div className="flex h-8 shrink-0 items-center justify-between bg-white px-7 text-[12px] font-semibold text-ink"><span>9:41</span><span className="h-1.5 w-16 rounded-full bg-[#dfe4ea]" /></div>
          {app}
        </div>
      </div>
    );
  }
  return app;
}

const showBar = (() => {
  try {
    return new URLSearchParams(location.search).get('bar') !== '0';
  } catch {
    return true;
  }
})();

export default function App() {
  // Catches failures outside a single screen, such as the menu or the reminder count.
  return <ErrorBoundary>{LIVE ? <LiveApp /> : <DemoApp />}</ErrorBoundary>;
}

function LiveApp() {
  return (
    <LiveGate
      render={({ snapshot, onState, save, signOut }) => (
        <AppProvider snapshot={snapshot} onState={onState} save={save} signOut={signOut}>
          <div className="flex h-full flex-col"><Screen /></div>
        </AppProvider>
      )}
    />
  );
}

function DemoApp() {
  return (
    <AppProvider>
      <div className="flex h-full flex-col">
        {showBar && <PrototypeBar />}
        <Screen />
      </div>
    </AppProvider>
  );
}

// Renders every screen, in both builds and at both screen sizes. Catches a change that crashes a page the moment it opens.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { buildSeed, USERS } from './mock-data/seed';

// Each render reloads the app's modules, which is slow on a busy machine.
vi.setConfig({ testTimeout: 60000 });

const PROJECT = buildSeed().projects[0].id;
const SCREENS: [string, string][] = [
  ['dashboard', 'screen=dashboard'], ['projects', 'screen=projects'], ['project', `screen=project&id=${PROJECT}`], ['new project', 'screen=new'],
  ['timeline', 'screen=timeline'], ['calendar', 'screen=calendar'], ['notifications', 'screen=notifications'], ['reports', 'screen=reports'],
  ['clients', 'screen=clients'], ['more', 'screen=more'], ['people', 'screen=people'],
];

async function render(search: string, width: number, live: boolean) {
  vi.resetModules();
  vi.stubGlobal('window', { innerWidth: width, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('location', { search: `?${search}` });
  vi.doMock('./lib/cloud', async (original) => ({ ...(await original<typeof import('./lib/cloud')>()), LIVE: live, supabase: null }));
  const [{ AppProvider }, { Screen }] = await Promise.all([import('./store/AppStore'), import('./App')]);
  const { projects, clients } = buildSeed();
  const snapshot = live ? { projects, clients, people: [{ id: 'me', name: 'solo', role: 'Engineer' as const, email: '' }, ...USERS], settings: { read: {} } } : undefined;
  return renderToString(<AppProvider snapshot={snapshot}><Screen /></AppProvider>);
}

describe.each([['demo', false], ['live', true]] as const)('%s build', (_label, live) => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('./lib/cloud');
  });
  describe.each([['desktop', 1440], ['mobile', 390]] as const)('%s', (_size, width) => {
    it.each(SCREENS)('%s opens', async (_name, search) => {
      expect((await render(search, width, live)).length).toBeGreaterThan(200);
    });
  });
  it('an unknown ?screen= link opens the dashboard, not a blank page', async () => {
    expect(await render('screen=nonsense', 1440, live)).toEqual(await render('screen=dashboard', 1440, live));
  });
});

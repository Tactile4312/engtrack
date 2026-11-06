// A stand-in for Supabase inside the browser test: answers sign-in, sign-out and table reads and writes,
// keeps the rows in memory, and records every request so tests can check what was saved and in what order.
// Every other outside request is blocked, so a mistake can never reach a real database.
import type { BrowserContext, Request, Route } from '@playwright/test';

export const FAKE_SUPABASE_URL = 'https://e2e-fake.supabase.co';
const FAKE_HOST = new URL(FAKE_SUPABASE_URL).host;

export const TEST_EMAIL = 'tester@example.com';
export const TEST_PASSWORD = 'right-password';
const USER_ID = '00000000-0000-4000-8000-000000000001';

type Row = { owner: string; id: string; data: unknown; updated_at: string };

export interface Call {
  method: string;
  /** e.g. 'rest:projects', 'auth:token', 'auth:logout' */
  target: string;
  body: string;
}

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function session() {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: USER_ID, aud: 'authenticated', role: 'authenticated', email: TEST_EMAIL,
    app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString(),
  };
  const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', email: TEST_EMAIL, iat: now, exp: now + 3600 })}.fake-signature`;
  return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'fake-refresh', user };
}

export class FakeSupabase {
  readonly tables = new Map<string, Map<string, Row>>();
  readonly calls: Call[] = [];
  /** When true, every write fails as if the connection had dropped. */
  failWrites = false;

  async install(target: Pick<BrowserContext, 'route'>) {
    await target.route('**/*', (route) => this.handle(route));
  }

  /** Notes and other edits end up inside a saved project's JSON; this finds the saves that carried a given text. */
  savesContaining(table: string, text: string) {
    return this.calls.filter((c) => c.method === 'POST' && c.target === `rest:${table}` && c.body.includes(text));
  }

  indexOf(pred: (c: Call) => boolean) {
    return this.calls.findIndex(pred);
  }

  /** Acts as another device: changes a stored record and stamps it with a later time. */
  editElsewhere(table: string, id: string, change: (data: Record<string, unknown>) => Record<string, unknown>) {
    const row = this.table(table).get(id);
    if (!row) throw new Error(`no ${table} row ${id}`);
    this.table(table).set(id, { ...row, data: change(row.data as Record<string, unknown>), updated_at: new Date(Date.now() + 1000).toISOString() });
  }

  private table(name: string) {
    if (!this.tables.has(name)) this.tables.set(name, new Map());
    return this.tables.get(name)!;
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    if (url.host !== FAKE_HOST) return route.abort('blockedbyclient');
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });

    const [, area, , name] = url.pathname.split('/'); // /auth/v1/token, /rest/v1/projects
    const target = `${area}:${name}`;
    this.calls.push({ method: req.method(), target, body: req.postData() ?? '' });

    if (area === 'auth') return this.auth(route, req, name);
    if (area === 'rest') return this.rest(route, req, name, url);
    return route.fulfill({ status: 404, headers: cors(), body: '' });
  }

  private auth(route: Route, req: Request, name: string) {
    if (name === 'token') {
      const { email, password } = JSON.parse(req.postData() ?? '{}');
      if (email === TEST_EMAIL && password === TEST_PASSWORD) return json(route, 200, session());
      return json(route, 400, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials', message: 'Invalid login credentials' });
    }
    if (name === 'logout') return route.fulfill({ status: 204, headers: cors(), body: '' });
    if (name === 'user') return json(route, 200, session().user);
    return json(route, 404, { message: `fake auth has no ${name}` });
  }

  private rest(route: Route, req: Request, name: string, url: URL) {
    const rows = this.table(name);
    const method = req.method();
    if (method === 'GET') {
      // Supports what the app asks for: ?select=a,b,c and ?id=in.(x,y)
      const cols = (url.searchParams.get('select') ?? '*').split(',').map((c) => c.trim());
      const only = url.searchParams.has('id') ? new Set(inList(url.searchParams.get('id')!)) : null;
      const list = [...rows.values()].filter((r) => !only || only.has(r.id));
      return json(route, 200, list.map((r) => (cols.includes('*') ? r : Object.fromEntries(cols.map((c) => [c, r[c as keyof Row]])))));
    }
    if (this.failWrites) return json(route, 503, { message: 'Service unavailable (simulated)' });
    if (method === 'POST') {
      const body = JSON.parse(req.postData() ?? '[]');
      for (const r of Array.isArray(body) ? body : [body]) rows.set(r.id ?? r.owner, { ...r, updated_at: r.updated_at ?? new Date().toISOString() });
      return route.fulfill({ status: 201, headers: cors(), body: '' });
    }
    if (method === 'DELETE') {
      for (const id of inList(url.searchParams.get('id') ?? '')) rows.delete(id);
      return route.fulfill({ status: 204, headers: cors(), body: '' });
    }
    return json(route, 405, { message: `fake rest has no ${method}` });
  }
}

/** Reads PostgREST's in.(a,b,"c d") filter. */
const inList = (v: string) => v.replace(/^in\.\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')).filter(Boolean);

const cors = () => ({
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
});

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, headers: { ...cors(), 'content-type': 'application/json' }, body: JSON.stringify(body) });

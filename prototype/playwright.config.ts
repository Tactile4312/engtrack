// Browser tests (npm run e2e). Two copies of the app run side by side:
// - demo: the click-through build with fictional data, no login;
// - live: the signed-in build, pointed at a fake Supabase address that the tests answer themselves
//   (e2e/fake-supabase.ts), so no real or test database is ever touched.
import { defineConfig, devices } from '@playwright/test';
import { FAKE_SUPABASE_URL } from './e2e/fake-supabase';

// The app's type settings leave out Node's globals on purpose; this config only needs process.env.
declare const process: { env: Record<string, string | undefined> };

const DEMO = 'http://127.0.0.1:5181';
const LIVE = 'http://127.0.0.1:5182';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: 0,
  reporter: CI ? 'github' : 'list',
  // Uses the Chrome already installed on the machine (also preinstalled on GitHub's runners).
  use: { channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'demo-desktop', testMatch: 'demo.e2e.ts', use: { baseURL: DEMO, viewport: { width: 1440, height: 900 } } },
    { name: 'demo-mobile', testMatch: 'demo.e2e.ts', use: { ...devices['Pixel 7'], channel: 'chrome', baseURL: DEMO } },
    { name: 'live', testMatch: 'live.e2e.ts', use: { baseURL: LIVE, viewport: { width: 1440, height: 900 } } },
  ],
  // Tests run against fresh production builds, the same code that ships. (The dev server runs some code twice on
  // purpose and reloads while it warms up, which made tests fail for reasons users never see.)
  webServer: [
    {
      command: 'npx vite build --mode demo --outDir dist-e2e-demo --emptyOutDir && npx vite preview --outDir dist-e2e-demo --host 127.0.0.1 --port 5181 --strictPort',
      url: DEMO,
      timeout: 180_000,
    },
    {
      command: 'npx vite build --outDir dist-e2e-live --emptyOutDir && npx vite preview --outDir dist-e2e-live --host 127.0.0.1 --port 5182 --strictPort',
      url: LIVE,
      timeout: 180_000,
      // Settings already in the environment win over .env.local, so this copy never sees the real project.
      env: { VITE_SUPABASE_URL: FAKE_SUPABASE_URL, VITE_SUPABASE_KEY: 'e2e-fake-publishable-key' },
    },
  ],
});

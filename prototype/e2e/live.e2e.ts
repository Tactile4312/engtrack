// The signed-in build against a fake Supabase (see fake-supabase.ts): sign-in, first-run data, saving, and sign-out.
import { expect, test, type Page } from '@playwright/test';
import { FakeSupabase, TEST_EMAIL, TEST_PASSWORD } from './fake-supabase';

let db: FakeSupabase;

test.beforeEach(async ({ context }) => {
  db = new FakeSupabase();
  await db.install(context); // every tab in the test shares the same fake database
});

async function signIn(page: Page, password = TEST_PASSWORD) {
  await page.goto('/?bar=0');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function openNotes(page: Page) {
  await page.goto('/?bar=0&screen=project&id=CRM-2026-0142');
  await page.getByRole('tab', { name: /^Notes/ }).click();
}

async function addNote(page: Page, text: string) {
  await page.locator('#new-note').fill(text);
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByText(text)).toBeVisible();
}

const signOutButton = (page: Page) => page.getByRole('button', { name: 'Sign out' });
const signInForm = (page: Page) => page.getByRole('heading', { name: 'Sign in' });

test('a wrong password shows a plain message and stays on the sign-in form', async ({ page }) => {
  await signIn(page, 'wrong-password');
  await expect(page.getByText('Wrong email or password.')).toBeVisible();
  await expect(signInForm(page)).toBeVisible();
});

test('first sign-in stores the starting data, and it loads again after a reload', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  expect(db.tables.get('people')?.has('me')).toBe(true);
  expect(db.tables.get('projects')?.size).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  // The second load found the stored people, so it did not write the starting data again.
  expect(db.calls.filter((c) => c.method === 'POST' && c.target === 'rest:people')).toHaveLength(1);
});

test('a new note is saved to the database and is still there after a reload', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await openNotes(page);
  await addNote(page, 'Lift plan approved by client');

  await expect.poll(() => db.savesContaining('projects', 'Lift plan approved by client').length).toBeGreaterThan(0);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await openNotes(page);
  await expect(page.getByText('Lift plan approved by client')).toBeVisible();
});

test('signing out straight after an edit saves the edit first', async ({ page }) => {
  await signIn(page);
  await openNotes(page);
  await addNote(page, 'Edited just before signing out');
  await signOutButton(page).click(); // well inside the auto-save pause

  await expect(signInForm(page)).toBeVisible();
  const saved = db.indexOf((c) => c.target === 'rest:projects' && c.method === 'POST' && c.body.includes('Edited just before signing out'));
  const loggedOut = db.indexOf((c) => c.target === 'auth:logout');
  expect(saved, 'the note was saved').toBeGreaterThan(-1);
  expect(loggedOut, 'sign-out reached the server').toBeGreaterThan(-1);
  expect(saved, 'saved before signing out').toBeLessThan(loggedOut);
});

test('signing out while saves fail asks first, and Cancel keeps you signed in', async ({ page }) => {
  await signIn(page);
  await openNotes(page);
  db.failWrites = true;
  await addNote(page, 'Written while offline');

  const asked: string[] = [];
  page.once('dialog', (d) => {
    asked.push(d.message());
    void d.dismiss();
  });
  await signOutButton(page).click();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]).toContain('could not be saved');
  await expect(signOutButton(page)).toBeVisible();
  expect(db.indexOf((c) => c.target === 'auth:logout')).toBe(-1);

  page.once('dialog', (d) => void d.accept());
  await signOutButton(page).click();
  await expect(signInForm(page)).toBeVisible();
});

test('after signing out in another tab, this tab stops trying to save', async ({ page, context }) => {
  await signIn(page);
  await openNotes(page);
  db.failWrites = true;
  await addNote(page, 'Left unsaved in the first tab');
  await expect(page.getByText(/Not saved, retrying/)).toBeVisible();

  // Same browser, second tab: signing out there ends the session in the first tab too.
  const other = await context.newPage();
  await other.goto('/?bar=0');
  await signOutButton(other).click();
  await expect(signInForm(other)).toBeVisible();
  await expect(signInForm(page)).toBeVisible();

  // Once the connection is back, nothing from the ended session may be written.
  db.failWrites = false;
  const before = db.calls.length;
  await page.waitForTimeout(6000); // longer than the 5 s retry delay
  expect(db.calls.slice(before).filter((c) => c.target.startsWith('rest:') && c.method !== 'GET')).toEqual([]);
});

test('a task added to a project is saved and is still there after a reload', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.goto('/?bar=0&screen=project&id=CRM-2026-0142');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.locator('#task-name').fill('Book the 750 t crawler crane');
  await page.locator('#plan-save').click();

  await expect.poll(() => db.savesContaining('projects', 'Book the 750 t crawler crane').length).toBeGreaterThan(0);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Book the 750 t crawler crane')).toBeVisible();
});

test.describe('edits from another device', () => {
  const PROJECT = 'CRM-2026-0142';
  const renamedElsewhere = (d: Record<string, unknown>) => ({ ...d, name: 'Renamed on the laptop' });

  test('a change to a record edited elsewhere is held back, and Keep mine saves it', async ({ page }) => {
    await signIn(page);
    await openNotes(page);
    db.editElsewhere('projects', PROJECT, renamedElsewhere);
    await addNote(page, 'Written on the phone');

    const banner = page.getByRole('alert').filter({ hasText: 'Changed on another device' });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(`${PROJECT} · Reactor Vessel R-301 Lift`);
    await expect(page.getByText('Not saved, changed elsewhere')).toBeVisible();
    expect(db.savesContaining('projects', 'Written on the phone')).toHaveLength(0);

    await page.locator('#sync-keep').click();
    await expect.poll(() => db.savesContaining('projects', 'Written on the phone').length).toBe(1);
    await expect(banner).toHaveCount(0);
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  });

  test('Reload drops the change here and shows the other device’s version', async ({ page }) => {
    await signIn(page);
    await openNotes(page);
    db.editElsewhere('projects', PROJECT, renamedElsewhere);
    await addNote(page, 'Thrown away on reload');
    await page.locator('#sync-reload').click();

    await expect(page.getByRole('heading', { name: /Renamed on the laptop/ })).toBeVisible();
    await page.getByRole('tab', { name: /^Notes/ }).click();
    await expect(page.getByText('Thrown away on reload')).toHaveCount(0);
    expect(db.savesContaining('projects', 'Thrown away on reload')).toHaveLength(0);
  });

  test('coming back to the tab offers to load changes saved elsewhere', async ({ page }) => {
    await signIn(page);
    await page.goto(`/?bar=0&screen=project&id=${PROJECT}`);
    await expect(page.getByRole('heading', { name: /Reactor Vessel R-301 Lift/ })).toBeVisible();
    db.editElsewhere('projects', PROJECT, renamedElsewhere);

    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('alert').filter({ hasText: 'Newer data on another device' })).toBeVisible();
    await page.locator('#sync-reload').click();
    await expect(page.getByRole('heading', { name: /Renamed on the laptop/ })).toBeVisible();
  });

  test('editing records nobody else touched saves without asking', async ({ page }) => {
    await signIn(page);
    await openNotes(page);
    db.editElsewhere('projects', 'CRM-2026-0131', renamedElsewhere); // a different project
    await addNote(page, 'Unrelated edit');
    await expect.poll(() => db.savesContaining('projects', 'Unrelated edit').length).toBe(1);
    await expect(page.getByRole('alert').filter({ hasText: 'Changed on another device' })).toHaveCount(0);
  });
});

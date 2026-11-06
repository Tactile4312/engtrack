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

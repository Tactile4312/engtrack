// The demo build (fictional data, no login), clicked through like a person would, at desktop and phone size.
import { expect, test, type Page } from '@playwright/test';

const SCREENS = ['dashboard', 'projects', 'timeline', 'calendar', 'notifications', 'reports', 'clients', 'people', 'new'];

/** Blocks outside requests (web fonts) and collects page crashes and console errors. */
async function watch(page: Page) {
  const problems: string[] = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort('blockedbyclient'));
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) problems.push(`console: ${m.text()}`);
  });
  return problems;
}

const isoInDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('every main screen opens without errors', async ({ page }) => {
  const problems = await watch(page);
  for (const screen of SCREENS) {
    await page.goto(`/?bar=0&screen=${screen}`);
    await expect(page.getByRole('heading').first(), screen).toBeVisible();
    await expect(page.getByText('This screen could not be shown'), screen).toHaveCount(0);
  }
  expect(problems).toEqual([]);
});

test('create project: an empty form is refused, a complete one is saved and opened', async ({ page }) => {
  const problems = await watch(page);
  await page.goto('/?bar=0&screen=new');
  const create = page.getByRole('button', { name: 'Create project' });

  await create.click();
  await expect(page.getByText(/fields need attention before this project can be saved/)).toBeVisible();

  const number = (await page.getByRole('button', { name: /^CRM-\d{4}-\d{4}$/ }).textContent())!;
  await page.getByRole('button', { name: number }).click();
  await page.locator('#pf-name').fill('E2E Flare Stack Lift');
  await page.locator('#pf-client').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Lifting', exact: true }).click();
  await page.locator('#pf-due').fill(isoInDays(30));
  await page.locator('#pf-sales').selectOption({ index: 1 });
  await page.locator('#pf-pm').selectOption({ index: 1 });
  await create.click();

  await expect(page.getByText(`Project ${number} created`)).toBeVisible();
  await expect(page.getByRole('heading', { name: /E2E Flare Stack Lift/ })).toBeVisible();
  expect(problems).toEqual([]);
});

test('project search narrows the list', async ({ page }) => {
  await watch(page);
  await page.goto('/?bar=0&screen=projects');
  await expect(page.getByText('Heat Exchanger E-12 Skid-in').first()).toBeVisible();
  await page.locator('#projects-search').fill('Kiln');
  await expect(page.getByText('Kiln Shell Section Lift').first()).toBeVisible();
  await expect(page.getByText('Heat Exchanger E-12 Skid-in')).toHaveCount(0);
});

test('a note added to a project appears straight away', async ({ page }) => {
  await watch(page);
  await page.goto('/?bar=0&screen=project&id=CRM-2026-0142');
  await page.getByRole('tab', { name: /^Notes/ }).click();
  await page.locator('#new-note').fill('Crane mats delivered to site');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByText('Crane mats delivered to site')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Notes (1)' })).toBeVisible();
});

test.describe('tasks and milestones', () => {
  const PROJECT = '/?bar=0&screen=project&id=CRM-2026-0142';
  const dialog = (page: Page) => page.getByRole('dialog');

  test('a project manager adds, edits, ticks off and removes a task', async ({ page }) => {
    const problems = await watch(page);
    await page.goto(PROJECT);
    await page.getByRole('button', { name: 'Add task' }).click();

    await page.locator('#plan-save').click();
    await expect(dialog(page).getByText('Enter what needs doing.')).toBeVisible();

    await page.locator('#task-name').fill('Check rigging certificates');
    await page.locator('#task-scope').selectOption({ label: 'Lifting' });
    // Choosing the scope suggests its engineer.
    await expect(page.locator('#task-assignee')).not.toHaveValue('');
    await page.locator('#plan-save').click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByText('Check rigging certificates')).toBeVisible();

    await page.getByRole('button', { name: 'Edit task: Check rigging certificates' }).click();
    await page.locator('#task-name').fill('Check rigging and shackle certificates');
    await page.locator('#plan-save').click();
    await expect(page.getByText('Check rigging and shackle certificates')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Check rigging and shackle certificates' }).check();
    await expect(page.getByText(/done \d{2} \w{3}/).last()).toBeVisible();

    await page.getByRole('button', { name: 'Edit task: Check rigging and shackle certificates' }).click();
    await page.locator('#plan-remove').click();
    await page.locator('#plan-remove-confirm').click();
    await expect(page.getByText('Check rigging and shackle certificates')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Activity history' }).click();
    await expect(page.getByText(/Task removed · Check rigging and shackle certificates/)).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a project manager adds a milestone, and a duplicate name is refused', async ({ page }) => {
    await watch(page);
    await page.goto(PROJECT);
    await page.getByRole('button', { name: 'Add milestone' }).click();
    await page.locator('#ms-name').fill('client approval');
    await page.locator('#plan-save').click();
    await expect(dialog(page).getByText(/already a milestone on this project/)).toBeVisible();

    await page.locator('#ms-name').fill('Method statement approved');
    await page.locator('#plan-save').click();
    await expect(page.getByRole('button', { name: 'Edit milestone: Method statement approved' })).toBeVisible();
  });

  test('an engineer can tick tasks off but not add, edit or remove them', async ({ page }) => {
    await watch(page);
    await page.goto(`${PROJECT}&user=u-e1`);
    await expect(page.getByRole('tab', { name: 'Tasks & milestones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add task' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Edit task/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add milestone' })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'Ground bearing check against GBP data' })).toBeEnabled();
  });
});

test('removing a scope from a project moves its tasks to the whole project', async ({ page, isMobile }) => {
  test.skip(isMobile, 'same form on both sizes; checked once at desktop size');
  await watch(page);
  await page.goto('/?bar=0&screen=project&id=CRM-2026-0142');
  await expect(page.getByText('Draft method statement')).toBeVisible();
  await page.getByRole('button', { name: 'Edit project' }).click();
  await page.getByRole('button', { name: 'MS Study', exact: true }).click(); // untick the scope
  await page.getByRole('button', { name: 'Save changes' }).click();
  const row = page.locator('div', { has: page.getByRole('checkbox', { name: 'Draft method statement' }) }).last();
  await expect(row.getByText(/^Whole project/)).toBeVisible();
});

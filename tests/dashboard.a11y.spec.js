import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const dashboardUrl = process.env.TARGET_URL || 'https://demo.mercury.com/dashboard';

test('Mercury dashboard has no automated accessibility violations', async ({ page }, testInfo) => {
  const response = await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), 'Dashboard should return a successful HTTP response').toBeTruthy();
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  // Confirm the rendered dashboard is ready before scanning the SPA.
  await expect(page.getByRole('heading', { name: /^Welcome,/ })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Transactions table', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Transactions table', exact: true }).getByRole('row').nth(1)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const results = await new AxeBuilder({ page }).analyze();
  await testInfo.attach('axe-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  const violations = results.violations.map(({ id, impact, help, helpUrl, nodes }) => ({
    rule: id, impact, help, helpUrl,
    elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

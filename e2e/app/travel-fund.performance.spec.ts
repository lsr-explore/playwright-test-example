import { test } from '@playwright/test';
import { reportPerformance } from '../support/performance';
test('report Travel Fund performance', async ({ page, context }, testInfo) => {
  await reportPerformance(page, context, testInfo, '/travel-fund', 'Travel Fund');
});
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

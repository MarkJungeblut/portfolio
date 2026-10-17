import { test, expect } from '@playwright/test';

// The page is prerendered at build time, so its content must be in the HTML
// the server sends, not produced by JavaScript in the browser.
test.describe('prerendered home page', () => {
  test.use({ javaScriptEnabled: false });

  test('renders the heading without JavaScript', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Mark Jungeblut' }),
    ).toBeVisible();
  });
});

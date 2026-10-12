
const { test, expect } = require('@playwright/test');

test('TC_WEB_01 - Verify Playwright homepage', async ({ page }) => {
  // Step 1: Open the website
  await page.goto('https://playwright.dev/');

  // Step 2: Verify the page title
  await expect(page).toHaveTitle(/Playwright/);

  // Step 3: Verify the main heading
  await expect(
    page.getByRole('heading', { name: 'Playwright' }).first()
  ).toBeVisible();
});

test('TC_WEB_02 - Verify Get Started navigation', async ({ page }) => {
  // Step 1: Open the website
  await page.goto('https://playwright.dev/');

  // Step 2: Click Get Started
  await page.getByRole('link', { name: 'Get started' }).click();

  // Step 3: Verify the destination
  await expect(page).toHaveURL(/.*intro/);

  // Step 4: Verify the installation heading
  await expect(
    page.getByRole('heading', { name: 'Installation' })
  ).toBeVisible();
});
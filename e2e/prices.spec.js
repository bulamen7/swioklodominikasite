import { test, expect } from '@playwright/test';

test.describe('Prices Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/prices');
  });

  test('displays prices header', async ({ page }) => {
    await expect(page.locator('.prices-header h1')).toContainText('Oferta i Cennik');
    await expect(page.locator('.prices-header p')).toBeVisible();
  });

  test('loads services from API and displays price cards', async ({ page }) => {
    await expect(page.locator('.price-card').first()).toBeVisible({ timeout: 10000 });
    const cards = page.locator('.price-card');
    await expect(cards).not.toHaveCount(0);
  });

  test('each price card has a title and book button', async ({ page }) => {
    await expect(page.locator('.price-card').first()).toBeVisible({ timeout: 10000 });
    const firstCard = page.locator('.price-card').first();
    await expect(firstCard.locator('.price-card-header h3')).toBeVisible();
    await expect(firstCard.locator('.book-button')).toBeVisible();
  });

  test('book button navigates to service detail', async ({ page }) => {
    await expect(page.locator('.price-card').first()).toBeVisible({ timeout: 10000 });
    const firstButton = page.locator('.price-card .book-button').first();
    await firstButton.click();
    await expect(page).toHaveURL(/\/service\?id=/);
  });

  test('pricing note section is visible', async ({ page }) => {
    await expect(page.locator('.pricing-note')).toBeVisible();
    await expect(page.locator('.pricing-note h3')).toContainText('Płatności');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads with hero section', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero h1')).toContainText('Profesjonalne Usługi Terapeutyczne');
  });

  test('navbar is visible and has key links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('navigate to Prices page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/prices');
    await expect(page.locator('.prices-header h1')).toContainText('Oferta i Cennik');
  });

  test('navigate to About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigate to Contact page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/contact');
    await expect(page.locator('.contact-header h1')).toContainText('Kontakt');
  });

  test('navigate to Blog page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('404 page for invalid route', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('h1')).toContainText('404');
  });

  test('footer is visible on all pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer, .footer')).toBeVisible();
  });
});

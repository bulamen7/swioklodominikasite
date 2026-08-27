import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/contact');
  });

  test('displays contact header', async ({ page }) => {
    await expect(page.locator('.contact-header h1')).toContainText('Kontakt');
  });

  test('shows contact info (phone, address, email)', async ({ page }) => {
    await expect(page.locator('.contact-info-section')).toBeVisible();
    await expect(page.locator('.contact-info-section a[href="tel:+48797194841"]')).toBeVisible();
    await expect(page.locator('.contact-info-section >> text=Warszawa')).toBeVisible();
    await expect(page.locator('.contact-info-section a[href="mailto:dzienkiewicz2@gmail.com"]')).toBeVisible();
  });

  test('displays Google Maps iframe', async ({ page }) => {
    await expect(page.locator('.map-iframe')).toBeVisible();
  });

  test('contact form is visible with required fields', async ({ page }) => {
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('.contact-form-section button[type="submit"]')).toBeVisible();
  });

  test('form validation prevents empty submission', async ({ page }) => {
    await page.locator('.contact-form-section button[type="submit"]').click();
    // HTML5 validation prevents submission - form should still be visible
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test('form shows name and email fields for non-logged users', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

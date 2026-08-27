import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('preferredLanguage', 'pl'));
    await page.goto('/admin');
  });

  test('displays login form', async ({ page }) => {
    await expect(page.locator('.login-card h1')).toContainText('Logowanie');
    await expect(page.locator('.login-card input[type="email"]')).toBeVisible();
    await expect(page.locator('.login-card input[type="password"]')).toBeVisible();
  });

  test('has submit button', async ({ page }) => {
    await expect(page.locator('.login-card button[type="submit"]')).toContainText('Zaloguj się');
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('.login-card input[type="email"]').fill('test@invalid.com');
    await page.locator('.login-card input[type="password"]').fill('wrongpassword');
    await page.locator('.login-card button[type="submit"]').click();

    await expect(page.locator('.login-error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.login-error')).toContainText('Nieprawidłowy email lub hasło');
  });

  test('has forgot password link', async ({ page }) => {
    await expect(page.locator('.login-card').getByText('Nie pamiętam hasła')).toBeVisible();
  });

  test('has register link', async ({ page }) => {
    await expect(page.locator('.login-card').getByText('Zarejestruj się')).toBeVisible();
  });

  test('switches to register form', async ({ page }) => {
    await page.locator('.login-card').getByText('Zarejestruj się').click();
    await expect(page.locator('.login-card h1')).not.toContainText('Logowanie');
  });
});

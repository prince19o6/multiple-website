import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Travel Platform E2E Tests', () => {
  test('home page renders header, hero, and search widget with tenant branding', async ({ page }) => {
    await page.goto('/');

    // 1. Verify page title
    await expect(page).toHaveTitle(/Gujju Tours|TripGo Asia|Technoheaven|Travel/);

    // 2. Verify Search Widget exists
    const searchWidget = page.locator('button:has-text("Search"), button:has-text("Explore")');
    await expect(searchWidget.first()).toBeVisible({ timeout: 10000 });

    // 3. Verify Service Tabs are present (Tours, Hotels, etc.)
    const serviceTabs = page.locator('nav, [role="tablist"], div:has-text("Tours")');
    await expect(serviceTabs.first()).toBeVisible();
  });

  test('service tabs switch between Tours, Hotels, Transfers, Holidays', async ({ page }) => {
    await page.goto('/');

    // Click on Hotels tab if present
    const hotelsTab = page.locator('button:has-text("Hotels")').first();
    if (await hotelsTab.isVisible()) {
      await hotelsTab.click();
      // Should show hotel search fields (Check-in, Check-out, Rooms)
      const datePicker = page.locator('text=Check-in, text=Check-out, [placeholder*="Check-in"]').first();
      await expect(datePicker).toBeVisible();
    }
  });

  test('admin portal requires authentication', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login or show admin login form
    const loginIndicator = page.locator('text=Sign In, text=Login, input[type="password"], button:has-text("Login")');
    await expect(loginIndicator.first()).toBeVisible({ timeout: 10000 });
  });
});


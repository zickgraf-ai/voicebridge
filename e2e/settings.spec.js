import { test, expect } from '@playwright/test';

test.describe('Settings persistence', () => {
  test('auto-speak toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Find and click the auto-speak toggle to turn it off
    const toggle = page.getByRole('switch', { name: 'Auto-speak on tap' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Reload and verify
    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    // Toggle should still be off (aria-checked=false)
    await expect(page.getByRole('switch', { name: 'Auto-speak on tap' })).toHaveAttribute('aria-checked', 'false');
  });

  test('voice speed persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Change speed to Fast (now a radio button)
    await page.getByRole('radio', { name: 'Fast' }).click();

    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    const fastBtn = page.getByRole('radio', { name: 'Fast' });
    await expect(fastBtn).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  });

  test('category tab size persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Change tab size to Normal
    // Need to scroll down to find it and be precise about which "Normal" button
    const tabSizeSection = page.getByText('Category Tab Size');
    await expect(tabSizeSection).toBeVisible();

    // The Normal button under Category Tab Size (now radio buttons)
    // There are multiple "Normal" radios, so find the first one
    const normalBtns = page.getByRole('radio', { name: 'Normal' });
    await normalBtns.first().click();

    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    // First "Normal" radio should be selected
    const normalBtn = page.getByRole('radio', { name: 'Normal' }).first();
    await expect(normalBtn).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  });

  test('version number is displayed', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    await expect(page.getByText(/VoiceBridge v\d+\.\d+\.\d+/)).toBeVisible();
  });
});

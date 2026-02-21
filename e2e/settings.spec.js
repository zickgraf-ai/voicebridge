import { test, expect } from '@playwright/test';

test.describe('Settings persistence', () => {
  test('auto-speak toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Find and click the auto-speak toggle to turn it off
    const toggle = page.getByText('Auto-speak on tap');
    await expect(toggle).toBeVisible();

    // The toggle is a SegmentControl with On/Off options
    await page.getByRole('button', { name: 'Off', exact: true }).first().click();

    // Reload and verify
    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    // "Off" should still be selected (highlighted blue)
    const offBtn = page.getByRole('button', { name: 'Off', exact: true }).first();
    await expect(offBtn).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  });

  test('voice speed persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Change speed to Fast
    await page.getByRole('button', { name: 'Fast', exact: true }).click();

    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    const fastBtn = page.getByRole('button', { name: 'Fast', exact: true });
    await expect(fastBtn).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  });

  test('category tab size persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    // Change tab size to Normal
    // Need to scroll down to find it and be precise about which "Normal" button
    const tabSizeSection = page.getByText('Category Tab Size');
    await expect(tabSizeSection).toBeVisible();

    // The Normal button under Category Tab Size
    // There are multiple "Normal" buttons, so find the one near the tab size label
    const normalBtns = page.getByRole('button', { name: 'Normal', exact: true });
    await normalBtns.first().click();

    await page.reload();
    await page.getByText('Settings', { exact: true }).click();

    // First "Normal" button should be selected
    const normalBtn = page.getByRole('button', { name: 'Normal', exact: true }).first();
    await expect(normalBtn).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  });

  test('version number is displayed', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings', { exact: true }).click();

    await expect(page.getByText(/VoiceBridge v\d+\.\d+\.\d+/)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Profile data entry', () => {
  test('edits patient name and it persists', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    const nameInput = page.getByPlaceholder('Full name');
    await nameInput.clear();
    await nameInput.fill('Jane Doe');

    // Navigate away and back
    await page.getByText(/Next/).click(); // go to step 2
    await page.getByText('Back').click(); // go back to step 1

    await expect(page.getByPlaceholder('Full name')).toHaveValue('Jane Doe');
  });

  test('condition quick-pick fills the input', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    await page.getByRole('button', { name: 'Stroke' }).click();

    await expect(page.getByPlaceholder('Condition')).toHaveValue('Stroke Recovery');
  });

  test('shows identity preview when fields are filled', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    // Default profile has name "Sarah" prefilled
    await expect(page.getByText(/Preview/)).toBeVisible();
    await expect(page.getByText(/My name is/)).toBeVisible();
  });

  test('adds and removes a family member', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    // Go to Family step
    await page.getByText(/Next/).click();

    // Add a family member
    await page.getByPlaceholder('Name').fill('Dr. Smith');
    await page.getByRole('button', { name: 'Doctor' }).click();
    await page.getByRole('button', { name: /Add Dr. Smith/ }).click();

    // Should appear in the list
    await expect(page.getByText('Dr. Smith')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Doctor$/ })).toBeVisible();

    // Remove it (click the ✕ next to Dr. Smith)
    const removeButtons = page.getByText('\u2715');
    await removeButtons.last().click();

    // Should be gone
    await expect(page.getByText('Dr. Smith')).not.toBeVisible();
  });

  test('adds a medication', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    // Go to Meds step (step 3)
    await page.getByText(/Next/).click();
    await page.getByText(/Next/).click();

    await page.getByPlaceholder('Medication').fill('Tylenol 500mg');
    await page.getByPlaceholder(/Schedule/).fill('Every 4 hours');
    await page.getByRole('button', { name: /Add Tylenol/ }).click();

    await expect(page.getByText('Tylenol 500mg')).toBeVisible();
    await expect(page.getByText('Every 4 hours')).toBeVisible();
  });

  test('wizard progress bar advances with steps', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Profile', { exact: true }).click();

    // Step headings change
    await expect(page.getByText('Identity')).toBeVisible();

    await page.getByText(/Next/).click();
    await expect(page.getByText('Family')).toBeVisible();

    await page.getByText(/Next/).click();
    await expect(page.getByText('Meds')).toBeVisible();

    await page.getByText(/Next/).click();
    await expect(page.getByText('Connect')).toBeVisible();
  });
});

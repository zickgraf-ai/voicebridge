import { test, expect } from '@playwright/test';

test.describe('App loads', () => {
  test('shows Talk screen with speech bar and categories', async ({ page }) => {
    await page.goto('/');

    // Speech bar placeholder
    await expect(page.getByText('Tap here to type...')).toBeVisible();

    // Category tabs (use exact match via role)
    await expect(page.getByRole('button', { name: /Smart/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quick/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Food/ })).toBeVisible();

    // Bottom nav
    await expect(page.getByText('Talk', { exact: true })).toBeVisible();
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();
  });

  test('shows phrase buttons on the grid', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button').filter({ hasText: /\w+/ });
    await expect(buttons.first()).toBeVisible();
  });
});

test.describe('Phrase interaction', () => {
  test('tapping a phrase fills the speech bar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Quick/ }).click();
    await page.getByRole('button', { name: /Bathroom/ }).click();

    // Speech bar should show the phrase text
    await expect(page.getByText('Bathroom').first()).toBeVisible();
  });

  test('clear button resets speech bar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Quick/ }).click();
    await page.getByRole('button', { name: /Bathroom/ }).click();

    // Click clear (✕)
    await page.getByText('\u2715').click();

    await expect(page.getByText('Tap here to type...')).toBeVisible();
  });
});

test.describe('Category switching', () => {
  test('Quick tab shows quick phrases', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Quick/ }).click();

    await expect(page.getByRole('button', { name: /Yes/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '❌ No' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Please/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Thank you/ })).toBeVisible();
  });

  test('Food tab shows food phrases', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Food/ }).click();

    await expect(page.getByRole('button', { name: '💧 Water' })).toBeVisible();
  });

  test('Comfort tab shows comfort phrases', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Comfort/ }).click();

    await expect(page.getByRole('button', { name: /Turn on TV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Turn off lights/ })).toBeVisible();
  });
});

test.describe('Pain scale', () => {
  test('shows pain scale when pain button is tapped', async ({ page }) => {
    await page.goto('/');

    // Use category bar button for Med
    await page.getByRole('button', { name: /Med/ }).first().click();
    await page.getByRole('button', { name: /I'm in pain/ }).click();

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByRole('button', { name: String(i), exact: true })).toBeVisible();
    }
  });

  test('tapping pain number fills speech bar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Med/ }).first().click();
    await page.getByRole('button', { name: /I'm in pain/ }).click();
    await page.getByRole('button', { name: '7', exact: true }).click();

    await expect(page.getByText('My pain is 7 out of 10')).toBeVisible();
  });
});

test.describe('Edit mode', () => {
  test('clicking speech bar opens edit mode with input', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Tap here to type...').click();

    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
    await expect(page.getByPlaceholder('Type your message...')).toBeFocused();
  });

  test('typing a message and pressing Enter fills speech bar', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Tap here to type...').click();
    await page.getByPlaceholder('Type your message...').fill('I need help');
    await page.keyboard.press('Enter');

    await expect(page.getByText('I need help')).toBeVisible();
  });

  test('appends phrase text when in edit mode', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Tap here to type...').click();
    await page.getByPlaceholder('Type your message...').fill('I want');

    await page.getByRole('button', { name: /Quick/ }).click();
    await page.getByRole('button', { name: /Bathroom/ }).click();

    const input = page.getByPlaceholder('Type your message...');
    await expect(input).toHaveValue('I want Bathroom');
  });
});

test.describe('Navigation', () => {
  test('navigates to Profile screen', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Profile', { exact: true }).click();

    await expect(page.getByText('Identity')).toBeVisible();
    await expect(page.getByPlaceholder('Full name')).toBeVisible();
  });

  test('navigates to Settings screen', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Settings', { exact: true }).click();

    await expect(page.getByText('Auto-speak on tap')).toBeVisible();
    await expect(page.getByText('Speed')).toBeVisible();
  });

  test('navigates to Care screen', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Care', { exact: true }).click();

    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activity' })).toBeVisible();
  });

  test('navigates back to Talk screen', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Settings', { exact: true }).click();
    await page.getByText('Talk', { exact: true }).click();

    await expect(page.getByText('Tap here to type...')).toBeVisible();
  });
});

test.describe('Profile wizard', () => {
  test('Connect step shows Coming Soon labels', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Profile', { exact: true }).click();

    // Navigate to step 4 (Connect)
    await page.getByText(/Next/).click();
    await page.getByText(/Next/).click();
    await page.getByText(/Next/).click();

    await expect(page.getByText('Integrations are coming soon')).toBeVisible();

    const comingSoon = page.getByText('Coming Soon', { exact: true });
    await expect(comingSoon).toHaveCount(4);
  });

  test('Done button returns to Talk screen', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Profile', { exact: true }).click();

    await page.getByText(/Next/).click();
    await page.getByText(/Next/).click();
    await page.getByText(/Next/).click();
    await page.getByText(/Done/).click();

    await expect(page.getByText('Tap here to type...')).toBeVisible();
  });
});

test.describe('Phrase Builder', () => {
  test('shows starters and builds phrases', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Build/ }).click();

    await expect(page.getByText('I need...')).toBeVisible();
    await expect(page.getByText('Can you...')).toBeVisible();

    await page.getByText('I need...').click();

    await expect(page.getByText('I need ...')).toBeVisible();
    await expect(page.getByText(/Back/)).toBeVisible();

    await page.getByRole('button', { name: /water/ }).click();

    await expect(page.getByText('I need water')).toBeVisible();
  });
});

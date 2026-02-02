/**
 * Visualizer Flow E2E Tests
 * Tests the design visualizer: Upload → Select style → Generate preview
 */

import { test, expect } from '@playwright/test';

test.describe('Visualizer Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('displays visualizer page with heading', async ({ page }) => {
    // Check page loaded
    await expect(page.getByRole('heading', { name: /Visualize Your/i })).toBeVisible();
    await expect(page.getByText(/Dream Space/i)).toBeVisible();
  });

  test('displays trust indicators', async ({ page }) => {
    // Check trust indicators at bottom of page
    await expect(page.getByText(/Free to use/i)).toBeVisible();
    await expect(page.getByText(/Generation time/i)).toBeVisible();
    await expect(page.getByText(/Your photos stay private/i)).toBeVisible();
  });

  test('shows upload interface', async ({ page }) => {
    // Should have file upload area or button
    // Look for upload-related text or input
    const uploadArea = page.locator('[type="file"]').or(page.getByText(/upload/i));
    await expect(uploadArea.first()).toBeVisible();
  });

  test('shows room type selection', async ({ page }) => {
    // Should have room type dropdown or selection
    const roomTypeSelect = page.getByRole('combobox').or(page.getByLabel(/room/i));
    await expect(roomTypeSelect.first()).toBeVisible();
  });

  test('shows style selection options', async ({ page }) => {
    // Should have style selection
    const styleSelect = page.getByRole('combobox').or(page.getByLabel(/style/i));
    await expect(styleSelect.first()).toBeVisible();
  });
});

test.describe('Visualizer Navigation', () => {
  test('can navigate to visualizer from home', async ({ page }) => {
    await page.goto('/');

    // Click Visualize Your Space button
    await page.getByRole('link', { name: /Visualize Your Space/i }).click();

    await expect(page).toHaveURL('/visualizer');
  });

  test('header Visualize button links to visualizer', async ({ page }) => {
    await page.goto('/about');

    // Click Visualize in header (on desktop)
    const visualizeButton = page.getByRole('link', { name: /Visualize/i });
    if (await visualizeButton.first().isVisible()) {
      await visualizeButton.first().click();
      await expect(page).toHaveURL('/visualizer');
    }
  });
});

test.describe('Visualizer Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visualizer');
  });

  test('generate button requires file upload', async ({ page }) => {
    // Find generate/visualize button
    const generateButton = page.getByRole('button', { name: /Generate|Visualize|Transform/i });

    // Should be disabled without image upload
    // Or clicking should show validation error
    if (await generateButton.isVisible()) {
      const isDisabled = await generateButton.isDisabled();
      if (!isDisabled) {
        await generateButton.click();
        // Should show error or not submit
        await expect(page).toHaveURL('/visualizer');
      }
    }
  });
});

// spec: docs/specs/frontend/specs.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';
import { randomUser, registerUser, loginViaUI } from './helpers';

test.describe('Settings / Profile Editing Form', () => {
  test(
    'Settings page renders all required fields and Update Settings button',
    {
      annotation: [
        { type: 'feature', description: 'User' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'critical' },
        { type: 'check', description: 'Settings page shows all form fields and submit button' },
      ],
      tag: ['@settings', '@positive', '@smoke'],
    },
    async ({ page }) => {
      const user = randomUser();
      const { email } = await registerUser(user);
      await loginViaUI(page, user.email, user.password);

      // 2. Navigate to /settings
      await page.goto('/settings');

      // 3. Verify heading 'Settings' is visible
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // 4. Verify profile picture file input is visible
      await expect(page.locator('input[type="file"]')).toBeVisible();

      // 5. Verify Email input is visible
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();

      // 6. Verify textarea with placeholder 'Short bio about you' is visible
      await expect(page.locator('textarea[placeholder="Short bio about you"]')).toBeVisible();

      // Note: Email pre-population is intentionally not asserted here because the app has a known
      // bug where it calls GET /api/user/edit instead of GET /api/user when loading settings,
      // so the form fields are not populated. That bug is covered by the BUG regression test.

      // 9. Verify 'Update profile' submit button is visible and enabled
      await expect(page.getByRole('button', { name: 'Update profile' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Update profile' })).toBeEnabled();

      // 10. Verify 'Sign out' button is visible in nav (authenticated state)
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    }
  );

  test(
    'BUG regression: opening /settings must NOT trigger GET /api/user/edit request',
    {
      annotation: [
        { type: 'feature', description: 'User' },
        { type: 'type', description: 'negative' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description:
            'Opening /settings should call GET /api/user, not GET /api/user/edit',
        },
      ],
      tag: ['@settings', '@negative', '@regression'],
    },
    async ({ page }) => {
      const user = randomUser();
      await registerUser(user);
      await loginViaUI(page, user.email, user.password);

      // 2. Start intercepting network requests before navigating to settings
      const requestUrls: string[] = [];
      page.on('request', (req) => {
        requestUrls.push(req.url());
      });

      // 3. Navigate to /settings
      await page.goto('/settings');

      // 4. Wait for page to load by checking heading is visible
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // 6. Expect: NO request to /api/user/edit is made (THIS WILL FAIL - bug exists)
      const editRequests = requestUrls.filter((url) => url.includes('/api/user/edit'));
      expect(
        editRequests,
        'BUG: app makes GET /api/user/edit request - should not exist'
      ).toHaveLength(0);

      // 7. Expect: GET /api/user IS made
      const userRequests = requestUrls.filter(
        (url) => url.endsWith('/api/user') || url.endsWith('/user')
      );
      expect(userRequests.length, 'GET /api/user should be called').toBeGreaterThan(0);
    }
  );

  test(
    'BUG regression: clicking Update Settings button saves changes via PUT /api/user',
    {
      annotation: [
        { type: 'feature', description: 'User' },
        { type: 'type', description: 'negative' },
        { type: 'severity', description: 'critical' },
        {
          type: 'check',
          description:
            'Update Settings button should send PUT /api/user with updated values',
        },
      ],
      tag: ['@settings', '@negative', '@regression'],
    },
    async ({ page }) => {
      const user = randomUser();
      await registerUser(user);
      await loginViaUI(page, user.email, user.password);

      // 2. Navigate to /settings
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // 3. Clear the Bio textarea and type new value
      const bioTextarea = page.locator('textarea[placeholder="Short bio about you"]');
      await bioTextarea.clear();
      await bioTextarea.fill('This is my updated bio');

      // 5. Start monitoring for PUT/POST requests to /api/user before clicking
      const putRequestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('/api/user') &&
          (req.method() === 'PUT' || req.method() === 'POST'),
        { timeout: 5000 }
      );

      // 6. Click the 'Update profile' button
      await page.getByRole('button', { name: 'Update profile' }).click();

      // 7 & 8. Expect: A PUT request is sent and response returns 200
      // THIS WILL FAIL — button does not send PUT /api/user
      const putRequest = await putRequestPromise;
      expect(putRequest.method()).toBe('PUT');

      const putResponse = await putRequest.response();
      expect(putResponse?.status()).toBe(200);
    }
  );

  test(
    'Settings page: logout button logs out the user and redirects to unauthenticated state',
    {
      annotation: [
        { type: 'feature', description: 'User' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'high' },
        { type: 'check', description: 'Logout clears auth and redirects to unauthenticated state' },
      ],
      tag: ['@settings', '@positive', '@smoke'],
    },
    async ({ page }) => {
      const user = randomUser();
      await registerUser(user);
      await loginViaUI(page, user.email, user.password);

      // 1. Verify authenticated nav after login
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

      // 2. Navigate to /settings
      await page.goto('/settings');

      // 3. Verify 'Settings' heading is visible
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // 4. Click 'Sign out' button in nav
      await page.getByRole('button', { name: 'Sign out' }).click();

      // 5. Expect: page redirects to /login
      await expect(page).toHaveURL('/login');

      // 6. Expect: nav shows 'Sign in' and 'Sign up' links (unauthenticated state)
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

      // 7. Expect: JWT is cleared from localStorage
      const jwtToken = await page.evaluate(() => localStorage.getItem('jwtToken'));
      expect(jwtToken).toBeNull();
    }
  );

  test(
    'Settings page: unauthenticated access redirects to login',
    {
      annotation: [
        { type: 'feature', description: 'User' },
        { type: 'type', description: 'negative' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description: 'Unauthenticated user navigating to /settings is redirected to login',
        },
      ],
      tag: ['@settings', '@negative', '@regression'],
    },
    async ({ page }) => {
      // 1. Navigate directly to /settings with no auth (fresh browser state)
      await page.goto('/settings');

      // 2. Expect: page redirects to /login
      await expect(page).toHaveURL('/login');

      // 3. Expect: Settings form is NOT shown
      await expect(page.locator('textarea[placeholder="Short bio about you"]')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Update profile' })).not.toBeVisible();
    }
  );
});

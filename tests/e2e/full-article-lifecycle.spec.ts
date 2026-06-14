// spec: docs/specs/frontend/specs.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Full Article Lifecycle', () => {
  test('User can register, publish article, comment on it, and delete it', async ({ page }) => {
    const timestamp = Date.now();
    const username = `lifecycleuser_${timestamp}`;
    const email = `lifecycleuser_${timestamp}@example.com`;
    const password = 'Password123!';

    // 1. Navigate to /register
    await page.goto('/register');

    // 2. Fill Username field with a unique timestamp-based name
    await page.getByRole('textbox', { name: 'Username' }).fill(username);

    // 3. Fill Email field with matching unique email
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);

    // 4. Fill Password field with 'Password123!'
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);

    // 5. Fill Password confirmation field with 'Password123!'
    await page.getByRole('textbox', { name: 'Password confirmation' }).fill(password);

    // 6. Click 'Sign up' button → expect redirect to home, nav shows username and 'Sign out'
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: username })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // 7. Click 'Sign out', then navigate to /login
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    // 8. Fill Email and Password on login form, click 'Sign in' → expect redirect to home with authenticated nav
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // 9. Navigate to /editor (New Article)
    await page.goto('/editor');

    // 10. Fill Article Title input with 'My Lifecycle Test Article'
    await page.getByRole('textbox', { name: 'Article Title' }).fill('My Lifecycle Test Article');

    // 11. Fill description input
    await page.getByRole('textbox', { name: "What's this article about?" }).fill('A short description for the lifecycle test');

    // 12. Fill body textarea
    await page.getByRole('textbox', { name: 'Write your article (in' }).fill('This is the body of the lifecycle test article.');

    // 13. Fill tags input with 'lifecycle test'
    await page.getByRole('textbox', { name: 'Enter tags (separated by' }).fill('lifecycle test');

    // 14. Click 'Publish Article' button → expect redirect to /article/:slug, article heading and body visible
    await page.getByRole('button', { name: 'Publish Article' }).click();
    await expect(page).toHaveURL('/article/my-lifecycle-test-article');
    await expect(page.getByRole('heading', { name: 'My Lifecycle Test Article', level: 1 })).toBeVisible();
    await expect(page.getByText('This is the body of the lifecycle test article.')).toBeVisible();

    // 15. Fill comment textarea with 'This is my test comment.'
    await page.getByRole('textbox', { name: 'Write a comment...' }).fill('This is my test comment.');

    // 16. Click 'Post Comment' button → expect comment appears in list, textarea cleared
    await page.getByRole('button', { name: 'Post Comment' }).click();
    await expect(page.getByText('This is my test comment.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a comment...' })).toHaveValue('');

    // 17. Set up dialog handler to accept, then click the 'Delete' button → expect redirect to home
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: ' Delete' }).click();
    await expect(page).toHaveURL('/');
  });
});

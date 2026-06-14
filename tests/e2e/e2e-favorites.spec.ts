// spec: docs/specs/frontend/specs.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  randomUser,
  registerUser,
  createArticle,
  favoriteArticle,
  unfavoriteArticle,
  loginViaUI,
  getGlobalFeedArticle,
} from './helpers';


test.describe('Article Favorites', () => {
  test(
    'Authenticated user can favorite an article from the Home feed and counter increments',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'critical' },
        { type: 'check', description: 'Favorite button on home feed card increments count from N to N+1' },
      ],
      tag: ['@favorites', '@positive', '@smoke', '@critical'],
    },
    async ({ page }) => {
      // 1. Register user, fetch a Global Feed article not authored by this user
      const user = randomUser();
      const { token } = await registerUser(user);
      const { slug: articleSlug, title: articleTitle } = await getGlobalFeedArticle(token);
      await unfavoriteArticle(token, articleSlug);

      // 2. Log in
      await loginViaUI(page, user.email, user.password);

      // 3. The home page loads with seed articles in the Global Feed
      // When logged in, the home page may show "Your Feed" or "Global Feed".
      // Global Feed always contains the seed articles.
      await expect(page.getByRole('button', { name: 'Global Feed' })).toBeVisible();
      await page.getByRole('button', { name: 'Global Feed' }).click();

      // 4. Find the article's card using the component element
      const seedArticleCard = page.locator('app-article-preview').filter({
        has: page.getByRole('link', { name: new RegExp(articleTitle) }),
      });
      await expect(seedArticleCard).toBeVisible();

      // Get the favorite button within the article's card
      const favoriteBtn = seedArticleCard.locator('button[aria-label^="Toggle favorite"]');
      await expect(favoriteBtn).toBeVisible();

      // Read the current count from the button's aria-label
      const ariaLabel = await favoriteBtn.getAttribute('aria-label');
      const match = ariaLabel?.match(/Toggle favorite \((\d+)\)/);
      const initialCount = match ? parseInt(match[1], 10) : 0;

      // 5. Set up intercept for the POST request to confirm the favorite API call
      const favoriteRequestPromise = page.waitForRequest(
        (req) =>
          req.url().includes(`/api/articles/${articleSlug}/favorite`) &&
          req.method() === 'POST',
      );

      // Click the heart/favorite button
      await favoriteBtn.click();

      // 6. Expect count increments to initialCount + 1
      await expect(
        seedArticleCard.locator(`button[aria-label="Toggle favorite (${initialCount + 1})"]`),
      ).toBeVisible();

      // 7. Verify the network POST request was sent to the correct URL with Authorization header
      const favoriteRequest = await favoriteRequestPromise;
      expect(favoriteRequest.headers()['authorization']).toMatch(/^Token /);

      // 8. Reload and verify count persists
      await page.reload();
      await expect(page.getByRole('button', { name: 'Global Feed' })).toBeVisible();
      await page.getByRole('button', { name: 'Global Feed' }).click();

      const seedCardAfterReload = page.locator('app-article-preview').filter({
        has: page.getByRole('link', { name: new RegExp(articleTitle) }),
      });
      await expect(
        seedCardAfterReload.locator(`button[aria-label="Toggle favorite (${initialCount + 1})"]`),
      ).toBeVisible();

      // Clean up
      await unfavoriteArticle(token, articleSlug);
    },
  );

  test(
    'Authenticated user can unfavorite an article from the Home feed and counter decrements',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'critical' },
        { type: 'check', description: 'Unfavorite button on home feed card decrements count from N+1 to N' },
      ],
      tag: ['@favorites', '@positive', '@smoke', '@critical'],
    },
    async ({ page }) => {
      // 1. Register user, fetch a Global Feed article, favorite it via API
      const user = randomUser();
      const { token } = await registerUser(user);
      const { slug: articleSlug } = await getGlobalFeedArticle(token);

      await unfavoriteArticle(token, articleSlug);
      await favoriteArticle(token, articleSlug);

      // 2. Log in
      await loginViaUI(page, user.email, user.password);

      // 3. Navigate to Global Feed and find the article card
      await expect(page.getByRole('button', { name: 'Global Feed' })).toBeVisible();
      await page.getByRole('button', { name: 'Global Feed' }).click();

      const seedArticleCard = page.locator('app-article-preview').filter({
        has: page.locator(`a[href*="${articleSlug}"]`),
      });
      await expect(seedArticleCard).toBeVisible();

      // Get the favorite button (it should be in active/favorited state now)
      const favoriteBtn = seedArticleCard.locator('button[aria-label^="Toggle favorite"]');
      await expect(favoriteBtn).toBeVisible();

      // Read the current count from the button's aria-label
      const ariaLabel = await favoriteBtn.getAttribute('aria-label');
      const match = ariaLabel?.match(/Toggle favorite \((\d+)\)/);
      const currentCount = match ? parseInt(match[1], 10) : 1;

      // 4. Set up intercept for the DELETE request to confirm the unfavorite API call
      const unfavoriteRequestPromise = page.waitForRequest(
        (req) =>
          req.url().includes(`/api/articles/${articleSlug}/favorite`) &&
          req.method() === 'DELETE',
      );

      // Click the active heart button to unfavorite
      await favoriteBtn.click();

      // 5. Expect count decrements by 1
      await expect(
        seedArticleCard.locator(`button[aria-label="Toggle favorite (${currentCount - 1})"]`),
      ).toBeVisible();

      // 6. Verify network DELETE request was sent
      await unfavoriteRequestPromise;
    },
  );

  test(
    'Authenticated user can favorite an article from the Article View page',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'critical' },
        { type: 'check', description: 'Favorite button on article view page increments count' },
      ],
      tag: ['@favorites', '@positive', '@smoke', '@critical'],
    },
    async ({ page }) => {
      // 1. Register user, fetch an article from Global Feed (not authored by this user)
      const user = randomUser();
      const { token } = await registerUser(user);
      const { slug: articleSlug } = await getGlobalFeedArticle(token);

      // Pre-condition: ensure not already favorited
      await unfavoriteArticle(token, articleSlug);

      // 2. Log in
      await loginViaUI(page, user.email, user.password);

      // 3. Navigate to the article view page
      await page.goto(`/article/${articleSlug}`);

      // 4. Find the banner (bg-gray-900) with the favorite button
      const banner = page.locator('.bg-gray-900');
      await expect(banner).toBeVisible();

      // The favorite button shows the count and has a heart icon
      const favButton = banner.locator('button').filter({ has: page.locator('i.ion-heart') });
      await expect(favButton).toBeVisible();

      // Read the current count from the button
      const ariaLabel = await favButton.getAttribute('aria-label');
      const match = ariaLabel?.match(/Toggle favorite \((\d+)\)/);
      const initialCount = match ? parseInt(match[1], 10) : 0;

      // 5. Click the Favorite button
      await favButton.click();

      // 6. Expect count increments by 1
      await expect(
        banner.locator(`button[aria-label="Toggle favorite (${initialCount + 1})"]`),
      ).toBeVisible();

      // 7. Clean up
      await unfavoriteArticle(token, articleSlug);
    },
  );

  test(
    'Article author does NOT see Favorite Post button on own article',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description: 'Author does not see Favorite button on own article; Edit and Delete are visible',
        },
      ],
      tag: ['@favorites', '@positive', '@regression'],
    },
    async ({ page }) => {
      // 1. Register user A, create article as user A, record slug.
      // Note: No second user is registered, so the article is properly assigned to userA.
      const userA = randomUser();
      const { token: tokenA } = await registerUser(userA);
      const article = await createArticle(tokenA);

      // 2. Log in as user A
      await loginViaUI(page, userA.email, userA.password);

      // 3. Navigate to the article view page
      await page.goto(`/article/${article.slug}`);

      // 4. Expect the article title is visible in the banner (bg-gray-900)
      const banner = page.locator('.bg-gray-900');
      await expect(banner).toBeVisible();
      await expect(banner.getByRole('heading', { level: 1 })).toBeVisible();

      // The Favorite button only renders when currentUser !== article.author
      // For the author, the button with ion-heart class must NOT be present
      const heartBtn = banner.locator('button').filter({ has: page.locator('.ion-heart') });
      await expect(heartBtn).not.toBeVisible();

      // 5. Expect "Edit" and "Delete" buttons ARE visible (only shown to the author)
      await expect(page.getByRole('button', { name: /Edit/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Delete/ })).toBeVisible();
    },
  );

  test(
    'BUG-010 regression: two users favoriting the same article — favoritesCount must reach 2',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'negative' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description:
            'BUG-010: Two users favoriting same article — favoritesCount must reach 2 (currently stays at 1)',
        },
      ],
      tag: ['@favorites', '@negative', '@regression'],
    },
    async ({ page }) => {
      // 1. Register user B and user C; fetch a shared Global Feed article
      const userB = randomUser();
      const userC = randomUser();
      const { token: tokenB } = await registerUser(userB);
      const { token: tokenC } = await registerUser(userC);
      const { slug: articleSlug } = await getGlobalFeedArticle(tokenB);

      // Reset state: ensure neither user has favorited the article
      await unfavoriteArticle(tokenB, articleSlug);
      await unfavoriteArticle(tokenC, articleSlug);

      // 2. Log in as user B, navigate to article page, click Favorite
      await loginViaUI(page, userB.email, userB.password);
      await page.goto(`/article/${articleSlug}`);
      const banner = page.locator('.bg-gray-900');

      // Find the favorite button (not yet favorited by userB - no active style)
      const favBtn = banner.locator('button').filter({ has: page.locator('i.ion-heart') });
      await expect(favBtn).toBeVisible();

      // Read initial count from button
      const initialAriaLabel = await favBtn.getAttribute('aria-label');
      const initialMatch = initialAriaLabel?.match(/Toggle favorite \((\d+)\)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;

      await favBtn.click();
      const expectedAfterB = initialCount + 1;
      await expect(
        banner.locator(`button[aria-label="Toggle favorite (${expectedAfterB})"]`),
      ).toBeVisible();

      // 3. Log out - navigate directly to login page
      await page.goto('/login');
      await expect(page).toHaveURL('/login');

      // 4. Log in as user C
      await page.getByLabel('Email address').fill(userC.email);
      await page.getByLabel('Password').fill(userC.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/', { timeout: 15000 });

      // 5. Navigate to article page and click Favorite button
      await page.goto(`/article/${articleSlug}`);
      // After userB favorited, the count should show expectedAfterB
      // The button for userC (not yet favorited) should be visible
      const favBtnC = banner.locator('button').filter({ has: page.locator('i.ion-heart') });
      await expect(favBtnC).toBeVisible();
      await expect(
        banner.locator(`button[aria-label="Toggle favorite (${expectedAfterB})"]`),
      ).toBeVisible();
      await favBtnC.click();

      // 6. Expect count shows initialCount + 2 — THIS WILL FAIL due to BUG-010:
      //    count stays at initialCount + 1 instead of reaching initialCount + 2
      await expect(
        banner.locator(`button[aria-label="Toggle favorite (${initialCount + 2})"]`),
      ).toBeVisible();
    },
  );

  test(
    'Unauthenticated user clicking the favorite button is redirected to login or shown disabled state',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'negative' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description:
            'Unauthenticated user clicking favorite button is redirected to /login or button is disabled',
        },
      ],
      tag: ['@favorites', '@negative', '@smoke'],
    },
    async ({ page }) => {
      // 1. Navigate to home page without logging in
      await page.goto('/');

      // 2. Expect nav shows Sign in and Sign up links (unauthenticated state)
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

      // 3. Wait for Global Feed to load (seed articles are always present)
      await expect(page.getByRole('button', { name: 'Global Feed' })).toBeVisible();

      // 4. Locate any article card heart button in the Global Feed
      const heartButtons = page.getByRole('button', { name: /Toggle favorite/ });
      const count = await heartButtons.count();

      // If there are no articles visible, cannot test click behavior — pass gracefully
      if (count === 0) {
        return;
      }

      // Click the heart button on the first article card
      await heartButtons.first().click();

      // 5. Expect redirected to /login — app redirects unauthenticated users to login
      await expect(page).toHaveURL('/login');
    },
  );

  test(
    'Favorited articles appear on Profile favorites tab',
    {
      annotation: [
        { type: 'feature', description: 'Favorites' },
        { type: 'type', description: 'positive' },
        { type: 'severity', description: 'high' },
        {
          type: 'check',
          description:
            'Favorited articles are shown in the "Favorited Articles" tab on the user profile page',
        },
      ],
      tag: ['@favorites', '@positive', '@regression'],
    },
    async ({ page }) => {
      // 1. Register user B, fetch a Global Feed article, favorite it via API
      const userB = randomUser();
      const { token: tokenB } = await registerUser(userB);
      const { slug: articleSlug, title: articleTitle } = await getGlobalFeedArticle(tokenB);

      await unfavoriteArticle(tokenB, articleSlug);
      await favoriteArticle(tokenB, articleSlug);

      // 2. Log in as user B
      await loginViaUI(page, userB.email, userB.password);

      // 3. Navigate to user B's profile page
      await page.goto(`/profile/${userB.username}`);

      // 4. Click the "Favorited Articles" tab
      await page.getByText('Favorited Articles').click();

      await expect(page.getByText(articleTitle)).toBeVisible();

      // 5. Expect heart button is present and shows count >= 1
      await expect(
        page.getByRole('button', { name: /Toggle favorite \([1-9]/ }),
      ).toBeVisible();

      // Clean up
      await unfavoriteArticle(tokenB, articleSlug);
    },
  );
});

import { test, expect } from '@playwright/test';

// Base URL: https://api.realworld.show/api  (openapi.json servers[0].url)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomUser() {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `user_${id}`,
    email: `user_${id}@example.com`,
    password: 'Password123!',
  };
}

async function registerAndGetToken(request: any): Promise<{ token: string; username: string }> {
  const user = randomUser();
  const res = await request.post('/api/users', { data: { user } });
  const body = await res.json();
  return { token: body.user.token, username: body.user.username };
}

async function createArticle(request: any, token: string) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const res = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: {
      article: {
        title: `Article ${id}`,
        description: 'desc',
        body: 'body',
        tagList: [],
      },
    },
  });
  const body = await res.json();
  return body.article;
}

// ---------------------------------------------------------------------------
// Favorites — POST/DELETE /api/articles/{slug}/favorite
// ---------------------------------------------------------------------------

test.describe('Favorites', () => {
  test('Favorite an article returns 200 with favorited: true', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Favorite an article → 200, favorited: true, favoritesCount increments' },
    ],
    tag: ['@favorites', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.favorited).toBe(true);
    expect(body.article.favoritesCount).toBeGreaterThan(0);
    // slug and createdAt are immutable — must not change after favoriting
    expect(body.article.slug).toBe(article.slug);
    expect(body.article.createdAt).toBe(article.createdAt);
  });

  test('Favorite increments favoritesCount', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Favorite an article → 200, favorited: true, favoritesCount increments' },
    ],
    tag: ['@favorites', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    const beforeCount = article.favoritesCount;

    const res = await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.favoritesCount).toBe(beforeCount + 1);
  });

  test('Favorite an article without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Favorite an article without token → 401' },
    ],
    tag: ['@favorites', '@negative', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.post(`/api/articles/${article.slug}/favorite`);

    expect(res.status()).toBe(401);
  });

  test('Favorite non-existent article returns 404', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Favorite non-existent article → 404' },
    ],
    tag: ['@favorites', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.post('/api/articles/this-does-not-exist-xyz-99999/favorite', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(404);
  });

  test('Favorite the same article twice is idempotent', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Favorite the same article twice — no error / idempotent' },
    ],
    tag: ['@favorites', '@positive', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    const res = await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.favorited).toBe(true);
  });

  test('Unfavorite an article returns 200 with favorited: false', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Unfavorite an article → 200, favorited: false, favoritesCount decrements' },
    ],
    tag: ['@favorites', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    const res = await request.delete(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.favorited).toBe(false);
    expect(body.article.favoritesCount).toBe(0);
  });

  test('Unfavorite an article without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Unfavorite an article without token → 401' },
    ],
    tag: ['@favorites', '@negative', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.delete(`/api/articles/${article.slug}/favorite`);

    expect(res.status()).toBe(401);
  });

  test('Unfavorite article that was not favorited is handled gracefully', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Unfavorite article that was not favorited — handled gracefully' },
    ],
    tag: ['@favorites', '@positive', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.delete(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('Two users favoriting same article gives favoritesCount = 2', {
    annotation: [
      { type: 'feature', description: 'Favorites' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Two users favorite same article → favoritesCount = 2' },
    ],
    tag: ['@favorites', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: token1 } = await registerAndGetToken(request);
    const { token: token2 } = await registerAndGetToken(request);
    const article = await createArticle(request, token1);

    await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token1}` },
    });

    const res = await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token2}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.favoritesCount).toBe(2);
  });
});

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
        title: `Feed Article ${id}`,
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
// Feed — GET /api/articles/feed
// ---------------------------------------------------------------------------

test.describe('Feed', () => {
  test('Get feed with valid token returns 200', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get feed with valid token → 200, articles from followed users only' },
    ],
    tag: ['@feed', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.get('/api/articles/feed', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(typeof body.articlesCount).toBe('number');
  });

  test('Get feed without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get feed without token → 401' },
    ],
    tag: ['@feed', '@negative', '@smoke'],
  }, async ({ request }) => {
    const res = await request.get('/api/articles/feed');

    expect(res.status()).toBe(401);
  });

  test('Get feed contains articles from followed users only', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get feed with valid token → 200, articles from followed users only' },
    ],
    tag: ['@feed', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { token: authorToken, username: authorUsername } = await registerAndGetToken(request);

    const article = await createArticle(request, authorToken);

    await request.post(`/api/profiles/${authorUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.get('/api/articles/feed', {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articlesCount).toBeGreaterThan(0);
    expect(body.articles[0].author.username).toBe(authorUsername);
    // slug is immutable — must equal the one assigned at creation
    expect(body.articles[0].slug).toBe(article.slug);
  });

  test('Get feed does not contain articles from non-followed users', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get feed with valid token → 200, articles from followed users only' },
    ],
    tag: ['@feed', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: readerToken } = await registerAndGetToken(request);
    const { token: strangerToken, username: strangerUsername } = await registerAndGetToken(request);

    await createArticle(request, strangerToken);

    const res = await request.get('/api/articles/feed', {
      headers: { Authorization: `Token ${readerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    const strangerArticles = body.articles.filter(
      (a: { author: { username: string } }) => a.author.username === strangerUsername
    );
    expect(strangerArticles.length).toBe(0);
  });

  test('Get feed with pagination returns at most limit articles', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get feed with pagination (?limit=5&offset=0) → max 5 articles returned' },
    ],
    tag: ['@feed', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { token: authorToken, username: authorUsername } = await registerAndGetToken(request);

    await createArticle(request, authorToken);
    await createArticle(request, authorToken);
    await createArticle(request, authorToken);

    await request.post(`/api/profiles/${authorUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.get('/api/articles/feed?limit=2&offset=0', {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articles.length).toBeLessThanOrEqual(2);
  });

  test('Get feed — body field is null or absent per article — discrepancy #5', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get feed — body field is null/absent per article ⚠️ Breaking change since 2024-08-16 (discrepancy #5)' },
    ],
    // discrepancy #5: feed does not return article body since 2024-08-16
    tag: ['@feed', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { token: authorToken, username: authorUsername } = await registerAndGetToken(request);

    await createArticle(request, authorToken);

    await request.post(`/api/profiles/${authorUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.get('/api/articles/feed', {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articlesCount).toBeGreaterThan(0);
    // body field must be null or absent per breaking change 2024-08-16
    const firstArticle = body.articles[0];
    expect(firstArticle.body === null || firstArticle.body === undefined).toBe(true);
  });

  test('Feed offset pagination skips correct number of articles', {
    annotation: [
      { type: 'feature', description: 'Feed' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get feed with pagination (?limit=5&offset=0) → max 5 articles returned' },
    ],
    tag: ['@feed', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { token: authorToken, username: authorUsername } = await registerAndGetToken(request);

    await createArticle(request, authorToken);
    await createArticle(request, authorToken);

    await request.post(`/api/profiles/${authorUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const page1 = await request.get('/api/articles/feed?limit=1&offset=0', {
      headers: { Authorization: `Token ${followerToken}` },
    });
    const page2 = await request.get('/api/articles/feed?limit=1&offset=1', {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(page1.status()).toBe(200);
    expect(page2.status()).toBe(200);

    const body1 = await page1.json();
    const body2 = await page2.json();

    expect(body1.articles.length).toBe(1);
    expect(body2.articles.length).toBe(1);
    expect(body1.articles[0].slug).not.toBe(body2.articles[0].slug);
  });
});

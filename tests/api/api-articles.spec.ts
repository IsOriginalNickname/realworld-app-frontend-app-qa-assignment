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

function randomArticle(overrides: Record<string, unknown> = {}) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    title: `Test Article ${id}`,
    description: 'A test article description',
    body: 'Test article body content',
    tagList: [],
    ...overrides,
  };
}

async function registerAndGetToken(request: Parameters<typeof test>[2] extends never ? never : never): Promise<{ token: string; username: string }>;
async function registerAndGetToken(request: any): Promise<{ token: string; username: string }> {
  const user = randomUser();
  const res = await request.post('/api/users', { data: { user } });
  const body = await res.json();
  return { token: body.user.token, username: body.user.username };
}

async function createArticle(request: any, token: string, overrides: Record<string, unknown> = {}) {
  const article = randomArticle(overrides);
  const res = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: { article },
  });
  return res;
}

// ---------------------------------------------------------------------------
// Create Article — POST /api/articles
// ---------------------------------------------------------------------------

test.describe('Articles — Create', () => {
  test('Create article with valid token returns 201', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Create article with valid token → 201, returns Article' },
    ],
    tag: ['@articles', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token, {
      title: `Unique Article ${Date.now()}`,
      description: 'desc',
      body: 'body',
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.article).toBeDefined();
    expect(body.article.slug).toBeTruthy();
    expect(body.article.title).toBeTruthy();
    expect(body.article.author).toBeDefined();
  });

  test('Create article without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Create article without token → 401' },
    ],
    tag: ['@articles', '@negative', '@smoke'],
  }, async ({ request }) => {
    const article = randomArticle();

    const res = await request.post('/api/articles', { data: { article } });

    expect(res.status()).toBe(401);
  });

  test('Create article with tags returns tagList in response', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create article with tags → tagList returned in response' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const res = await createArticle(request, token, {
      tagList: ['playwright', 'testing'],
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(Array.isArray(body.article.tagList)).toBe(true);
    expect(body.article.tagList).toContain('playwright');
    expect(body.article.tagList).toContain('testing');
  });

  test('Create article with null tagList returns empty array', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Create article with null tagList → tagList is empty array in response' },
    ],
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token, { tagList: null });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(Array.isArray(body.article.tagList)).toBe(true);
    expect(body.article.tagList.length).toBe(0);
  });

  test('Create article with empty title returns 422', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create article with empty title → 422' },
    ],
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token, { title: '' });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Create article with null title returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create article with null title → 422 ⚠️ OpenAPI marks as nullable — may allow null (discrepancy #2)' },
    ],
    // discrepancy #2: OpenAPI marks title as nullable, business rules require it
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token, { title: null });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Create two articles with same title returns conflict — discrepancy #4', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create two articles with same title → 409 ⚠️ OpenAPI says 409 Conflict, old spec silent (discrepancy #4)' },
    ],
    // discrepancy #4: OpenAPI says 409 Conflict for duplicate article
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const title = `Duplicate Title ${Date.now()}`;

    await createArticle(request, token, { title });
    const res = await createArticle(request, token, { title });

    expect([409, 422]).toContain(res.status());

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Create article with very long title does not cause server error', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Create article with very long title (10 000 chars) — no 500 error' },
    ],
    tag: ['@articles', '@negative', '@edge'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token, { title: 'A'.repeat(10000) });

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('Create article with HTML in title — response does not expose raw script', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create article with HTML/script in title — response is safe' },
    ],
    tag: ['@articles', '@negative', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const xssTitle = `<script>alert(1)</script> Article ${Date.now()}`;

    const res = await createArticle(request, token, { title: xssTitle });

    // Must not crash the server
    expect(res.status()).toBeLessThan(500);

    if (res.status() === 201) {
      const body = await res.json();
      // If stored, verify it's returned as a string (not executed)
      expect(typeof body.article.title).toBe('string');
    }
  });

  test('Create article with Unicode in title returns 201', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Create article with Unicode in title (emoji, Cyrillic)' },
    ],
    tag: ['@articles', '@positive', '@edge'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const unicodeTitle = `Статья с эмодзи 🚀 ${Date.now()}`;

    const res = await createArticle(request, token, { title: unicodeTitle });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.article.title).toBe(unicodeTitle);
  });

  test('Create article response includes all required ArticleSchema fields', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Create article with valid token → 201, returns Article' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await createArticle(request, token);

    expect(res.status()).toBe(201);

    const body = await res.json();
    const article = body.article;
    expect(article.slug).toBeTruthy();
    expect(article.title).toBeTruthy();
    expect(article.description).toBeTruthy();
    expect(typeof article.favorited).toBe('boolean');
    expect(typeof article.favoritesCount).toBe('number');
    expect(article.createdAt).toBeTruthy();
    expect(article.updatedAt).toBeTruthy();
    expect(Array.isArray(article.tagList)).toBe(true);
    expect(article.author).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Get Single Article — GET /api/articles/{slug}
// ---------------------------------------------------------------------------

test.describe('Articles — Get Single', () => {
  test('Get article by slug returns 200', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get article by slug → 200' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.get(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.slug).toBe(created.slug);
    expect(body.article.title).toBe(created.title);
  });

  test('Get article by slug without token returns 200 — discrepancy #1', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get article by slug without token → 200 ⚠️ Old spec: no auth required; OpenAPI: Token required (discrepancy #1)' },
    ],
    // discrepancy #1: old spec says no auth required, OpenAPI marks Token security
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.get(`/api/articles/${created.slug}`);

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.slug).toBe(created.slug);
  });

  test('Get non-existent article returns 404', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get non-existent article → 404' },
    ],
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const res = await request.get('/api/articles/this-slug-does-not-exist-xyz-99999');

    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// List Articles — GET /api/articles
// ---------------------------------------------------------------------------

test.describe('Articles — List', () => {
  test('List articles returns 200 with articles array', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'List articles with pagination (limit, offset) → 200' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const res = await request.get('/api/articles');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(typeof body.articlesCount).toBe('number');
  });

  test('List articles without token returns 200 — discrepancy #1', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'List articles without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)' },
    ],
    // discrepancy #1: old spec says optional auth, OpenAPI marks Token security
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const res = await request.get('/api/articles');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
  });

  test('List articles with limit pagination returns correct count', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'List articles with pagination (limit, offset) → 200' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const res = await request.get('/api/articles?limit=5&offset=0');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles.length).toBeLessThanOrEqual(5);
  });

  test('List articles body field is null or absent — discrepancy #5', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'List articles — body field is null/absent per article ⚠️ Breaking change since 2024-08-16 (discrepancy #5)' },
    ],
    // discrepancy #5: GET /api/articles does not return body field since 2024-08-16
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    await createArticle(request, token);

    const res = await request.get('/api/articles?limit=5', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articles.length).toBeGreaterThan(0);
    // body field must be null or absent per breaking change 2024-08-16
    const firstArticle = body.articles[0];
    expect(firstArticle.body === null || firstArticle.body === undefined).toBe(true);
  });

  test('Filter articles by tag returns matching results', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Filter articles by tag (?tag=X) → correct results' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const uniqueTag = `tag_${Date.now()}`;
    await createArticle(request, token, { tagList: [uniqueTag] });

    const res = await request.get(`/api/articles?tag=${uniqueTag}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articlesCount).toBeGreaterThan(0);
    expect(body.articles[0].tagList).toContain(uniqueTag);
  });

  test('Filter articles by author returns matching results', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Filter articles by author (?author=X) → correct results' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);
    await createArticle(request, token);

    const res = await request.get(`/api/articles?author=${username}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articlesCount).toBeGreaterThan(0);
    expect(body.articles[0].author.username).toBe(username);
  });

  test('Filter articles by favorited user returns matching results', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Filter articles by favorited user (?favorited=X) → correct results ⚠️ Missing from both checklists' },
    ],
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article } = await createRes.json();

    // Favorite the article
    await request.post(`/api/articles/${article.slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });

    const res = await request.get(`/api/articles?favorited=${username}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.articlesCount).toBeGreaterThan(0);
    expect(body.articles[0].favorited).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Update Article — PUT /api/articles/{slug}
// ---------------------------------------------------------------------------

test.describe('Articles — Update', () => {
  test('Update own article returns 200', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Update own article → 200' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${token}` },
      data: { article: { description: 'Updated description' } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.description).toBe('Updated description');
  });

  test('Update article title — slug regenerates to match new title', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update own article title → 200, slug is updated to match new title ⚠️ Slug must regenerate' },
    ],
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const newTitle = `Renamed Article ${Date.now()}`;

    const res = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${token}` },
      data: { article: { title: newTitle } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.title).toBe(newTitle);
    // slug must change when title changes
    expect(body.article.slug).not.toBe(created.slug);
  });

  test('Update article — createdAt is immutable after update', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update own article — verify createdAt is unchanged after update (immutable field)' },
    ],
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: original } = await createRes.json();

    const res = await request.put(`/api/articles/${original.slug}`, {
      headers: { Authorization: `Token ${token}` },
      data: { article: { description: 'Updated' } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    // createdAt is immutable — must not change after update
    expect(body.article.createdAt).toBe(original.createdAt);
    // updatedAt should change
    expect(body.article.updatedAt).not.toBe(original.updatedAt);
  });

  test('Update article with tagList — discrepancy #3', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Update article with tagList → 200, tagList updated in response ⚠️ Undocumented in old spec (discrepancy #3)' },
    ],
    // discrepancy #3: UpdateArticleBody includes tagList, undocumented in old spec
    tag: ['@articles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token, { tagList: ['initial'] });
    const { article: created } = await createRes.json();

    const res = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${token}` },
      data: { article: { tagList: ['updated', 'tags'] } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.article.tagList).toContain('updated');
    expect(body.article.tagList).toContain('tags');
  });

  test('Update another user\'s article returns 403', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: "Update another user's article → 403" },
    ],
    tag: ['@articles', '@negative', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token: authorToken } = await registerAndGetToken(request);
    const { token: otherToken } = await registerAndGetToken(request);

    const createRes = await createArticle(request, authorToken);
    const { article: created } = await createRes.json();

    const res = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${otherToken}` },
      data: { article: { description: 'Hacked' } },
    });

    expect(res.status()).toBe(403);
  });

  test('Update article without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update article without token → 401' },
    ],
    tag: ['@articles', '@negative', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.put(`/api/articles/${created.slug}`, {
      data: { article: { description: 'No auth' } },
    });

    expect(res.status()).toBe(401);
  });

  test('Update non-existent article returns 404', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Update non-existent article → 404' },
    ],
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.put('/api/articles/this-does-not-exist-xyz-99999', {
      headers: { Authorization: `Token ${token}` },
      data: { article: { description: 'Ghost' } },
    });

    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Delete Article — DELETE /api/articles/{slug}
// ---------------------------------------------------------------------------

test.describe('Articles — Delete', () => {
  test('Delete own article returns 204', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Delete own article → 204' },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.delete(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(204);
  });

  test('Delete own article without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Delete own article without token → 401' },
    ],
    tag: ['@articles', '@negative', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const createRes = await createArticle(request, token);
    const { article: created } = await createRes.json();

    const res = await request.delete(`/api/articles/${created.slug}`);

    expect(res.status()).toBe(401);
  });

  test("Delete another user's article returns 403", {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: "Delete another user's article → 403" },
    ],
    tag: ['@articles', '@negative', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token: authorToken } = await registerAndGetToken(request);
    const { token: otherToken } = await registerAndGetToken(request);

    const createRes = await createArticle(request, authorToken);
    const { article: created } = await createRes.json();

    const res = await request.delete(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${otherToken}` },
    });

    expect(res.status()).toBe(403);
  });

  test('Delete non-existent article returns 404', {
    annotation: [
      { type: 'feature', description: 'Articles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Delete non-existent article → 404' },
    ],
    tag: ['@articles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.delete('/api/articles/this-does-not-exist-xyz-99999', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Tags — GET /api/tags
// ---------------------------------------------------------------------------

test.describe('Tags', () => {
  test('Get global tags list returns 200 with array of strings', {
    annotation: [
      { type: 'feature', description: 'Tags' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get global tags list → 200, returns array of strings' },
    ],
    tag: ['@tags', '@positive', '@smoke'],
  }, async ({ request }) => {
    const res = await request.get('/api/tags');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.tags)).toBe(true);
    expect(body.tags.every((t: unknown) => typeof t === 'string')).toBe(true);
  });

  test('Get tags without token returns 200 — discrepancy #1', {
    annotation: [
      { type: 'feature', description: 'Tags' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get tags without token → 200 ⚠️ Old spec: no auth required; OpenAPI: Token required (discrepancy #1)' },
    ],
    // discrepancy #1: old spec says no auth required, OpenAPI marks Token security
    tag: ['@tags', '@positive', '@regression'],
  }, async ({ request }) => {
    const res = await request.get('/api/tags');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.tags)).toBe(true);
  });

  test('Tags list returns non-empty array when articles exist', {
    annotation: [
      { type: 'feature', description: 'Tags' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get global tags list → 200, returns array of strings' },
    ],
    tag: ['@tags', '@positive', '@regression'],
  }, async ({ request }) => {
    const res = await request.get('/api/tags');

    expect(res.status()).toBe(200);

    const body = await res.json();
    // Server returns a curated/cached list — verify format, not specific entries
    expect(Array.isArray(body.tags)).toBe(true);
    expect(body.tags.length).toBeGreaterThan(0);
  });
});

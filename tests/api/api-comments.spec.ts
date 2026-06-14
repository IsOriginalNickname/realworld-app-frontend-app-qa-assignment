import { test, expect } from '@playwright/test';
import { registerAndGetToken, createArticle, addComment } from './helpers';

// Base URL: https://api.realworld.show/api  (openapi.json servers[0].url)

// ---------------------------------------------------------------------------
// Comments — POST /api/articles/{slug}/comments
// ---------------------------------------------------------------------------

test.describe('Comments — Create', () => {
  test('Add comment to own article returns 201', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Add comment to own article → 201, returns Comment' },
    ],
    tag: ['@comments', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await addComment(request, token, article.slug);

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.comment).toBeDefined();
    expect(body.comment.id).toBeDefined();
    expect(body.comment.body).toBe('A test comment');
    expect(body.comment.author).toBeDefined();
  });

  test("Add comment to another user's article returns 201", {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: "Add comment to another user's article → 201" },
    ],
    tag: ['@comments', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token: authorToken } = await registerAndGetToken(request);
    const { token: readerToken } = await registerAndGetToken(request);
    const article = await createArticle(request, authorToken);

    const res = await addComment(request, readerToken, article.slug, 'Reader comment');

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.comment.body).toBe('Reader comment');
  });

  test('Add comment without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Add comment without token → 401' },
    ],
    tag: ['@comments', '@negative', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.post(`/api/articles/${article.slug}/comments`, {
      data: { comment: { body: 'No auth comment' } },
    });

    expect(res.status()).toBe(401);
  });

  test('Add comment to non-existent article returns 404', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Add comment to non-existent article → 404' },
    ],
    tag: ['@comments', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await addComment(request, token, 'this-article-does-not-exist-xyz');

    expect(res.status()).toBe(404);
  });

  test('Add comment with empty body returns 422', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Add comment with empty body → 422' },
    ],
    tag: ['@comments', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await addComment(request, token, article.slug, '');

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Add comment with null body returns 422 — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Add comment with null body → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)' },
    ],
    // discrepancy #2: NewCommentBody.body is nullable in OpenAPI, but business rules require it
    tag: ['@comments', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.post(`/api/articles/${article.slug}/comments`, {
      headers: { Authorization: `Token ${token}` },
      data: { comment: { body: null } },
    });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Add very long comment does not cause server error', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Add very long comment (50 000 chars) — no 500 error' },
    ],
    tag: ['@comments', '@negative', '@edge'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await addComment(request, token, article.slug, 'x'.repeat(50000));

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('HTML injection in comment body — server returns string, not executed', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'HTML injection in comment body — response is safe' },
    ],
    tag: ['@comments', '@negative', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    const xssBody = '<script>alert("xss")</script>';

    const res = await addComment(request, token, article.slug, xssBody);

    expect(res.status()).toBeLessThan(500);

    if (res.status() === 201) {
      const body = await res.json();
      expect(typeof body.comment.body).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Comments — GET /api/articles/{slug}/comments
// ---------------------------------------------------------------------------

test.describe('Comments — Get', () => {
  test('Get comments for an article returns 200 with list', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get comments for an article → 200, returns list' },
    ],
    tag: ['@comments', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    await addComment(request, token, article.slug, 'Comment one');

    const res = await request.get(`/api/articles/${article.slug}/comments`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.comments)).toBe(true);
    expect(body.comments.length).toBeGreaterThan(0);
    expect(body.comments[0].body).toBeDefined();
    expect(body.comments[0].author).toBeDefined();
  });

  test('Get comments without token returns 200 — discrepancy #1', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get comments without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)' },
    ],
    // discrepancy #1: old spec says optional auth, OpenAPI marks Token security
    tag: ['@comments', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    await addComment(request, token, article.slug, 'Visible comment');

    const res = await request.get(`/api/articles/${article.slug}/comments`);

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.comments)).toBe(true);
  });

  test('Get comments — CommentSchema includes all required fields', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get comments for an article → 200, returns list' },
    ],
    tag: ['@comments', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    await addComment(request, token, article.slug);

    const res = await request.get(`/api/articles/${article.slug}/comments`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const comment = (await res.json()).comments[0];
    // immutable id field — must be present and numeric
    expect(typeof comment.id).toBe('number');
    expect(comment.body).toBeTruthy();
    expect(comment.createdAt).toBeTruthy();
    expect(comment.updatedAt).toBeTruthy();
    expect(comment.author.username).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Comments — DELETE /api/articles/{slug}/comments/{id}
// ---------------------------------------------------------------------------

test.describe('Comments — Delete', () => {
  test('Delete own comment returns 204', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: "Delete own comment → 204 ⚠️ OpenAPI says 204; verify server doesn't return 200" },
    ],
    tag: ['@comments', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    const commentRes = await addComment(request, token, article.slug);
    const { comment } = await commentRes.json();

    const res = await request.delete(
      `/api/articles/${article.slug}/comments/${comment.id}`,
      { headers: { Authorization: `Token ${token}` } }
    );

    // OpenAPI says 204 — must NOT return 200
    expect(res.status()).toBe(204);
  });

  test("Delete another user's comment returns 403", {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: "Delete another user's comment → 403" },
    ],
    tag: ['@comments', '@negative', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token: authorToken } = await registerAndGetToken(request);
    const { token: otherToken } = await registerAndGetToken(request);
    const article = await createArticle(request, authorToken);
    const commentRes = await addComment(request, authorToken, article.slug);
    const { comment } = await commentRes.json();

    const res = await request.delete(
      `/api/articles/${article.slug}/comments/${comment.id}`,
      { headers: { Authorization: `Token ${otherToken}` } }
    );

    expect(res.status()).toBe(403);
  });

  test('Delete non-existent comment returns 404', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Delete non-existent comment → 404' },
    ],
    tag: ['@comments', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);

    const res = await request.delete(
      `/api/articles/${article.slug}/comments/999999999`,
      { headers: { Authorization: `Token ${token}` } }
    );

    expect(res.status()).toBe(404);
  });

  test('Delete comment using wrong article slug returns 404 — cross-article attack', {
    annotation: [
      { type: 'feature', description: 'Comments' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Delete comment using wrong article slug (cross-article attack) → 404' },
    ],
    tag: ['@comments', '@negative', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);
    const article = await createArticle(request, token);
    const commentRes = await addComment(request, token, article.slug);
    const { comment } = await commentRes.json();

    const res = await request.delete(
      `/api/articles/wrong-slug-xyz-99999/comments/${comment.id}`,
      { headers: { Authorization: `Token ${token}` } }
    );

    expect(res.status()).toBe(404);
  });
});

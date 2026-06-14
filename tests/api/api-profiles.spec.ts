import { test, expect } from '@playwright/test';
import { registerAndGetToken } from './helpers';

// Base URL: https://api.realworld.show/api  (openapi.json servers[0].url)

// ---------------------------------------------------------------------------
// Profiles — GET /api/profiles/{username}
// ---------------------------------------------------------------------------

test.describe('Profiles — Get', () => {
  test('Get profile of existing user returns 200 with Profile object', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get profile of existing user → 200, returns Profile object' },
    ],
    tag: ['@profiles', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);

    const res = await request.get(`/api/profiles/${username}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile).toBeDefined();
    expect(body.profile.username).toBe(username);
    expect(typeof body.profile.following).toBe('boolean');
  });

  test('Get profile returns all required ProfileSchema fields', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get profile of existing user → 200, returns Profile object' },
    ],
    tag: ['@profiles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);

    const res = await request.get(`/api/profiles/${username}`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(200);

    const profile = (await res.json()).profile;
    expect(profile.username).toBeTruthy();
    // bio and image are nullable but must be present in schema
    expect('bio' in profile).toBe(true);
    expect('image' in profile).toBe(true);
    // following is immutable per request context — must be boolean
    expect(typeof profile.following).toBe('boolean');
  });

  test('Get profile of non-existent user returns 404', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Get profile of non-existent user → 404' },
    ],
    tag: ['@profiles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.get('/api/profiles/this_user_does_not_exist_xyz99999', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(404);
  });

  test('Get profile without token returns 200 — discrepancy #1', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Get profile without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)' },
    ],
    // discrepancy #1: old spec says optional auth, OpenAPI marks Token security
    tag: ['@profiles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);
    await request.get(`/api/profiles/${username}`, {
      headers: { Authorization: `Token ${token}` },
    });

    const res = await request.get(`/api/profiles/${username}`);

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile.username).toBe(username);
  });
});

// ---------------------------------------------------------------------------
// Profiles — Follow / Unfollow
// ---------------------------------------------------------------------------

test.describe('Profiles — Follow', () => {
  test('Follow a user returns 200 with following: true', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Follow a user → 200, following: true' },
    ],
    tag: ['@profiles', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { username: targetUsername } = await registerAndGetToken(request);

    const res = await request.post(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile.following).toBe(true);
    expect(body.profile.username).toBe(targetUsername);
  });

  test('Profile shows following: true after following', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Profile shows following: true after following' },
    ],
    tag: ['@profiles', '@positive', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { username: targetUsername } = await registerAndGetToken(request);

    await request.post(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.get(`/api/profiles/${targetUsername}`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile.following).toBe(true);
  });

  test('Unfollow a user returns 200 with following: false', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Unfollow a user → 200, following: false' },
    ],
    tag: ['@profiles', '@positive', '@smoke'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { username: targetUsername } = await registerAndGetToken(request);

    await request.post(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.delete(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile.following).toBe(false);
  });

  test('Follow already followed user is idempotent', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Follow already followed user — idempotent (no error)' },
    ],
    tag: ['@profiles', '@positive', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { username: targetUsername } = await registerAndGetToken(request);

    await request.post(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    const res = await request.post(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.profile.following).toBe(true);
  });

  test('Unfollow user not followed is handled gracefully', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Unfollow user not followed — handled gracefully (no error)' },
    ],
    tag: ['@profiles', '@positive', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token: followerToken } = await registerAndGetToken(request);
    const { username: targetUsername } = await registerAndGetToken(request);

    const res = await request.delete(`/api/profiles/${targetUsername}/follow`, {
      headers: { Authorization: `Token ${followerToken}` },
    });

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('Follow non-existent user returns 404', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Follow non-existent user → 404' },
    ],
    tag: ['@profiles', '@negative', '@regression'],
  }, async ({ request }) => {
    const { token } = await registerAndGetToken(request);

    const res = await request.post('/api/profiles/this_user_does_not_exist_xyz99999/follow', {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBe(404);
  });

  test('Follow yourself is handled gracefully — no 500', {
    annotation: [
      { type: 'feature', description: 'Profiles' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Follow yourself — handled gracefully (no 500)' },
    ],
    tag: ['@profiles', '@negative', '@edge', '@regression'],
  }, async ({ request }) => {
    const { token, username } = await registerAndGetToken(request);

    const res = await request.post(`/api/profiles/${username}/follow`, {
      headers: { Authorization: `Token ${token}` },
    });

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });
});

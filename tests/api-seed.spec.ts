import {test, expect} from './fixtures/fixtures';

test.describe('Articles API', () => {
  test('GET /api/articles returns article list without auth', {
    annotation: [
      {type: 'feature', description: 'Articles'},
      {type: 'type', description: 'positive'},
      {type: 'severity', description: 'critical'},
      {
        type: 'check',
        description: 'Public article list is accessible without authentication and returns articles array with count'
      },
    ],
    tag: ['@articles', '@positive', '@smoke'],
  }, async ({unauthApiContext}) => {
    const response = await unauthApiContext.get('/api/articles');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('articles');
    expect(body).toHaveProperty('articlesCount');
    expect(Array.isArray(body.articles)).toBe(true);
  });
});

test.describe('User API', () => {
  test('GET /api/user returns current user when authenticated', {
    annotation: [
      {type: 'feature', description: 'User'},
      {type: 'type', description: 'positive'},
      {type: 'severity', description: 'critical'},
      {type: 'check', description: 'Authenticated user endpoint returns user object with email, username, and token'},
    ],
    tag: ['@user', '@positive', '@smoke'],
  }, async ({authedApiContext}) => {
    const response = await authedApiContext.get('/api/user');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('username');
    expect(body.user).toHaveProperty('token');
  });
});

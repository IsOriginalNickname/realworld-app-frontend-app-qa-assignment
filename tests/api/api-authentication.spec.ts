import { test, expect } from '@playwright/test';
import { randomUser } from './helpers';

// ---------------------------------------------------------------------------
// Registration — POST /api/users
// ---------------------------------------------------------------------------

test.describe('Registration', () => {
  test('Register a new user successfully', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Register a new user successfully → 201, returns User with token' },
    ],
    tag: ['@registration', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const user = randomUser();

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(user.email);
    expect(body.user.username).toBe(user.username);
    expect(body.user.token).toBeTruthy();
    expect(typeof body.user.token).toBe('string');
  });

  test('Register returns all required UserSchema fields', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register a new user successfully → 201, returns User with token' },
    ],
    tag: ['@registration', '@positive', '@smoke'],
  }, async ({ request }) => {
    const user = randomUser();

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.user.email).toBeDefined();
    expect(body.user.token).toBeDefined();
    expect(body.user.username).toBeDefined();
    // bio and image may be null but must be present in schema
    expect('bio' in body.user).toBe(true);
    expect('image' in body.user).toBe(true);
  });

  test('Register with duplicate email returns conflict error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with duplicate email → 422 ⚠️ OpenAPI says 409 — check actual code (see discrepancy #4)' },
    ],
    // discrepancy #4: OpenAPI says 409 Conflict, old spec says 422
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = randomUser();

    // Register the user the first time
    await request.post('/api/users', { data: { user } });

    // Try registering with same email again
    const res = await request.post('/api/users', { data: { user } });

    // OpenAPI spec says 409; old spec implied 422 — accept either per discrepancy #4
    expect([409, 422]).toContain(res.status());

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with invalid email format returns error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Register with invalid email format → 422' },
    ],
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), email: 'not-an-email' };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with empty username returns error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with empty username → 422' },
    ],
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), username: '' };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with empty password returns error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with empty password → 422' },
    ],
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), password: '' };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with null email returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with missing email (null field) → 422 ⚠️ OpenAPI marks as nullable — may allow null (discrepancy #2)' },
    ],
    // discrepancy #2: OpenAPI marks email as nullable, but business rules require it
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), email: null };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with null username returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with missing username (null field) → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)' },
    ],
    // discrepancy #2: OpenAPI marks username as nullable, but business rules require it
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), username: null };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with null password returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Register with missing email (null field) → 422 ⚠️ OpenAPI marks as nullable — may allow null (discrepancy #2)' },
    ],
    tag: ['@registration', '@negative', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), password: null };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Register with very long password does not cause server error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'Register with very long password (1000 chars) — no 500 error' },
    ],
    tag: ['@registration', '@negative', '@edge'],
  }, async ({ request }) => {
    const user = { ...randomUser(), password: 'A'.repeat(1000) };

    const res = await request.post('/api/users', { data: { user } });

    // Must not crash the server — any 4xx is acceptable, 5xx is a bug
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('SQL injection in email field does not cause server error', {
    annotation: [
      { type: 'feature', description: 'Registration' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: "SQL injection in email field — no 500 error" },
    ],
    tag: ['@registration', '@negative', '@edge', '@regression'],
  }, async ({ request }) => {
    const user = { ...randomUser(), email: "'; DROP TABLE users; --@example.com" };

    const res = await request.post('/api/users', { data: { user } });

    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// Authentication — POST /api/users/login
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test('Login with valid credentials returns 200 and JWT token', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Login with valid credentials → 200, returns JWT token' },
    ],
    tag: ['@authentication', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const user = randomUser();
    await request.post('/api/users', { data: { user } });

    const res = await request.post('/api/users/login', {
      data: { user: { email: user.email, password: user.password } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user.token).toBeTruthy();
    expect(typeof body.user.token).toBe('string');
    expect(body.user.email).toBe(user.email);
  });

  test('Login with wrong password returns 401', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Login with wrong password → 401 ⚠️ OpenAPI says 401, old spec implied 422 — verify' },
    ],
    // discrepancy: OpenAPI says 401, old spec implied 422
    tag: ['@authentication', '@negative', '@smoke', '@regression'],
  }, async ({ request }) => {
    const user = randomUser();
    await request.post('/api/users', { data: { user } });

    const res = await request.post('/api/users/login', {
      data: { user: { email: user.email, password: 'WrongPassword!' } },
    });

    expect(res.status()).toBe(401);
  });

  test('Login with non-existent user returns 401', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Login with non-existent user → 401 ⚠️ OpenAPI says 401, old spec implied 422 — verify' },
    ],
    tag: ['@authentication', '@negative', '@regression'],
  }, async ({ request }) => {
    const res = await request.post('/api/users/login', {
      data: { user: { email: 'ghost_nobody@example.com', password: 'SomePass123!' } },
    });

    expect(res.status()).toBe(401);
  });

  test('Login with null email returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Login with missing fields (null email/password) → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)' },
    ],
    // discrepancy #2: LoginUserBody marks email as nullable, but login requires it
    tag: ['@authentication', '@negative', '@regression'],
  }, async ({ request }) => {
    const res = await request.post('/api/users/login', {
      data: { user: { email: null, password: 'Password123!' } },
    });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Login with null password returns error — discrepancy #2', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Login with missing fields (null email/password) → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)' },
    ],
    tag: ['@authentication', '@negative', '@regression'],
  }, async ({ request }) => {
    const res = await request.post('/api/users/login', {
      data: { user: { email: 'someone@example.com', password: null } },
    });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Get / Update current user — GET /api/user, PUT /api/user
// ---------------------------------------------------------------------------

test.describe('Current User', () => {
  test('Get current user with valid token returns 200', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get current user with valid token (GET /api/user) → 200' },
    ],
    tag: ['@authentication', '@positive', '@smoke', '@critical'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    const res = await request.get('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe(user.email);
    expect(body.user.username).toBe(user.username);
    expect(body.user.token).toBeTruthy();
  });

  test('Get current user without token returns 401', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'critical' },
      { type: 'check', description: 'Get current user without token → 401' },
    ],
    tag: ['@authentication', '@negative', '@smoke'],
  }, async ({ request }) => {
    const res = await request.get('/api/user');

    expect(res.status()).toBe(401);
  });

  test('Request with invalid JWT token returns 401', {
    annotation: [
      { type: 'feature', description: 'Authentication' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Request with invalid JWT token → 401' },
    ],
    tag: ['@authentication', '@negative', '@regression'],
  }, async ({ request }) => {
    const res = await request.get('/api/user', {
      headers: { Authorization: 'Token this.is.not.valid' },
    });

    expect(res.status()).toBe(401);
  });

  test('Update user profile bio and image returns 200', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update user profile (bio, image) → 200' },
    ],
    tag: ['@user', '@positive', '@smoke'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    const res = await request.put('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
      data: { user: { bio: 'Hello world', image: 'https://example.com/avatar.png' } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user.bio).toBe('Hello world');
    expect(body.user.image).toBe('https://example.com/avatar.png');
  });

  test('Update user email to already taken email returns 422', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'negative' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update user email to already taken email → 422' },
    ],
    tag: ['@user', '@negative', '@regression'],
  }, async ({ request }) => {
    const userA = randomUser();
    const userB = randomUser();

    const regA = await request.post('/api/users', { data: { user: userA } });
    const { user: registeredA } = await regA.json();

    await request.post('/api/users', { data: { user: userB } });

    // Try to update userA's email to userB's email
    const res = await request.put('/api/user', {
      headers: { Authorization: `Token ${registeredA.token}` },
      data: { user: { email: userB.email } },
    });

    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  test('Partial update does not change other user fields — immutable check', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'Update user — verify other fields unchanged after partial update (immutable check)' },
    ],
    tag: ['@user', '@positive', '@regression'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    // Store server-confirmed values as the source of truth
    const originalEmail = registered.email;
    const originalUsername = registered.username;

    // Update only bio
    const res = await request.put('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
      data: { user: { bio: 'Updated bio' } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    // email and username must remain unchanged
    expect(body.user.email).toBe(originalEmail);
    expect(body.user.username).toBe(originalUsername);
    expect(body.user.bio).toBe('Updated bio');
  });

  test('Update user username returns 200 with updated username', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'PUT /api/user update username → 200, username changed in response' },
    ],
    tag: ['@user', '@positive', '@smoke'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    const newUsername = `updated_${Date.now()}`;

    const res = await request.put('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
      data: { user: { username: newUsername } },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user.username).toBe(newUsername);
  });

  test('Update user password returns 200 and new credentials work', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'high' },
      { type: 'check', description: 'PUT /api/user update password → 200 (no error)' },
    ],
    tag: ['@user', '@positive', '@regression'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    const newPassword = 'NewPassword456!';

    const res = await request.put('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
      data: { user: { password: newPassword } },
    });

    expect(res.status()).toBe(200);

    // Verify the new password works for login
    const loginRes = await request.post('/api/users/login', {
      data: { user: { email: user.email, password: newPassword } },
    });
    expect(loginRes.status()).toBe(200);
  });

  test('GET /api/user email field present and unchanged after bio/image update', {
    annotation: [
      { type: 'feature', description: 'User' },
      { type: 'type', description: 'positive' },
      { type: 'severity', description: 'medium' },
      { type: 'check', description: 'PUT /api/user — verify email field is present and unchanged after updating only bio/image' },
    ],
    tag: ['@user', '@positive', '@regression'],
  }, async ({ request }) => {
    const user = randomUser();
    const regRes = await request.post('/api/users', { data: { user } });
    const { user: registered } = await regRes.json();

    await request.put('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
      data: { user: { bio: 'Some bio', image: 'https://example.com/img.jpg' } },
    });

    const getRes = await request.get('/api/user', {
      headers: { Authorization: `Token ${registered.token}` },
    });

    expect(getRes.status()).toBe(200);

    const body = await getRes.json();
    expect(body.user.email).toBe(user.email);
    expect('email' in body.user).toBe(true);
  });
});

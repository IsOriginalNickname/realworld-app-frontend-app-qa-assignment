import { expect, Page } from '@playwright/test';

const API_BASE = 'https://api.realworld.show/api';

let userCounter = 0;

export function randomUser() {
  const id = `${Date.now()}_${(++userCounter).toString().padStart(4, '0')}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `fav_${id}`,
    email: `fav_${id}@example.com`,
    password: 'Password123!',
  };
}

export async function registerUser(user: {
  username: string;
  email: string;
  password: string;
}): Promise<{ token: string; username: string; email: string }> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });
  const body = await res.json();
  return { token: body.user.token, username: body.user.username, email: user.email };
}

export async function createArticle(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<{ slug: string; title: string; favoritesCount: number }> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const article = {
    title: `Fav Article ${id}`,
    description: 'Article for favorites testing',
    body: 'Body of favorites test article',
    tagList: [],
    ...overrides,
  };
  const res = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ article }),
  });
  const body = await res.json();
  return body.article;
}

export async function favoriteArticle(token: string, slug: string): Promise<void> {
  await fetch(`${API_BASE}/articles/${slug}/favorite`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
  });
}

export async function unfavoriteArticle(token: string, slug: string): Promise<void> {
  await fetch(`${API_BASE}/articles/${slug}/favorite`, {
    method: 'DELETE',
    headers: { Authorization: `Token ${token}` },
  });
}

export async function getGlobalFeedArticle(
  token?: string,
): Promise<{ slug: string; title: string }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Token ${token}`;
  const res = await fetch(`${API_BASE}/articles?limit=1`, { headers });
  const body = await res.json();
  const article = body.articles?.[0];
  if (!article) throw new Error('No articles found in Global Feed');
  return { slug: article.slug, title: article.title };
}

export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Allow up to 15 seconds for redirect in case of slow API responses under parallel load
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

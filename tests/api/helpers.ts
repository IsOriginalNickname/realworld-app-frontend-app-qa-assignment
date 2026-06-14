export function randomUser() {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `user_${id}`,
    email: `user_${id}@example.com`,
    password: 'Password123!',
  };
}

export function randomArticle(overrides: Record<string, unknown> = {}) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    title: `Test Article ${id}`,
    description: 'A test article description',
    body: 'Test article body content',
    tagList: [],
    ...overrides,
  };
}

export async function registerAndGetToken(request: any): Promise<{ token: string; username: string }> {
  const user = randomUser();
  const res = await request.post('/api/users', { data: { user } });
  const body = await res.json();
  return { token: body.user.token, username: body.user.username };
}

export async function createArticle(
  request: any,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<{ slug: string; title: string; description: string; body: string; tagList: string[]; createdAt: string; updatedAt: string; favorited: boolean; favoritesCount: number; author: Record<string, unknown> }> {
  const article = randomArticle(overrides);
  const res = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: { article },
  });
  const json = await res.json();
  return json.article;
}

export async function addComment(request: any, token: string, slug: string, text = 'A test comment') {
  return request.post(`/api/articles/${slug}/comments`, {
    headers: { Authorization: `Token ${token}` },
    data: { comment: { body: text } },
  });
}

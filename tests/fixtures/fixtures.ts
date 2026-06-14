import { test as base, APIRequestContext } from '@playwright/test';

function randomUser() {
  const id = Date.now();
  return {
    username: `testuser_${id}`,
    email: `testuser_${id}@example.com`,
    password: 'Password123!',
  };
}

type Fixtures = {
  unauthApiContext: APIRequestContext;
  authedApiContext: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  unauthApiContext: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },

  authedApiContext: async ({ playwright, unauthApiContext, baseURL }, use) => {
    const user = randomUser();

    const registerResponse = await unauthApiContext.post('/api/users', {
      data: { user },
    });
    const { user: registered } = await registerResponse.json();

    const authedContext = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${registered.token}`,
      },
    });

    await use(authedContext);
    await authedContext.dispose();
  },
});

export { expect } from '@playwright/test';

# QA Test Generation — Claude Code Instructions

## Input Files (read ALL before generating)

Actual Docs:

1. Backend: [openapi.json](docs/specs/backend/openapi.json) - OpenApi. Schemas, endpoints, field types, required/readonly.
2. Backend: [discrepancies.md](docs/specs/backend/discrepancies.md) - delta between old and new spec, high-risk areas most likely to contain bugs
3. Frontend: [specs.md](docs/specs/frontend/specs.md) Fron

Before writing a test:

- Extract the URL, method, request/response schema from `openapi.json`
- Find the business rules for that endpoint in `spec.md`
- Find the matching rows in `checklist.md`: feature, tag, type (positive/negative)

### Discrepancies

- Read `docs/discrepancies.md` before any other file
- Every item listed there is a high-probability bug location
- For each discrepancy generate at least one dedicated negative test
- Mark these tests with `@regression` tags

---

## Required Structure for Every Test

<test_file_example>

```typescript
import {test, expect} from '@playwright/test';

test('Scenario description from **- checklist.md', {
  annotation: [
    {type: 'feature', description: '<feature from checklist.md>'},
    {type: 'type', description: 'positive'}, // or 'negative'
    {type: 'severity', description: 'critical'}, // critical | high | medium | low
    {type: 'check', description: '<check text from checklist.md>'},
  ],
  tag: ['@<feature>', '@positive', '@smoke'], // minimum 2 tags
}, async ({request}) => {

  // 1. HTTP call — URL strictly from openapi.json
  const res = await request.post('https://api.example.com/v1/resource', {
    data: {...}
  });

  // 2. Real status assertion
  expect(res.status()).toBe(201);

  // 3. Response body assertion
  const body = await res.json();
  expect(body.id).toBeDefined();

  // 4. Immutable check (if field is marked readOnly in openapi.json)
  expect(body.created_at).toBe(originalCreatedAt);
});
```

</test_file_example>

---

## Rules

<rules>

### URL

- Take ONLY from `openapi.json`. Get rootURL from fixtures + `paths`
- Never invent URLs

### Assertions

- Minimum two `expect()` per test
- Forbidden: `expect(true).toBe(true)`, `expect(res).toBeDefined()`
- Always check the status code and at least one response body field if it's must exist.

### Immutable Fields

- If a field in `openapi.json` is marked `readOnly: true` — add a check that the value hasn't changed after a subsequent request
- For negative tests: send a mutated value → expect an error (400/422)

### Tags

- Minimum: `@<featureName>` + `@positive` or `@negative`
- Add as appropriate: `@smoke`, `@regression`, `@edge`, `@critical`

### Annotations

- `feature` — feature name. One of from list ("Authentication", "Registration", "User","Profiles","Articles","Comments","Favorites","Feed","Tags")
- `type` — strictly `positive` or `negative`
- `severity` — based on importance from `checklist.md`
- `check` — check text from `checklist.md`
  </rules>

---

## After Writing a Test

The hook will run automatically — no action needed.

If you see `🔴 GRADER FAIL`:

- Fix ALL listed issues
- Rewrite the file in full

If you see `❌ SURVIVED [mutation]`:

- Strengthen the assertion that didn't catch the mutation
- Example: if a status code mutation survived — add `expect(res.status()).toBe(EXACT_CODE)`

Goal: `🟢 GRADER PASS` + `✅ Mutation score: 100%`

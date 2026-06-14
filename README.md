
# Conduit — RealWorld Example App · Autotests

This is a fork of: https://github.com/TomislavVinkovic/realworld-app-angular-v20

This fork was created to demonstrate working with AI tools and how this process can assist in a QA role.

---
## Q&A

### Which agents/tools did you use and how?
  - Claude for scraping requirements from the site.
  - Claude Code as the main tool.
  - Playwright Test Agents:
    - planning
    - codegen
    - healing
  - Playwright MCP for planning agent.
  - Kiro for helping with test case coverage.
  - Self-written tools:
    - PostHook for code quality assessment for API tests — runs the code-grader and mutation runner after each `.spec` file change.
    - Self-written code-grader for static code quality assessment of API tests.
    - Self-written mutation runner.

### Where did the agent help, and where did it produce something wrong or low-quality that you had to correct or reject?

  - As usual, the biggest problem (after finding a working front-end repo to fork :)) was getting stable and good-quality codegen. Claude Code with some rules in the prompt produced poor results, and the Playwright agent wasn't great either (Playwright agent is oriented toward UI tests, so it doesn't handle E2E API testing as well). This was expected.
**Solution:** First, a code-grader was added. This follow Antropic recommendations for improving the quality of the generated code.
  - Second, [CLAUDE.md](CLAUDE.md) was updated a few times for getting better results.
  - Third, Test example was added to the [CLAUDE.md](CLAUDE.md). Following Anthropic's recommendations too.


### One example of a decision where you overrode the agent’s suggestion, and why.
- When I asked it to generate fixtures for API tests, it moved all URLs inside them. Was canceled. Wrong behavior. We must contains it in [playwright.config.ts](playwright.config.ts)
- While extracting requirements, we had two sources: a Markdown spec and an OpenAPI JSON. On the first iteration, Claude Code decided they were identical and merged them, almost completely overwriting the `.md` spec file. It was suspicious. This changes were canceled. On the second iteration, when asked to identify the differences, it discovered that several things between the OpenAPI spec and the Markdown spec did not match at all.

### What would I also like to do in the future?
- First of all, deliver this project in Docker to make setup simpler and faster.
- Run the backend locally in a container alongside the app. The publicly available API (`https://api.realworld.show/api`) has very low rate limits, which causes tests to fail and leads to flaky tests. As a temporary workaround, I reduced the number of workers and added retries, which is a extreamly bad practice.
- In a real project, I would invest time in prompt evaluation with a large set of prepared demo data to find the most reliable prompt for generating test scenarios for each endpoint.
- Create a Page Object Model for UI tests.
- Create uniq data-id properties for all UI element which are used in tests and migrate to them from "Role" locators. 
- Separate the data layer for API tests and move all JSON payloads out of the test files.

---
### Bugs
List of found bugs u can find here:
[bugs.md](docs/specs/other/bugs.md)
---
### CodeGrader

A static validator that runs automatically via **PostToolUse hook** every time a `.spec.ts` or `.test.ts` file is written. Non-test files are skipped silently.

**How it works:** reads the file content and runs 8 regex-based checks. Exits `0` on full pass (`🟢 GRADER PASS`), exits `1` with a detailed failure report (`🔴 GRADER FAIL`) listing every broken check.

**Checks:**

- `has_url` — at least one HTTP URL must be present (taken from `openapi.json`, never invented)
- `has_http_call` — a `request.get/post/put/delete/patch/head(...)` call must exist
- `has_real_assert` — a meaningful assertion: `toBe`, `toEqual`, `toHaveProperty`, `toContain`, `toMatch`, etc. Forbidden: `expect(true)` or bare `toBeDefined()`
- `has_status_assert` — explicit status code check: `expect(res.status()).toBe(NNN)`
- `checks_immutable` — at least one check for a `readOnly` / immutable field (e.g. `created_at`, `.id`)
- `has_tags` — `tag: ['@featureName', '@positive'|'@negative', ...]` with at least one named tag
- `has_annotation_feature` — `annotation` entry with `type: 'feature'`
- `has_annotation_type` — `annotation` entry with `type: 'type'` and `description: 'positive'|'negative'`

**Goal:** `🟢 GRADER PASS` on all 8 checks, combined with `✅ Mutation score: 100%` from the mutation runner.

---

### MutationRunner

A dynamic test-quality validator that runs automatically via **PostToolUse hook** right after the CodeGrader passes. Also skips non-test files.

**How it works:** applies 6 code mutations to the spec file one at a time, runs Playwright against each mutant, then restores the original. A mutation is **killed** (good) if the test fails on it; it **survives** (bad) if the test still passes — meaning the assertion didn't catch the defect. Exits `1` if any mutation survives or the score drops below 90%.

**Mutations:**

- `status_code_off_by_one` — increments the expected status code by 1 (e.g. `201 → 202`)
- `wrong_status_code` — replaces the expected status code with `999`
- `null_payload` — replaces the request `data: {...}` with `data: null`
- `broken_url` — appends `_MUTANT` to the first URL, making the request fail
- `removed_assert` — comments out the first `expect(...)` call
- `immutable_field_mutated` — replaces the expected value of a `readOnly` field with `'MUTANT_VALUE'`

**Score:** `killed / (killed + survived) * 100`. Skipped mutations (pattern didn't match) are excluded from the score. Threshold: **≥ 90%** required to pass.

**Goal:** `✅ Mutation score: 100%` — every applicable mutation must be caught by an assertion.

---

## Prerequisites

- **Node.js** 18.x or later (LTS recommended)
- **npm** 9.x or later
- **Angular CLI** 20.x

Install the Angular CLI globally if you haven't already:

```bash
npm install -g @angular/cli@20
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/TomislavVinkovic/realworld-app-angular-v20.git
cd realworld-app-angular-v20
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
ng serve
```

The application will be available at **[http://localhost:4200](http://localhost:4200)**. The dev server supports Hot Module Replacement (HMR) — changes to source files are reflected in the browser automatically.


---

## API

The application targets the public RealWorld API. The base URL is configured in the environment files:

```
src/environments/environment.ts          # Development
src/environments/environment.prod.ts     # Production
```

To point the app at your own backend, update the `apiUrl` value in the relevant environment file:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-backend-url/api'
};
```

Any backend that implements the [RealWorld API spec](https://realworld-docs.netlify.app/docs/specs/backend-specs/introduction) is compatible.



## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---
## License

MIT

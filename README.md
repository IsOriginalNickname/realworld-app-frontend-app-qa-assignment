
# Conduit — RealWorld Example App · Autotests 

Fork: https://github.com/TomislavVinkovic/realworld-app-angular-v20
This codebase was created to demonstrate a fully fledged application built with Angular that interacts with an actual backend server including CRUD operations, authentication, routing, pagination, and more.

For more information on how this works with other frontends/backends, head over to the [RealWorld repo](https://github.com/gothinkster/realworld).

---
## Q&A

- [ ] TODO: Which agents/tools you used and how?
  In this project was used: 
  - Claude code as a main tool.
  - Playwright Test Agents & Kiro for helping with test cases coverage.
  - PostHook with code-grader for code quality assessment.
- [ ] TODO: Where the agent helped, and where it produced something wrong or low-quality that you had to correct or reject.
- В процессе вычитывания требований, у нас было два источника: Дока и JSON. В первую итерацию, claude code решил, что это одно и тоже, после чего успешно помержил требования, почти под чистую затерев .md файл со спекой. Однако на вторую итерацию, на просьбу разобраться, в чем же там всё таки разница, обнаружил, что некоторые вещи между opanAPI спеков и md спекой не совпадают вовсе. 
- [ ] TODO: One example of a decision where you overrode the agent’s suggestion, and why.

---


In real life, I prefer spent some time for promt-evaluating with prepared a lot of demo data, for get the most reliable promt for generate test-suites for each endpoint.

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

# Discovered Bugs

---

## Frontend (manual exploration)

- Clicking a tag on the home page does nothing
- Logout does not work: cause — incorrect network request
- Favorites counter updates on the frontend but with an incorrect contract
- The visual markdown editor does not work
- Opening the user edit form triggers a spurious `GET https://api.realworld.show/api/user/edit`
- The **Update profile** button does not work
- Redirect to the login page does not work

---

## API (found by automated tests)

### BUG-001 — Registration with an already-existing email is not blocked

| | |
|---|---|
| **Endpoint** | `POST /api/users` |
| **Expected result** | `409 Conflict` or `422 Unprocessable Entity` (duplicate not allowed) |
| **Actual result** | `201 Created` — a second user is created with the same email |
| **Test** | `tests/api/api-authentication.spec.ts` → *"Register with duplicate email returns conflict error"* |
| **Discrepancy** | `discrepancies.md` #4 |
| **Severity** | High |

---

### BUG-002 — Registration with an invalid email format is not blocked

| | |
|---|---|
| **Endpoint** | `POST /api/users` |
| **Expected result** | `422 Unprocessable Entity` |
| **Actual result** | `201 Created` — user is created with `email: "not-an-email"` |
| **Test** | `tests/api/api-authentication.spec.ts` → *"Register with invalid email format returns error"* |
| **Severity** | High |

---

### BUG-003 — Updating email to an already-taken email is allowed

| | |
|---|---|
| **Endpoint** | `PUT /api/user` |
| **Expected result** | `422 Unprocessable Entity` |
| **Actual result** | `200 OK` — another user's email is successfully overwritten |
| **Test** | `tests/api/api-authentication.spec.ts` → *"Update user email to already taken email returns 422"* |
| **Severity** | High |

---

### BUG-004 — Creating an article with a duplicate title is not blocked

| | |
|---|---|
| **Endpoint** | `POST /api/articles` |
| **Expected result** | `409 Conflict` (per OpenAPI) or `422` |
| **Actual result** | `201 Created` — an article with the same title is created again |
| **Test** | `tests/api/api-articles.spec.ts` → *"Create two articles with same title returns conflict — discrepancy #4"* |
| **Discrepancy** | `discrepancies.md` #4 |
| **Severity** | Medium |

---

### BUG-006 — PUT /api/articles/{slug} does not verify article ownership

| | |
|---|---|
| **Endpoint** | `PUT /api/articles/{slug}` |
| **Expected result** | `403 Forbidden` when attempting to edit another user's article |
| **Actual result** | `200 OK` — any authenticated user can edit any article |
| **Test** | `tests/api/api-articles.spec.ts` → *"Update another user's article returns 403"* |
| **Severity** | Critical |

---

### BUG-007 — DELETE /api/articles/{slug} does not verify article ownership

| | |
|---|---|
| **Endpoint** | `DELETE /api/articles/{slug}` |
| **Expected result** | `403 Forbidden` when attempting to delete another user's article |
| **Actual result** | `204 No Content` — any authenticated user can delete any article |
| **Test** | `tests/api/api-articles.spec.ts` → *"Delete another user's article returns 403"* |
| **Severity** | Critical |

---

### BUG-009 — DELETE /api/articles/{slug}/comments/{id} does not verify comment ownership

| | |
|---|---|
| **Endpoint** | `DELETE /api/articles/{slug}/comments/{id}` |
| **Expected result** | `403 Forbidden` when attempting to delete another user's comment |
| **Actual result** | `204 No Content` — any authenticated user can delete any comment |
| **Test** | `tests/api/api-comments-favorites.spec.ts` → *"Delete another user's comment returns 403"* |
| **Severity** | Critical |
| **Note** | Same pattern as BUG-007 (delete article) |

---

### BUG-011 — GET /api/profiles/{username} without a token returns 404

| | |
|---|---|
| **Endpoint** | `GET /api/profiles/{username}` |
| **Expected result** | `200 OK` (old spec: auth is optional) |
| **Actual result** | `404 Not Found` — profile is hidden from unauthenticated users |
| **Test** | `tests/api/api-profiles-feed.spec.ts` → *"Get profile without token returns 200 — discrepancy #1"* |
| **Discrepancy** | `discrepancies.md` #1 |
| **Severity** | Medium |
| **Note** | Systemic pattern: BUG-005 (article), BUG-008 (comments), BUG-011 (profile) — server hides resources via 404 instead of 401 or open access |

---

### BUG-012 — Opening /settings triggers spurious GET /api/user/edit request

| | |
|---|---|
| **Endpoint** | `GET /api/user/edit` (should never be called) |
| **Expected result** | Navigating to `/settings` calls `GET /api/user` to load the current user |
| **Actual result** | App calls `GET /api/user/edit` — a non-existent endpoint — so the form loads empty |
| **Test** | `tests/e2e/e2e-settings.spec.ts` → *"BUG regression: opening /settings must NOT trigger GET /api/user/edit request"* |
| **Severity** | High |

---

### BUG-013 — "Update profile" button does not send PUT /api/user

| | |
|---|---|
| **Endpoint** | `PUT /api/user` |
| **Expected result** | Clicking "Update profile" sends `PUT /api/user` with the updated values and receives `200 OK` |
| **Actual result** | No request is sent — changes are silently discarded |
| **Test** | `tests/e2e/e2e-settings.spec.ts` → *"BUG regression: clicking Update Settings button saves changes via PUT /api/user"* |
| **Severity** | Critical |

---

### BUG-014 — Unauthenticated user clicking a favorite button is not redirected to /login

| | |
|---|---|
| **Area** | Frontend navigation |
| **Expected result** | Clicking the favorite button without being logged in redirects the user to `/login` |
| **Actual result** | Redirect to `/login` does not happen |
| **Test** | `tests/e2e/e2e-favorites.spec.ts` → *"Unauthenticated user clicking the favorite button is redirected to login or shown disabled state"* |
| **Severity** | High |

---

### BUG-015 — Favorites counter updates optimistically on the frontend with incorrect contract

| | |
|---|---|
| **Area** | Frontend / Favorites |
| **Expected result** | After clicking favorite, the UI reflects the `favoritesCount` value returned by `POST /api/articles/{slug}/favorite` |
| **Actual result** | The counter increments optimistically on the frontend but diverges from the API response (frontend manifestation of BUG-010) |
| **Test** | `tests/e2e/e2e-favorites.spec.ts` → *"BUG-010 regression: two users favoriting the same article — favoritesCount must reach 2"* |
| **Severity** | High |
| **Note** | Related to BUG-010: the API returns wrong `favoritesCount`, and the UI surfaces that incorrect value |

---

### BUG-010 — favoritesCount is not incremented when multiple users favorite the same article

| | |
|---|---|
| **Endpoint** | `POST /api/articles/{slug}/favorite` |
| **Expected result** | After 2 different users favorite the article: `favoritesCount = 2` |
| **Actual result** | `favoritesCount = 1` — counter does not increase when another user favorites the same article |
| **Test** | `tests/api/api-comments-favorites.spec.ts` → *"Two users favoriting same article gives favoritesCount = 2"* |
| **Severity** | High |

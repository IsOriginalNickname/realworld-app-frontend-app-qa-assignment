## Task List (English)

### Authentication
- [ ] Register a new user successfully → 201, returns User with token
- [ ] Login with valid credentials → 200, returns JWT token
- [ ] Get current user with valid token (`GET /api/user`) → 200
- [ ] Get current user without token → 401
- [ ] Update user profile (bio, image) → 200
- [ ] Update user email to already taken email → 422
- [ ] Update user — verify other fields unchanged after partial update (immutable check)
- [ ] Register with duplicate email → 422 ⚠️ OpenAPI says 409 — check actual code (see discrepancy #4)
- [ ] Register with invalid email format → 422
- [ ] Register with empty username → 422
- [ ] Register with empty password → 422
- [ ] Register with missing email (null field) → 422 ⚠️ OpenAPI marks as nullable — may allow null (discrepancy #2)
- [ ] Register with missing username (null field) → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)
- [ ] Login with wrong password → 401 ⚠️ OpenAPI says 401, old spec implied 422 — verify
- [ ] Login with non-existent user → 401 ⚠️ OpenAPI says 401, old spec implied 422 — verify
- [ ] Login with missing fields (null email/password) → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)
- [ ] Request with invalid JWT token → 401
- [ ] Register with very long password (1000 chars) — no 500 error
- [ ] SQL injection in email field — no 500 error

### User (`GET /api/user`, `PUT /api/user`)
- [ ] PUT /api/user update username → 200, username changed in response
- [ ] PUT /api/user update password → 200 (no error)
- [ ] PUT /api/user — verify `email` field is present and unchanged after updating only bio/image

### Profiles (`GET /api/profiles/:username`, follow/unfollow)
- [ ] Get profile of existing user → 200, returns Profile object
- [ ] Get profile of non-existent user → 404
- [ ] Get profile without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)
- [ ] Follow a user → 200, `following: true`
- [ ] Unfollow a user → 200, `following: false`
- [ ] Follow already followed user — idempotent (no error)
- [ ] Unfollow user not followed — handled gracefully (no error)
- [ ] Follow non-existent user → 404
- [ ] Follow yourself — handled gracefully (no 500)
- [ ] Profile shows `following: true` after following

### Articles
- [ ] Create article with valid token → 201, returns Article
- [ ] Create article without token → 401
- [ ] Create two articles with same title → 409 ⚠️ OpenAPI says 409 Conflict, old spec silent (discrepancy #4)
- [ ] Create article with tags → tagList returned in response
- [ ] Create article with null tagList → tagList is empty array in response
- [ ] Create article with empty title → 422
- [ ] Create article with null title → 422 ⚠️ OpenAPI marks as nullable — may allow null (discrepancy #2)
- [ ] Create article with very long title (10 000 chars) — no 500 error
- [ ] Create article with HTML/script in title — response is safe
- [ ] Create article with Unicode in title (emoji, Cyrillic)
- [ ] Get article by slug → 200
- [ ] Get article by slug without token → 200 ⚠️ Old spec: no auth required; OpenAPI: Token required (discrepancy #1)
- [ ] Get non-existent article → 404
- [ ] List articles with pagination (`limit`, `offset`) → 200
- [ ] List articles — `body` field is null/absent per article ⚠️ Breaking change since 2024-08-16 (discrepancy #5)
- [ ] Filter articles by tag (`?tag=X`) → correct results
- [ ] Filter articles by author (`?author=X`) → correct results
- [ ] Filter articles by favorited user (`?favorited=X`) → correct results ⚠️ Missing from both checklists
- [ ] List articles without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)
- [ ] Update own article → 200
- [ ] Update own article title → 200, slug is updated to match new title ⚠️ Slug must regenerate
- [ ] Update own article — verify `createdAt` is unchanged after update (immutable field)
- [ ] Update article with `tagList` → 200, tagList updated in response ⚠️ Undocumented in old spec (discrepancy #3)
- [ ] Update another user's article → 403
- [ ] Update article without token → 401
- [ ] Update non-existent article → 404
- [ ] Delete own article → 204
- [ ] Delete own article without token → 401
- [ ] Delete another user's article → 403
- [ ] Delete non-existent article → 404
- [ ] Get global tags list → 200, returns array of strings
- [ ] Get tags without token → 200 ⚠️ Old spec: no auth required; OpenAPI: Token required (discrepancy #1)

### Feed (`GET /api/articles/feed`)
- [ ] Get feed with valid token → 200, articles from followed users only
- [ ] Get feed without token → 401
- [ ] Get feed — `body` field is null/absent per article ⚠️ Breaking change since 2024-08-16 (discrepancy #5)
- [ ] Get feed with pagination (`?limit=5&offset=0`) → max 5 articles returned

### Comments
- [ ] Add comment to own article → 201, returns Comment
- [ ] Add comment to another user's article → 201
- [ ] Add comment without token → 401
- [ ] Get comments for an article → 200, returns list
- [ ] Get comments without token → 200 ⚠️ Old spec: optional auth; OpenAPI: Token required (discrepancy #1)
- [ ] Add comment to non-existent article → 404
- [ ] Add comment with empty body → 422
- [ ] Add comment with null body → 422 ⚠️ OpenAPI marks as nullable (discrepancy #2)
- [ ] Delete own comment → 204 ⚠️ OpenAPI says 204; verify server doesn't return 200
- [ ] Delete another user's comment → 403
- [ ] Delete non-existent comment → 404
- [ ] Delete comment using wrong article slug (cross-article attack) → 404
- [ ] Add very long comment (50 000 chars) — no 500 error
- [ ] HTML injection in comment body — response is safe

### Favorites
- [ ] Favorite an article → 200, `favorited: true`, `favoritesCount` increments
- [ ] Favorite an article without token → 401
- [ ] Unfavorite an article → 200, `favorited: false`, `favoritesCount` decrements
- [ ] Unfavorite an article without token → 401
- [ ] Favorite the same article twice — no error / idempotent
- [ ] Unfavorite article that was not favorited — handled gracefully
- [ ] Favorite non-existent article → 404
- [ ] Two users favorite same article → `favoritesCount` = 2
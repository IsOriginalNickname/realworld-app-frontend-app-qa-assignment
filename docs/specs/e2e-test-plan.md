# E2E Test Plan: Article Favorites and Settings/Profile Editing

## Application Overview

RealWorld Conduit (http://localhost:4200) is a blogging platform with authentication, article creation, favorites/likes, comments, and user profile management. This test plan covers two features known to contain bugs: Article Favorites (likes counter and contract) and the Settings/Profile Editing form. All tests assume a fresh browser state and create their own users via /register. The production API is at https://api.realworld.show/api. The favorite API uses POST /api/articles/{slug}/favorite and DELETE /api/articles/{slug}/favorite; the settings form uses PUT /api/user.

## Test Scenarios

### 1. Article Favorites

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. Authenticated user can favorite an article from the Home feed and counter increments

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register a new user via POST https://api.realworld.show/api/users (username: favuser1_<timestamp>, email: favuser1_<timestamp>@example.com, password: Password123!) using the API request fixture to obtain a JWT token
    - expect: API responds with 201 and returns a token
  2. Register a second user via POST https://api.realworld.show/api/users (username: articleauthor_<timestamp>) using the API request fixture to obtain a second JWT token
    - expect: API responds with 201 and returns a token for the second user
  3. Using the second user token, create an article via POST https://api.realworld.show/api/articles with a unique title and record the returned slug and initial favoritesCount (expected: 0)
    - expect: Article is created, favoritesCount in the API response is 0, favorited is false
  4. Navigate to http://localhost:4200/login and log in as favuser1 (first user) by filling Email and Password fields and clicking Sign in
    - expect: Page redirects to /, authenticated nav header is visible with the username
  5. Navigate to http://localhost:4200/ (Home page) and wait for the Global Feed article list to load
    - expect: Home page is visible with Global Feed tab active and at least one article preview card
  6. Locate the article preview card for the article created in step 3. Read the current favorites count displayed on the heart button before clicking
    - expect: The article card shows a heart button with ion-heart icon and a numeric count (0)
  7. Click the heart/favorite button on the article preview card
    - expect: The button state changes visually (active/filled state), the displayed count increments by 1 to become 1
  8. Capture all network requests triggered by the click and inspect the favorite request: it must be POST https://api.realworld.show/api/articles/{slug}/favorite with Authorization header Token <jwt>
    - expect: Exactly one POST request is sent to /api/articles/{slug}/favorite
    - expect: The request carries the correct Authorization header
    - expect: The API returns 200 with article.favoritesCount = 1 and article.favorited = true
  9. Reload the Home page and locate the same article card again to verify the count is persistent
    - expect: After page reload the heart button shows count 1

#### 1.2. Authenticated user can unfavorite an article from the Home feed and counter decrements

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register a new user via API and create an article via API as a second user (same setup as previous test). Favorite the article via POST https://api.realworld.show/api/articles/{slug}/favorite using the first user token so that favoritesCount starts at 1
    - expect: API returns favoritesCount = 1 and favorited = true
  2. Navigate to http://localhost:4200/login and log in as the first user
    - expect: Authenticated nav is visible
  3. Navigate to http://localhost:4200/ and find the article card. Verify the heart button shows count 1 and is in active/favorited state
    - expect: Heart button displays count 1
  4. Click the active heart button to unfavorite the article
    - expect: Button returns to inactive state
    - expect: Count decrements to 0
  5. Inspect the network request triggered by the click
    - expect: A DELETE request is sent to https://api.realworld.show/api/articles/{slug}/favorite
    - expect: API returns 200 with article.favoritesCount = 0 and article.favorited = false

#### 1.3. Authenticated user can favorite an article from the Article View page and counter increments

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register author user via API, create an article via API, record slug and initial favoritesCount (0). Register a reader user via API
    - expect: Both users registered, article created with favoritesCount = 0
  2. Navigate to http://localhost:4200/login and log in as the reader user
    - expect: Authenticated nav shows reader username
  3. Navigate to http://localhost:4200/article/{slug}
    - expect: Article view page loads showing the article title, author meta, and action buttons in the banner
  4. Locate the Favorite Post button in the article banner (ion-heart icon). Verify it shows the current count (0) and is in unfavorited state
    - expect: Favorite Post button is visible with count 0 and not in active state
  5. Click the Favorite Post button
    - expect: Button changes to active/filled state
    - expect: Count increments to 1
  6. Inspect the network request triggered by the button click
    - expect: POST request is sent to https://api.realworld.show/api/articles/{slug}/favorite
    - expect: Response status is 200
    - expect: Response body contains article.favoritesCount = 1 and article.favorited = true
  7. Verify the action buttons in the article-actions section below the article body also reflect the updated count
    - expect: The duplicate Favorite Post button below the body also shows count 1 and active state

#### 1.4. Article author does NOT see Favorite Post button on own article view page

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register a user via API and create an article as that user via API. Log in to the app via http://localhost:4200/login as the same user
    - expect: Authenticated nav shows own username
  2. Navigate to http://localhost:4200/article/{slug}
    - expect: Article view page loads
  3. Inspect the article banner for the Favorite Post button
    - expect: The Favorite Post button is NOT visible in the banner
    - expect: Instead, Edit Article and Delete Article buttons are visible

#### 1.5. BUG-010 regression: two users favoriting the same article — favoritesCount must reach 2

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register three users via API: user A (author), user B (reader 1), user C (reader 2). Create an article as user A via API. Record the slug
    - expect: Article created with favoritesCount = 0
  2. Log in to the app as user B. Navigate to http://localhost:4200/article/{slug} and click the Favorite Post button
    - expect: Count on the button updates to 1 after click
  3. Inspect the network response for POST /api/articles/{slug}/favorite for user B
    - expect: API returns article.favoritesCount = 1
  4. Log out (navigate to http://localhost:4200/settings, scroll to logout button, click Or click here to logout) and log in as user C
    - expect: Authenticated nav shows user C username
  5. Navigate to http://localhost:4200/article/{slug} and click the Favorite Post button as user C
    - expect: Count on the button updates to 2 after click (EXPECTED per spec)
    - expect: THIS TEST IS EXPECTED TO FAIL due to BUG-010: favoritesCount stays at 1 instead of 2
  6. Inspect the network response for POST /api/articles/{slug}/favorite for user C
    - expect: API returns article.favoritesCount = 2 (expected but currently returns 1 — BUG-010)
  7. Reload the article page and verify the displayed count
    - expect: After reload, displayed count should be 2 (expected but will show 1 due to bug)

#### 1.6. BUG regression: favorite button sends correct API contract (POST to /api/articles/{slug}/favorite, not a wrong URL)

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register user A (author) via API and create an article. Register user B (reader) via API. Log in to the app as user B. Navigate to http://localhost:4200/ Home page
    - expect: Home page loads with article cards visible
  2. Start intercepting all network requests. Click the heart/favorite button on the article card in the Global Feed
    - expect: A network request is triggered by the click
  3. Verify the exact URL, method, and Authorization header of the outbound favorite request
    - expect: Method must be POST
    - expect: URL must match https://api.realworld.show/api/articles/{slug}/favorite exactly (no extra path segments, no wrong verb)
    - expect: Authorization header must be in format 'Token <jwt>' (not 'Bearer <jwt>')
    - expect: THIS TEST IS EXPECTED TO FAIL due to the known bug: counter updates in UI but the request has a wrong contract
  4. Verify the response status code is 200 and the response body contains the article object with updated favoritesCount
    - expect: Response status is 200
    - expect: Response body shape matches SingleArticleResponse schema from openapi.json

#### 1.7. Unauthenticated user clicking the favorite button is prompted to log in (not silently ignored)

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Navigate to http://localhost:4200/ without logging in (fresh browser state)
    - expect: Home page loads, unauthenticated header shows Sign in and Sign up links
  2. Locate any article preview card with a heart button in the Global Feed
    - expect: Article card is visible with heart button and count
  3. Click the heart/favorite button without being authenticated
    - expect: User is redirected to /login OR the button is disabled OR a prompt to sign in appears
    - expect: No POST /api/articles/{slug}/favorite request is made without an Authorization token

#### 1.8. Favorited articles appear on Profile favorites tab

**File:** `tests/e2e/e2e-favorites.spec.ts`

**Steps:**
  1. Register user A (author) via API and create an article. Register user B (reader) via API. Favorite the article as user B via POST https://api.realworld.show/api/articles/{slug}/favorite using user B token
    - expect: API returns favoritesCount = 1 and favorited = true
  2. Log in to the app as user B. Navigate to http://localhost:4200/profile/{userB_username}/favorites
    - expect: Profile Favorited Articles tab is active, showing the favorited article card
  3. Verify the article card on the favorites tab shows the correct title, author, and a heart button
    - expect: The article created by user A appears in user B's favorited tab
    - expect: Heart button is visible with a count >= 1
  4. Click the heart button on the article card in the favorites tab to unfavorite
    - expect: Article card disappears from the favorites tab after unfavoriting (or count updates to 0)

### 2. Settings / Profile Editing Form

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. Settings page renders all required fields and Update Settings button

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via POST https://api.realworld.show/api/users and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Page loads with heading 'Your Settings'
  3. Verify the form contains a text input with placeholder 'URL of profile picture'
    - expect: Input is visible and accepts text input
  4. Verify the form contains a text input with placeholder or label 'Your Name'
    - expect: Input is visible and accepts text input
  5. Verify the form contains a textarea with placeholder 'Short bio about you' with 8 rows
    - expect: Textarea is visible and accepts text input
  6. Verify the form contains a text input with placeholder 'Email' pre-populated with the current user email
    - expect: Email input is visible and contains the registered user's email address
  7. Verify the form contains a password input with placeholder 'New Password'
    - expect: Password input is visible and empty
  8. Verify an 'Update Settings' submit button is present (right-aligned)
    - expect: Update Settings button is visible and enabled
  9. Verify a horizontal rule separates the form from a logout button
    - expect: An <hr> element is present
    - expect: A logout button labeled 'Or click here to logout.' is visible below the hr

#### 2.2. BUG regression: opening /settings must NOT trigger GET /api/user/edit request

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Start capturing all network requests, then navigate to http://localhost:4200/settings
    - expect: Settings page loads with heading 'Your Settings'
  3. After the page finishes loading, inspect all network requests made during navigation and identify any request to /api/user/edit
    - expect: No request to GET https://api.realworld.show/api/user/edit must be present
    - expect: The valid request to load user data is GET https://api.realworld.show/api/user (without /edit suffix)
    - expect: THIS TEST IS EXPECTED TO FAIL due to known bug: an extra GET /api/user/edit request is made on page load
  4. Verify that the correct GET /api/user request IS made and returns 200
    - expect: GET https://api.realworld.show/api/user returns 200 and populates form fields with current user data

#### 2.3. BUG regression: clicking Update Settings button saves changes (button currently does not work)

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads
  3. Clear the 'Your Name' field and type a new display name: 'UpdatedName_<timestamp>'
    - expect: Field shows the new value
  4. Clear the 'Short bio about you' textarea and type: 'This is my updated bio'
    - expect: Textarea shows the new value
  5. Click the 'Update Settings' button
    - expect: A PUT request is sent to https://api.realworld.show/api/user with Authorization header Token <jwt>
    - expect: The request body contains { user: { username: 'UpdatedName_<timestamp>', bio: 'This is my updated bio' } }
    - expect: The API returns 200 with updated user data
    - expect: THIS TEST IS EXPECTED TO FAIL due to known bug: the Update Settings button does not trigger any PUT /api/user request
  6. Verify the page reflects the saved state (no error messages, success feedback or redirect)
    - expect: No ul.error-messages is displayed
    - expect: The nav header updates to show the new username OR the page stays on /settings with updated values
  7. Navigate away to / and back to /settings to confirm changes persisted
    - expect: 'Your Name' field shows 'UpdatedName_<timestamp>'
    - expect: 'Short bio about you' textarea shows 'This is my updated bio'

#### 2.4. Settings form: updating email to a valid new email saves correctly

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API (original email: origuser_<timestamp>@example.com). Log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads, Email field pre-populated with origuser_<timestamp>@example.com
  3. Clear the Email field and type a new unique email: newmail_<timestamp>@example.com
    - expect: Email field shows the new value
  4. Click the 'Update Settings' button
    - expect: PUT request sent to https://api.realworld.show/api/user with the new email in the body
    - expect: API returns 200 with user.email = 'newmail_<timestamp>@example.com'
    - expect: THIS TEST IS EXPECTED TO FAIL if the Update Settings button bug is present
  5. Log out, then attempt to log back in at /login using the new email and original password
    - expect: Login succeeds with the new email
    - expect: Authenticated nav is visible confirming the email change persisted

#### 2.5. Settings form: updating password allows login with new password

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API with password 'Password123!'. Log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads
  3. Type a new password 'NewPassword456!' into the 'New Password' field
    - expect: Password input shows entered characters (masked)
  4. Click the 'Update Settings' button
    - expect: PUT request sent to https://api.realworld.show/api/user with password: 'NewPassword456!' in the request body
    - expect: API returns 200
    - expect: THIS TEST IS EXPECTED TO FAIL if the Update Settings button bug is present
  5. Log out via the logout button on /settings, then navigate to /login. Attempt to log in with original password 'Password123!'
    - expect: Login fails — error messages appear in ul.error-messages
  6. Log in with new password 'NewPassword456!'
    - expect: Login succeeds and authenticated nav is visible

#### 2.6. Settings form: updating profile picture URL reflects in avatar display

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible, default avatar (smiley face) is shown
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads, 'URL of profile picture' field is empty or shows default
  3. Type a valid image URL into the 'URL of profile picture' field: 'https://i.pravatar.cc/150?img=5'
    - expect: Field shows the URL value
  4. Click the 'Update Settings' button
    - expect: PUT request sent to https://api.realworld.show/api/user with image: 'https://i.pravatar.cc/150?img=5'
    - expect: API returns 200 with user.image set to the URL
    - expect: THIS TEST IS EXPECTED TO FAIL if the Update Settings button bug is present
  5. Navigate to http://localhost:4200/profile/{username} to verify the avatar image
    - expect: Profile page shows the avatar image loaded from the provided URL

#### 2.7. Settings page: logout button logs out the user and redirects to home

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads with 'Your Settings' heading
  3. Click the 'Or click here to logout.' button
    - expect: User is logged out
    - expect: Page redirects to / or /login
    - expect: Nav header shows Sign in and Sign up links (unauthenticated state)
  4. Verify the JWT token has been cleared from localStorage
    - expect: localStorage does not contain an auth token after logout

#### 2.8. Settings page: unauthenticated access redirects to login

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. In a fresh browser state (no JWT in localStorage), navigate directly to http://localhost:4200/settings
    - expect: User is redirected to /login or the home page
    - expect: Settings form is NOT accessible without authentication

#### 2.9. Settings form: submitting with all fields empty or cleared shows validation errors

**File:** `tests/e2e/e2e-settings.spec.ts`

**Steps:**
  1. Register a new user via API and log in via http://localhost:4200/login
    - expect: Authenticated nav is visible
  2. Navigate to http://localhost:4200/settings
    - expect: Settings page loads
  3. Clear the Email field entirely (delete all text) and click 'Update Settings'
    - expect: Either: validation error messages appear in ul.error-messages listing missing required email
    - expect: Or: PUT request is sent and API returns 422 Unprocessable Entity, which the UI displays as errors
    - expect: THIS TEST IS EXPECTED TO FAIL if the Update Settings button bug prevents any request from being sent

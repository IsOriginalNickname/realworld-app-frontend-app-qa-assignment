# Full Article Lifecycle E2E Test Plan

## Application Overview

The RealWorld app (Conduit) is an Angular-based frontend running at http://localhost:4200, backed by a REST API at https://api.realworld.show/api. The app implements a blogging platform where users can register, log in, publish articles, comment on articles, and delete their own articles. The navigation bar adapts based on authentication state: unauthenticated users see "Home", "Sign in", and "Sign up" links; authenticated users see "Home", "New Article" (with a plus icon), "Settings", a username profile link, and a "Sign out" button. The registration form includes Username, Email address, Password, and Password confirmation fields. The login form includes Email address and Password fields. Both submit buttons start disabled and become enabled once the required fields are filled. After successful registration the app automatically logs the user in and redirects to the home page. After successful login the app redirects to the home page. The article editor at /editor has four inputs: Article Title (text), What's this article about? (text), Write your article (in markdown) (textarea), and Enter tags (separated by spaces) (text), plus a "Publish Article" button. After publishing, the app redirects to the article page at /article/:slug. The article view for the author shows "Edit" and "Delete" buttons in the banner. The comment form contains a "Write a comment..." textarea and a "Post Comment" button that is disabled when the textarea is empty. After posting a comment the textarea is cleared and a trash-icon delete button appears on the comment card. Clicking "Delete" on an article triggers a browser confirm dialog with the message "Are you sure you want to delete this article?"; accepting it deletes the article and redirects to the home page. Clicking "Sign out" redirects to the /login page.

## Test Scenarios

### 1. Full Article Lifecycle

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. User can register, publish article, comment on it, and delete it

**File:** `tests/e2e/full-article-lifecycle.spec.ts`

**Steps:**
  1. Navigate to http://localhost:4200/register
    - expect: The page title is 'Sign up'
    - expect: A form is visible with four labelled fields: Username, Email address, Password, and Password confirmation
    - expect: The 'Sign up' button is disabled
  2. Fill in the Username field (id='username') with a unique value such as 'lifecycleuser' using page.locator('#username').fill('lifecycleuser')
    - expect: The Username field contains the entered text
  3. Fill in the Email address field (id='email') with a unique email such as 'lifecycleuser@example.com' using page.locator('#email').fill('lifecycleuser@example.com')
    - expect: The Email address field contains the entered text
  4. Fill in the Password field (id='password') with 'Password123!' using page.locator('#password').fill('Password123!')
    - expect: The Password field is filled
  5. Fill in the Password confirmation field (id='passwordConfirmation') with 'Password123!' using page.locator('#passwordConfirmation').fill('Password123!')
    - expect: The Password confirmation field is filled
    - expect: The 'Sign up' button becomes enabled (the [disabled] attribute is removed)
  6. Click the 'Sign up' button using page.locator('button', { hasText: 'Sign up' }).click()
    - expect: The app redirects to the home page at http://localhost:4200/
    - expect: The navigation bar shows 'New Article', 'Settings', the username 'lifecycleuser', and a 'Sign out' button, confirming the user is authenticated
    - expect: The 'Sign in' and 'Sign up' nav links are no longer visible
  7. Click the 'Sign out' button in the navigation bar using page.locator('button', { hasText: 'Sign out' }).click()
    - expect: The app redirects to the login page at http://localhost:4200/login
    - expect: The navigation bar shows 'Sign in' and 'Sign up' links
    - expect: The page heading reads 'Sign in'
  8. Fill in the Email address field (id='email') with 'lifecycleuser@example.com' using page.locator('#email').fill('lifecycleuser@example.com')
    - expect: The Email address field contains the entered text
  9. Fill in the Password field (id='password') with 'Password123!' using page.locator('#password').fill('Password123!')
    - expect: The Password field is filled
    - expect: The 'Sign in' button becomes enabled
  10. Click the 'Sign in' button using page.locator('button', { hasText: 'Sign in' }).click()
    - expect: The app redirects to the home page at http://localhost:4200/
    - expect: The navigation bar shows 'New Article', 'Settings', 'lifecycleuser', and 'Sign out', confirming authentication
  11. Navigate to http://localhost:4200/editor (or click the 'New Article' link in the nav)
    - expect: The page title is 'Create article'
    - expect: The editor form is visible with four inputs: 'Article Title', 'What's this article about?', 'Write your article (in markdown)', and 'Enter tags (separated by spaces)'
    - expect: A 'Publish Article' button is present
  12. Fill in the Article Title input (placeholder='Article Title') with 'My Lifecycle Test Article' using page.locator('input[placeholder="Article Title"]').fill('My Lifecycle Test Article')
    - expect: The Article Title field contains 'My Lifecycle Test Article'
  13. Fill in the description input (placeholder="What's this article about?") with 'A short description for the lifecycle test' using page.locator('input[placeholder="What\'s this article about?"]').fill('A short description for the lifecycle test')
    - expect: The description field contains the entered text
  14. Fill in the body textarea (placeholder='Write your article (in markdown)') with 'This is the body of the lifecycle test article.' using page.locator('textarea[placeholder="Write your article (in markdown)"]').fill('This is the body of the lifecycle test article.')
    - expect: The body textarea contains the entered text
  15. Fill in the tags input (placeholder='Enter tags (separated by spaces)') with 'lifecycle test' using page.locator('input[placeholder="Enter tags (separated by spaces)"]').fill('lifecycle test')
    - expect: The tags field contains 'lifecycle test'
  16. Click the 'Publish Article' button using page.locator('button', { hasText: 'Publish Article' }).click()
    - expect: The app redirects to the article view page at a URL matching /article/my-lifecycle-test-article
    - expect: The article banner displays the heading 'My Lifecycle Test Article'
    - expect: The author name 'lifecycleuser' is shown in the article meta
    - expect: Two action buttons labelled 'Edit' and 'Delete' are visible in the banner (as the logged-in user is the author)
    - expect: The article body text 'This is the body of the lifecycle test article.' is rendered
    - expect: Tags 'lifecycle' and 'test' are listed
    - expect: The comment section shows an empty 'Write a comment...' textarea and a disabled 'Post Comment' button
    - expect: The text 'No comments yet...' is shown
  17. Fill in the comment textarea (placeholder='Write a comment...') with 'This is my test comment.' using page.locator('textarea[placeholder="Write a comment..."]').fill('This is my test comment.')
    - expect: The comment textarea contains 'This is my test comment.'
    - expect: The 'Post Comment' button becomes enabled
  18. Click the 'Post Comment' button using page.locator('button', { hasText: 'Post Comment' }).click()
    - expect: The comment textarea is cleared
    - expect: The 'Post Comment' button becomes disabled again
    - expect: The comment 'This is my test comment.' appears in the comments list below the form
    - expect: The comment card shows the author name 'lifecycleuser' and a trash-icon delete button
    - expect: The 'No comments yet...' placeholder is no longer visible
  19. Set up a dialog handler to accept the confirmation dialog, then click the 'Delete' button in the article banner using page.once('dialog', d => d.accept()) followed by page.locator('button', { hasText: 'Delete' }).click()
    - expect: A browser confirm dialog appears with the message 'Are you sure you want to delete this article?'
    - expect: After accepting the dialog, the app redirects to the home page at http://localhost:4200/
    - expect: The deleted article 'My Lifecycle Test Article' does not appear in the Global Feed
    - expect: The navigation bar still shows the authenticated state with 'lifecycleuser'

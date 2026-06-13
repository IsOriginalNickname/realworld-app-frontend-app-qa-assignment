# RealWorld Frontend Specification
> Source: https://docs.realworld.show/specifications/frontend/
> Compiled for E2E test validation

---

## 1. Head / Assets

- [ ] The `<head>` includes `<meta charset="utf-8" />`
- [ ] The `<head>` sets `<title>Conduit</title>`
- [ ] The page loads Ionicons v2 stylesheet from CDN (`ionicons.min.css`)
- [ ] The page loads Google Fonts: `Source Sans Pro` (weights 300, 400, 600, 700) and `Lora` (weights 400, 700)
- [ ] The page loads the shared Conduit theme stylesheet (`/styles.css`)
- [ ] `styles.css` is served from the app itself (not from an external CDN)

---

## 2. Styles / CSS Classes

- [ ] All pages use CSS classes defined in `styles.css` (Conduit Minimal CSS v4)
- [ ] CSS class names in the HTML match the template spec and E2E test selectors contract
- [ ] `styles.css` does NOT bundle fonts or icons — they are loaded separately
- [ ] Icons used across templates are from the Ionicons v2 set:
  - `ion-heart`
  - `ion-compose`
  - `ion-edit`
  - `ion-gear-a`
  - `ion-plus-round`
  - `ion-trash-a`
  - `ion-close-round`
- [ ] When a user has no profile image, a default avatar (smiley face icon) is displayed

---

## 3. Routing

| Page            | URL pattern                              |
|-----------------|------------------------------------------|
| Home            | `/`                                      |
| Login           | `/login`                                 |
| Register        | `/register`                              |
| Settings        | `/settings`                              |
| New Article     | `/editor`                                |
| Edit Article    | `/editor/:article-slug`                  |
| Article View    | `/article/:article-slug`                 |
| Profile         | `/profile/:username`                     |
| Favorited       | `/profile/:username/favorites`           |

- [ ] Home page is accessible at `/`
- [ ] Login page is accessible at `/login`
- [ ] Register page is accessible at `/register`
- [ ] Settings page is accessible at `/settings`
- [ ] New article editor is accessible at `/editor`
- [ ] Edit article editor is accessible at `/editor/:article-slug`
- [ ] Article view is accessible at `/article/:article-slug`
- [ ] Profile page is accessible at `/profile/:username`
- [ ] Favorited articles tab is accessible at `/profile/:username/favorites`
- [ ] JWT token is stored in `localStorage` after successful authentication
- [ ] Authentication can be switched to session/cookie-based (architecture concern)

---

## 4. Layout — Header

### 4.1 Unauthenticated Header

- [ ] The navbar contains a brand link `conduit` pointing to `/`
- [ ] The navbar contains a `Home` link pointing to `/`
- [ ] The navbar contains a `Sign in` link pointing to `/login`
- [ ] The navbar contains a `Sign up` link pointing to `/register`
- [ ] The link matching the current active page has the CSS class `active`

### 4.2 Authenticated Header

- [ ] The navbar contains a brand link `conduit` pointing to `/`
- [ ] The navbar contains a `Home` link pointing to `/`
- [ ] The navbar contains a `New Article` link (with `ion-compose` icon) pointing to `/editor`
- [ ] The navbar contains a `Settings` link (with `ion-gear-a` icon) pointing to `/settings`
- [ ] The navbar contains a profile link showing the user's avatar and username, pointing to `/profile/:username`
- [ ] The link matching the current active page has the CSS class `active`

---

## 5. Layout — Footer

- [ ] The footer contains a `conduit` logo link pointing to `/`
- [ ] The footer contains an attribution text: `"An interactive learning project. Code & design licensed under MIT."`

---

## 6. Home Page (`/`)

- [ ] The page renders a banner with heading `conduit` and tagline `"A place to share your knowledge."`
- [ ] The page renders a `Global Feed` tab (active by default)
- [ ] The `Your Feed` tab is visible **only** when the user is authenticated
- [ ] A tag-filtered tab appears when the user clicks a popular tag (tab label equals the tag name)
- [ ] Clicking a tab switches the article list content accordingly
- [ ] Each article preview shows: author avatar, author name, date, favorite count button, article title, description, `Read more...` link, and tag list
- [ ] The favorite button shows `ion-heart` icon and the current favorites count
- [ ] Article previews are paginated; pagination controls are rendered below the list
- [ ] The active pagination page item has the CSS class `active`
- [ ] The sidebar shows a `Popular Tags` section with clickable tag pills
- [ ] Clicking a tag pill opens a new tag-filtered tab on the Home feed

---

## 7. Login Page (`/login`)

- [ ] The page heading is `Sign in`
- [ ] There is a link `"Need an account?"` pointing to `/register`
- [ ] The form contains an `Email` text input
- [ ] The form contains a `Password` password input
- [ ] The form contains a `Sign in` submit button (aligned right)
- [ ] Validation error messages are displayed in a `ul.error-messages` list when login fails

---

## 8. Register Page (`/register`)

- [ ] The page heading is `Sign up`
- [ ] There is a link `"Have an account?"` pointing to `/login`
- [ ] The form contains a `Username` text input
- [ ] The form contains an `Email` text input
- [ ] The form contains a `Password` password input
- [ ] The form contains a `Sign up` submit button (aligned right)
- [ ] Validation error messages are displayed in a `ul.error-messages` list when registration fails

---

## 9. Settings Page (`/settings`)

- [ ] The page heading is `Your Settings`
- [ ] The form contains a `URL of profile picture` text input
- [ ] The form contains a `Your Name` text input
- [ ] The form contains a `Short bio about you` textarea (8 rows)
- [ ] The form contains an `Email` text input
- [ ] The form contains a `New Password` password input
- [ ] The form contains an `Update Settings` submit button (aligned right)
- [ ] A horizontal rule (`<hr>`) separates the form from the logout button
- [ ] A `"Or click here to logout."` button is present and logs the user out
- [ ] Validation error messages are displayed in a `ul.error-messages` list

---

## 10. Article Editor Page (`/editor`, `/editor/:slug`)

- [ ] The form contains an `Article Title` large text input
- [ ] The form contains a `"What's this article about?"` text input
- [ ] The form contains a `"Write your article (in markdown)"` textarea (8 rows)
- [ ] The form contains an `Enter tags` text input
- [ ] Entered tags are displayed as removable pills below the tag input (with `ion-close-round` remove icon)
- [ ] The form contains a `Publish Article` button (aligned right)
- [ ] Validation error messages are displayed in a `ul.error-messages` list

---

## 11. Article View Page (`/article/:slug`)

- [ ] The banner displays the article title
- [ ] The banner displays the article meta: author avatar, author name, publication date
- [ ] The banner shows a `Follow <author>` button (with `ion-plus-round` icon) — **only for non-authors**
- [ ] The banner shows a `Favorite Post` button with count (with `ion-heart` icon) — **only for non-authors**
- [ ] The banner shows an `Edit Article` button (with `ion-edit` icon) — **only for the article's author**
- [ ] The banner shows a `Delete Article` button (with `ion-trash-a` icon) — **only for the article's author**
- [ ] Article body is rendered from Markdown (client-side)
- [ ] Article tags are displayed as a tag list at the end of the article body
- [ ] The article action buttons (Follow / Favorite / Edit / Delete) are repeated in the `article-actions` section below the article body
- [ ] The comments section is rendered below the article actions

### 11.1 Comments Section

- [ ] Authenticated users see a comment form with a textarea (`"Write a comment..."`) and a `Post Comment` button
- [ ] The comment form shows the current user's avatar
- [ ] Posted comments are listed below the form, each showing: body text, author avatar, author name, date
- [ ] A delete button (`ion-trash-a`) is shown on each comment **only for the comment's author**

---

## 12. Profile Page (`/profile/:username`)

- [ ] The page displays the user's avatar image
- [ ] The page displays the user's username
- [ ] The page displays the user's bio
- [ ] A `Follow <username>` button (with `ion-plus-round` icon) is shown when **viewing another user's profile**
- [ ] An `Edit Profile Settings` button (with `ion-gear-a` icon) is shown when **viewing own profile**
- [ ] The page has a `My Articles` tab (active by default)
- [ ] The page has a `Favorited Articles` tab
- [ ] Switching tabs updates the article list accordingly
- [ ] Articles are displayed as article preview cards (same format as Home feed)
- [ ] The article list is paginated

---

## 13. Article Preview Card (reusable component)

- [ ] Shows author avatar linking to `/profile/:username`
- [ ] Shows author name linking to `/profile/:username`
- [ ] Shows publication date
- [ ] Shows a favorite button with `ion-heart` icon and current count
- [ ] Shows article title
- [ ] Shows article description
- [ ] Shows `"Read more..."` link pointing to `/article/:slug`
- [ ] Shows a list of article tags as pills

# Endpoints

## Authentication Header

Read the authentication header from the request headers:

```
Authorization: Token jwt.token.here
```

---

## Authentication

**POST** `/api/users/login`

No authentication required, returns a User.

Required fields: `email`, `password`

```json
{
  "user": {
    "email": "jake@jake.jake",
    "password": "jakejake"
  }
}
```

---

## Registration

**POST** `/api/users`

No authentication required, returns a User.

Required fields: `email`, `username`, `password`

```json
{
  "user": {
    "username": "Jacob",
    "email": "jake@jake.jake",
    "password": "jakejake"
  }
}
```

---

## Get Current User

**GET** `/api/user`

Authentication required, returns a User that's the current user.

---

## Update User

**PUT** `/api/user`

Authentication required, returns the User.

Accepted fields: `email`, `username`, `password`, `image`, `bio`

```json
{
  "user": {
    "email": "jake@jake.jake",
    "bio": "I like to skateboard",
    "image": "https://i.stack.imgur.com/xHWG8.jpg"
  }
}
```

---

## Get Profile

**GET** `/api/profiles/:username`

Authentication optional, returns a Profile.

---

## Follow User

**POST** `/api/profiles/:username/follow`

Authentication required, returns a Profile. No additional parameters required.

---

## Unfollow User

**DELETE** `/api/profiles/:username/follow`

Authentication required, returns a Profile. No additional parameters required.

---

## List Articles

**GET** `/api/articles`

Returns most recent articles globally by default. Authentication optional, returns multiple articles ordered by most recent first.

Query parameters:

| Parameter   | Description                          | Default |
|-------------|--------------------------------------|---------|
| `tag`      | Filter by tag (e.g. `?tag=AngularJS`) | —       |
| `author`   | Filter by author (e.g. `?author=jake`)| —       |
| `favorited`| Favorited by user (e.g. `?favorited=jake`) | —  |
| `limit`    | Limit number of articles             | 20      |
| `offset`   | Offset/skip number of articles       | 0       |

---

## Feed Articles

**GET** `/api/articles/feed`

Authentication required, returns multiple articles created by followed users, ordered by most recent first.

Supports `limit` and `offset` query parameters (same as List Articles).

---

## Get Article

**GET** `/api/articles/:slug`

No authentication required, returns single article.

---

## Create Article

**POST** `/api/articles`

Authentication required, returns an Article.

Required fields: `title`, `description`, `body`

Optional fields: `tagList` (array of strings)

```json
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "You have to believe",
    "tagList": ["reactjs", "angularjs", "dragons"]
  }
}
```

---

## Update Article

**PUT** `/api/articles/:slug`

Authentication required, returns the updated Article.

Optional fields: `title`, `description`, `body`

> The slug also gets updated when the title is changed. The slug is the article's URL identifier — it must be a unique string. Duplicate titles must still produce distinct slugs. The specific format is up to the implementation (commonly kebab-cased title).

```json
{
  "article": {
    "title": "Did you train your dragon?"
  }
}
```

---

## Delete Article

**DELETE** `/api/articles/:slug`

Authentication required.

---

## Add Comments to an Article

**POST** `/api/articles/:slug/comments`

Authentication required, returns the created Comment.

Required field: `body`

```json
{
  "comment": {
    "body": "His name was my name too."
  }
}
```

---

## Get Comments from an Article

**GET** `/api/articles/:slug/comments`

Authentication optional, returns multiple comments.

---

## Delete Comment

**DELETE** `/api/articles/:slug/comments/:id`

Authentication required.

---

## Favorite Article

**POST** `/api/articles/:slug/favorite`

Authentication required, returns the Article. No additional parameters required.

---

## Unfavorite Article

**DELETE** `/api/articles/:slug/favorite`

Authentication required, returns the Article. No additional parameters required.

---

## Get Tags

**GET** `/api/tags`

No authentication required, returns a List of Tags.


# CORS & Error Handling

## CORS

If the backend runs on a different host/port than the frontend, make sure to:

- Handle **OPTIONS** requests (preflight)
- Return correct `Access-Control-Allow-Origin` header
- Return correct `Access-Control-Allow-Headers` header (e.g. `Content-Type`)

---

## Error Handling

### Validation Errors — 422 Unprocessable Entity

If a request fails any validations, expect a `422` response with errors in the following format:

```json
{
  "errors": {
    "body": [
      "can't be empty"
    ]
  }
}
```

### Other Status Codes

| Code | Meaning |
|------|---------|
| `401` | **Unauthorized** — request requires authentication but it isn't provided |
| `403` | **Forbidden** — request may be valid but the user doesn't have permissions to perform the action |
| `404` | **Not Found** — resource can't be found to fulfill the request |

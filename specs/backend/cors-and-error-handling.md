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

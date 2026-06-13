# API Spec Discrepancies

Сравнение: `openapi.json` vs `old/endpoints.md` + `old/api-response-format.md`

---

## 1. Аутентификация — публичные эндпоинты

OpenAPI добавляет `"security": [{"Token": []}]` на **все** эндпоинты без исключения, тогда как старая документация разделяет требования.

| Эндпоинт | `old/endpoints.md` | `openapi.json` |
|---|---|---|
| `POST /api/users` (регистрация) | без аутентификации | Token security |
| `POST /api/users/login` | без аутентификации | Token security |
| `GET /api/profiles/{username}` | опционально | Token security |
| `GET /api/articles` | опционально | Token security |
| `GET /api/articles/{slug}` | без аутентификации | Token security |
| `GET /api/articles/{slug}/comments` | опционально | Token security |
| `GET /api/tags` | без аутентификации | Token security |

---

## 2. Обязательные поля помечены как nullable

Старая документация указывает обязательные поля (`Required fields`), но в OpenAPI все поля тела запроса имеют тип `anyOf: [string, null]` — то есть фактически необязательные.

| Схема OpenAPI | Поля по `old/endpoints.md` | В `openapi.json` |
|---|---|---|
| `NewUserBody` | `username`, `email`, `password` — required | все nullable |
| `LoginUserBody` | `email`, `password` — required | все nullable |
| `NewArticleBody` | `title`, `description`, `body` — required | все nullable |
| `NewCommentBody` | `body` — required | nullable |

---

## 3. UpdateArticleRequest содержит недокументированное поле

- **`old/endpoints.md`**: `PUT /api/articles/{slug}` — опциональные поля: `title`, `description`, `body`
- **`openapi.json`** (`UpdateArticleBody`): дополнительно включает `tagList` (nullable array)

---

## 4. Ответ 409 Conflict не задокументирован в старой доку

OpenAPI указывает ответ `409 Conflict` для:
- `POST /api/users` — дубликат пользователя
- `POST /api/articles` — дубликат статьи

В `old/endpoints.md` эти случаи не описаны.

---

## 5. Поле `body` в ArticleSchema (списки статей)

- `old/api-response-format.md` явно предупреждает: с 2024-08-16 `GET /api/articles` и `GET /api/articles/feed` **не возвращают** поле `body`
- В `openapi.json` `ArticleSchema.body` присутствует как nullable (не в `required`), что технически согласуется, но явное примечание об этом изменении в схеме отсутствует
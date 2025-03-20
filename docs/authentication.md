<h1>Authentication</h1>

The Summarization API uses **API Key authentication** to control access.
There are two ways to provide an API key:

1. **Environment Variables (`.env`)** – The API owner can set `OPENAI_API_KEY` and `DEEPSEEK_API_KEY` to allow authorized access without requiring clients to provide API keys. However this only works if the **origin** is same as the value of `ALLOWED_ORIGIN`.
2. **Request Headers** – Clients can include an API key in the `Authorization` header for each request.

> When there is both a `.env` key and a request header key, the request header key will be used.

- [1. API Key Authentication (Recommended)](#1-api-key-authentication-recommended)
  - [Providing API Key in Request Headers](#providing-api-key-in-request-headers)
    - [Example Request:](#example-request)
    - [Request Header Format:](#request-header-format)
- [2. Allowed Origin Configuration](#2-allowed-origin-configuration)
- [3. API Key Validation](#3-api-key-validation)
  - [Validation Rules\*\*](#validation-rules)
- [4. Example: API Request without API Key (no Authorization Header)](#4-example-api-request-without-api-key-no-authorization-header)
- [Next Steps](#next-steps)

---

## 1. API Key Authentication (Recommended)

### Providing API Key in Request Headers

Clients can send their API key dynamically in the `Authorization` header:

#### Example Request:

```sh
curl -X POST http://localhost:3000/summarize/text \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "content": { "text": "This is a test." }, "options": {} }'
```

#### Request Header Format:

```
Authorization: Bearer YOUR_API_KEY
```

---

## 2. Allowed Origin Configuration

The API restricts access to the default keys to specific **frontend applications** by defining `ALLOWED_ORIGIN`.  
If an origin is **not** allowed, then the api key must be provided in the request headers.

```ini
ALLOWED_ORIGIN=http://localhost:3001
```

- If a frontend **matches `ALLOWED_ORIGIN`**, it **does not** need to send API keys.
- If a frontend **is not listed in `ALLOWED_ORIGIN`**, it must include API keys in request headers.

---

## 3. API Key Validation

The API uses a **security guard (`ApiKeyGuard`)** to verify API keys before processing requests.

### Validation Rules\*\*

| **Scenario**                                   | **What Happens?**                            |
| ---------------------------------------------- | -------------------------------------------- |
| **Valid API Key in Request Header**            | ✅ Request is allowed                        |
| **Valid API Key in `.env` but not in request** | ✅ Request is allowed (uses `.env` key)      |
| **Valid API Key in `.env` and in request**     | ✅ Request is allowed (uses request api key) |
| **No API Key provided in request or `.env`**   | ❌ Request is rejected                       |

---

## 4. Example: API Request without API Key (no Authorization Header)

```sh
curl -X POST http://localhost:3000/summarize/text \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -d '{ "content": { "text": "This is a test." }, "options": {} }'
```

This will be valid only if the `ALLOWED_ORIGIN` is `http://localhost:3001`.

---

## Next Steps

- **[API Endpoints](./api-endpoints.md)** – Learn how to use the API
- **[Summarization Customization](./summarization-options-customization.md)** – Fine-tune summaries

<h1>Getting Started</h1>

> For now, the Summarization API must be installed, set up, and hosted by whoever wants to use it.
> We have not yet deployed a publicly accessible hosted version. Developers need to run their own instance following the steps below.

- [Prerequisites](#prerequisites)
- [Installation\*\*](#installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
- [Configuration](#configuration)
  - [1. Set Up Environment Variables](#1-set-up-environment-variables)
  - [2. Explanation of Environment Variables](#2-explanation-of-environment-variables)
- [Running the API (Self-Hosting Required)](#running-the-api-self-hosting-required)
  - [1. Start the Development Server](#1-start-the-development-server)
  - [2. Start the Production Server](#2-start-the-production-server)
- [Verifying the Setup](#verifying-the-setup)
- [Providing API Keys in Requests](#providing-api-keys-in-requests)
- [Next Steps](#next-steps)

---

## Prerequisites

Before using the Summarization API, ensure you have the following:

- **Node.js v20+** installed
- **pnpm v10+** installed ([pnpm installation guide](https://pnpm.io/installation))
- **Python 3** installed _(required for processing YouTube videos)_

---

## Installation\*\*

### 1. Clone the Repository

```sh
git clone https://github.com/letssummarize/lets-summarize-api.git
cd lets-summarize-api
```

### 2. Install Dependencies

Using pnpm:

```sh
pnpm install
```

---

## Configuration

### 1. Set Up Environment Variables

Create a `.env` file in the project root and add the following configuration:

```ini
# OpenAI API Key for summarization (Optional if provided in request headers)
OPENAI_API_KEY=

# DeepSeek API Key for summarization (Optional if provided in request headers)
DEEPSEEK_API_KEY=

# Origin that is allowed to use the `OPENAI_API_KEY` & `DEEPSEEK_API_KEY` provided by the API
# instead of needing to provide them as `Authorization` in each request from client
ALLOWED_ORIGIN=http://localhost:3001

# Max Tokens (Limit the response length)
OPENAI_MAX_TOKENS=500
DEEPSEEK_MAX_TOKENS=1000

# AWS S3 Configuration (Optional to store text-to-speech audio files)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
USE_S3=false
```

> **Note:** API keys (`OPENAI_API_KEY` and `DEEPSEEK_API_KEY`) are **not required in `.env`** if the client application provides one of them in the `Authorization` header of API requests.

---

### 2. Explanation of Environment Variables

Below is a breakdown of the `.env` variables and their functions:

| **Variable**            | **Description**                                                                                                                                                            | **Required?**                          | **Default Value**       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------- |
| `OPENAI_API_KEY`        | API key for using OpenAI GPT-4o, Whisper, and TTS-1 models. Only works if the origin matches the value of `ALLOWED_ORIGIN`. _(can be provided in request headers instead)_ | ❌ No                                  | None                    |
| `DEEPSEEK_API_KEY`      | API key for using DeepSeek Chat (DeepSeek-V3). Only works if the origin matches the value of `ALLOWED_ORIGIN`. _(can be provided in request headers instead)_              | ❌ No                                  | None                    |
| `ALLOWED_ORIGIN`        | Specifies the allowed frontend origin that can access API-provided keys                                                                                                    | ❌ No                                  | `http://localhost:3001` |
| `OPENAI_MAX_TOKENS`     | Maximum token limit for OpenAI-generated responses                                                                                                                         | ❌ No                                  | `500`                   |
| `DEEPSEEK_MAX_TOKENS`   | Maximum token limit for DeepSeek-generated responses                                                                                                                       | ❌ No                                  | `1000`                  |
| `AWS_ACCESS_KEY_ID`     | AWS Access Key for S3 storage (for text-to-speech audio files)                                                                                                             | ⚠️ Required only if `USE_S3` is `true` | None                    |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key for S3 storage                                                                                                                                              | ⚠️ Required only if `USE_S3` is `true` | None                    |
| `AWS_REGION`            | AWS region where the S3 bucket is located                                                                                                                                  | ⚠️ Required only if `USE_S3` is `true` | `us-east-1`             |
| `AWS_S3_BUCKET`         | S3 bucket name for storing generated audio files                                                                                                                           | ⚠️ Required only if `USE_S3` is `true` | None                    |
| `USE_S3`                | Whether to store text-to-speech audio files on AWS S3                                                                                                                      | ⚠️ Required only if `USE_S3` is `true` | `false`                 |

> **Summary:**
>
> - If using **only OpenAI**, provide `OPENAI_API_KEY` in `.env` or in the request headers.
> - If using **only DeepSeek**, provide `DEEPSEEK_API_KEY` in `.env` or in the request headers.
> - If **both** are provided, the API allows selection between models.
> - If `USE_S3` is `true`, ensure all AWS credentials are correctly set.

---

## Running the API (Self-Hosting Required)

### 1. Start the Development Server

```sh
pnpm run start:dev
```

By default, the API will be available at:

```
http://localhost:3000
```

### 2. Start the Production Server

```sh
pnpm run build
pnpm start
```

> **Reminder:** Since there is no hosted version available yet, you need to deploy this API on your own **server, cloud service, or containerized environment**.

---

## Verifying the Setup

Once the API is running, you can test the health check endpoint:

```bash
curl -X GET http://localhost:3000/
```

**Response:**

```json
{ "message": "Hello there." }
```

---

## Providing API Keys in Requests

If you don't want to store API keys in `.env`, you can pass them dynamically in the request headers:

```sh
curl -X POST http://localhost:3000/summarize/text \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "content": { "text": "This is a test." } }'
```

---

## Next Steps

Now that your API is running, proceed with:

- **[Authentication](./authentication.md)** – Secure API access with keys
- **[API Endpoints](./api-endpoints.md)** – Learn how to use the API
- **[Summarization Customization](./summarization-options-customization.md)** – Fine-tune summaries

<h1>API Endpoints</h1>

The Summarization API provides multiple endpoints for summarizing text, files, and YouTube videos. Below is a list of available endpoints, along with their request formats and expected responses.

- [Available Endpoints](#available-endpoints)
  - [1. API Health Check](#1-api-health-check)
  - [2. Summarize YouTube Video](#2-summarize-youtube-video)
  - [3. Summarize Uploaded File](#3-summarize-uploaded-file)
  - [4. Summarize Raw Text](#4-summarize-raw-text)
- [Authentication \& API Key Usage](#authentication--api-key-usage)

---

## Available Endpoints

### 1. API Health Check

**Endpoint:**

```
GET /
```

**Description:**  
Returns a simple response to verify that the API is running correctly.

**Response:**

```json
{ "message": "Hello there." }
```

---

### 2. Summarize YouTube Video

**Endpoint:**

```
POST /summarize/video
```

**Description:**  
Summarizes the content of a YouTube video using either transcript-based extraction (fast but not always available) or audio-based transcription (slower but more accurate).

**Request Body:**

- `content.videoUrl`: The URL of the YouTube video.
- `options`: Optional customization parameters. check [Summarization Options & Customization](./summarization-options-customization.md)

**Example**

```json
{
  "content": { "videoUrl": "https://www.youtube.com/watch?v=EXAMPLE" },
  "options": {
    "length": "standard",
    "format": "bullet-points",
    "model": "openai",
    "speed": "fast",
    "lang": "english",
    "list": true
  }
}
```

**Response:**

- `summary`: The generated summary.
- `transcript`: The transcript of the video.
- `videoMetadata`: Metadata about the video.
- `audioFilePath`: Path to the audio file of the summary (tts).

```json
{
  "summary": "...",
  "text": "...",
  "videoMetadata": {
    "title": "...",
    "description": "...",
    "thumbnailUrl": "..."
  },
  "audioFilePath": "..."
}
```

---

### 3. Summarize Uploaded File

**Endpoint:**

```
POST /summarize/file
```

**Description:**  
Extracts text from an uploaded file (PDF, DOCX, TXT) and generates a summary.

**Request Headers:**

```
Content-Type: multipart/form-data
```

**Request Body:**

- `options`: Optional customization parameters. check [Summarization Options & Customization](./summarization-options-customization.md)

**Example**

```json
{
  "options": {
    "length": "detailed",
    "format": "narrative",
    "model": "deepseek",
    "lang": "english"
  }
}
```

**Response:**

- `summary`: The generated summary.
- `text`: The text of the document.

**Example**

```json
{
  "summary": "...",
  "text": "..."
}
```

### 4. Summarize Raw Text

**Endpoint:**

```
POST /summarize/text
```

**Description:**  
Generates a summary from raw text input using AI models.

**Request Body:**

- `content.text`: The text to summarize.
- `options`: Optional customization parameters. check [Summarization Options & Customization](./summarization-options-customization.md)

**Example**

```json
{
  "content": {
    "text": "Machine learning is a subset of artificial intelligence..."
  },
  "options": {
    "length": "detailed",
    "format": "narrative",
    "model": "deepseek",
    "lang": "english"
  }
}
```

**Response:**

- `summary`: The generated summary.
- `text`: The text of the document.

```json
{
  "summary": "Machine learning is a specialized branch of AI that enables computers to learn..."
}
```

---

## Authentication & API Key Usage

- An API key must be provided in the `Authorization` header, if the request is from an **unauthorized origin**:
  ```
  Authorization: Bearer YOUR_API_KEY
  ```
- If the request comes from an **allowed origin**, API keys set in `.env` can be used automatically.

---

**Next Steps**

- **[Summarization Customization](./summarization-options-customization.md)** – Learn how to customize summaries.
- **[File Storage](./file-storage.md)** – Understand how files are stored and managed.

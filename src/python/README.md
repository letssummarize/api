# Transcribe API

A FastAPI-based service for speech-to-text transcription using **faster-whisper** model.

> ⚠️ **Note**: This API is still in development, and it still not used in the main **Let's Summarize API**.

## Installation & Usage

### Build & run with Docker

Ensure **Docker** is installed. Then run:

```bash
docker compose up --build -d
```

**optionally check if container is running**

```bash
# To verify that the API is running
docker ps

# To watch logs
docker logs -f faster-whisper
```

## PORT

default port is **5566**

## API Endpoints

### to test if API works

```http
GET /
```

**Response example:**

```json
{
  "status": "running",
  "model_loaded": true,
  "model_loading": false,
  "model_error": null
}
```

### Transcribe Audio

```http
POST /transcribe/
Content-Type: multipart/form-data
```

**Body:**

- `file`: audio file to transcribe (e.g., `.mp3`).

**Response example:**

```json
{
  "text": "Transcribed text ...",
  "language": "en",
  "probability": 0.98,
  "processing_time": 2.34
}
```

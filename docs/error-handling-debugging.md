<h1>Error Handling & Debugging</h1>

This guide explains how errors are handled in the **Let's Summarize API** and how to debug issues effectively.

---

- [Common Error Responses](#common-error-responses)
- [Authentication Errors](#authentication-errors)
- [YouTube Summarization Errors](#youtube-summarization-errors)
- [Audio Processing Errors](#audio-processing-errors)
- [File Summarization Errors](#file-summarization-errors)
- [AI Summarization Errors](#ai-summarization-errors)
- [Debugging Guide](#debugging-guide)
  - [1. **Check API Key**](#1-check-api-key)
  - [2. **Verify YouTube Video**](#2-verify-youtube-video)
  - [3. **Test File Processing**](#3-test-file-processing)
  - [4. **Handle Network Issues**](#4-handle-network-issues)
  - [5. **Check API Provider Status**](#5-check-api-provider-status)
- [Logging and Monitoring](#logging-and-monitoring)
- [Error Reporting](#error-reporting)

---

## Common Error Responses

The API returns standard HTTP error codes with a structured JSON response.

---

## Authentication Errors

| **Status Code** | **Error Message**                | **Description**                                  |
|-----------------|----------------------------------|--------------------------------------------------|
| `401`           | `Invalid API key`                | The API key is incorrect                        |
| `401`           | `Missing API key`                | No API key in the request                        |

**Example Response:**
```json
{
  "error": "Invalid API key"
}
```

---

## YouTube Summarization Errors

| **Status Code** | **Error Message**                                    | **DescriptionD**                                              |
|-----------------|------------------------------------------------------|---------------------------------------------------------------|
| `400`           | `Invalid YouTube URL`                                | The provided YouTube URL is not valid.                        |
| `400`           | `Slow mode is only supported with OpenAI`            | Slow mode requires OpenAI for summarization.                  |
| `400`           | `This video does not have a YouTube transcript`      | The video does not have an automatically generated transcript.|
| `400`           | `There is a problem with network connection`         | A network issue occurred while fetching the transcript.       |
| `500`           | `Could not fetch transcript from YouTube`            | The transcript API call failed.                               |

**Example Response:**
```json
{
  "error": "This video does not have a YouTube transcript"
}
```

---

## Audio Processing Errors

| **Status Code** | **Error Message**                          | **Description**                                 |
|-----------------|--------------------------------------------|-------------------------------------------------|
| `500`           | `Failed to download audio`                 | The audio file could not be downloaded.         |
| `500`           | `Audio file was not created`               | The downloaded audio file is missing.           |
| `500`           | `Failed to transcribe audio`               | The transcription process encountered an error. |

**Example Response:**
```json
{
  "error": "Failed to transcribe audio"
}
```

---

## File Summarization Errors

| **Status Code** | **Error Message**                      | **Description**                           |
|-----------------|----------------------------------------|-------------------------------------------|
| `400`           | `Could not extract text from the file` | The uploaded file could not be processed. |

**Example Response:**
```json
{
  "error": "Could not extract text from the file"
}
```

---

## AI Summarization Errors

| **Status Code** | **Error Message**                              | **Description**                                |
|-----------------|------------------------------------------------|------------------------------------------------|
| `500`           | `Summarization failed with OpenAI`             | The OpenAI summarization API request failed.   |
| `500`           | `Summarization failed with DeepSeek`           | The DeepSeek summarization API request failed. |
| `400`           | `Text-to-speech is only supported with OpenAI` | Text-to-speech is not available for DeepSeek.  |

**Example Response:**
```json
{
  "error": "Summarization failed with OpenAI"
}
```

---

## Debugging Guide

### 1. **Check API Key**
- Ensure the provided API key is valid.
- If using a user-provided API key, verify it is correct.
- If necessary, regenerate a new key.

### 2. **Verify YouTube Video**
- Ensure the URL is correct and publicly accessible.
- Check if the video has a transcript by testing manually on YouTube.
- Some videos may not support automatic transcription.

### 3. **Test File Processing**
- Try a different file format.
- Ensure the file is not corrupted or empty.
- If the error persists, check server logs for extraction errors.

### 4. **Handle Network Issues**
- If the error message suggests a network issue, try again after a few minutes.
- Ensure the server has a stable internet connection.
- Check for rate limits on external APIs.

### 5. **Check API Provider Status**
- If using OpenAI or DeepSeek, verify their API status.
- Check the API quota and limits.
- Review API logs for request errors.

---

## Logging and Monitoring

For better debugging, enable detailed logs to capture error messages and debug information:

```bash
export DEBUG=true
```

Logs will be saved in the `logs/` directory for debugging purposes. These logs include API request details, error messages, and system responses.

---

## Error Reporting

If you encounter persistent issues that are not resolved through debugging:
1. Check the API documentation for correct usage.
2. Verify if the **Let's Summarize API** is experiencing downtime or issues by:
   - Testing a basic request (e.g., summarizing a small text sample).
   - Checking for any announcements or updates from our team.
   - Trying again after a few minutes in case of temporary issues.
3. Contact support with the following details:
   - API request details (URL, payload)
   - Error message received
   - Steps taken to reproduce the issue

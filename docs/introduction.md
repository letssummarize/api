<h1>Introduction</h1>

The **Summarization API** is a service designed to generate concise and meaningful summaries from various content sources. It supports **YouTube videos, uploaded files (PDF, DOCX, TXT), and raw text input**, utilizing AI models like **OpenAI (GPT-4o)** and **DeepSeek (DeepSeek-V3 - DeepSeek-Chat)**.

This API is optimized for **ease of integration**, making it a suitable tool for developers building applications that require **text summarization, transcription, and text-to-speech (TTS) capabilities**.

- [Open-Source Project](#open-source-project)
- [Key Features](#key-features)
- [What You Get with One API Key (OpenAI or DeepSeek)](#what-you-get-with-one-api-key-openai-or-deepseek)
- [Technology Stack](#technology-stack)
- [Use Cases](#use-cases)
- [Next Steps](#next-steps)

## Open-Source Project

This API is **open-source** and actively maintained on **GitHub**. Developers can contribute, report issues, or fork the repository for their own implementations.

🔗 **GitHub Repository:** [Let's Summarize API](https://github.com/letssummarize/api)

## Key Features

✅ **YouTube Video Summarization** – Fetches transcripts or processes audio to generate summaries.  
✅ **File Summarization** – Extracts and summarizes content from PDFs, DOCX, and TXT files.  
✅ **Raw Text Summarization** – Direct AI-based text summarization with configurable output.  
✅ **Multi-Model Support** – Uses **OpenAI GPT-4o** and **DeepSeek Chat (DeepSeek-V3)** for different summarization needs.  
✅ **Text-to-Speech (TTS)** – Converts summaries into **speech** using OpenAI's TTS-1 model.  
✅ **Customizable Summaries** – Options for **length, format, language, speed, and custom instructions**.  
✅ **Summaries Translation** – Even if the content is in another language, the summary will be in the language you choose.

## What You Get with One API Key (OpenAI or DeepSeek)

| **Feature**                                                                      | **OpenAI Key Only**             | **DeepSeek Key Only** | **Both Keys**     |
| -------------------------------------------------------------------------------- | ------------------------------- | --------------------- | ----------------- |
| **Raw Text Summarization**                                                       | ✅ (GPT-4o)                     | ✅ (DeepSeek Chat)    | ✅ (Choose model) |
| **File Summarization (PDF, DOCX, TXT)**                                          | ✅                              | ✅                    | ✅                |
| **YouTube Summarization (Fast Mode)**                                            | ✅ (If transcript is available) | ✅                    | ✅                |
| **YouTube Summarization (Slow Mode - Audio Transcription)**                      | ✅ (Whisper model)              | ❌                    | ✅                |
| **Text-to-Speech (TTS)**                                                         | ✅ (OpenAI TTS-1)               | ❌                    | ✅                |
| **Summary Customization (Length, Format, Language, Speed, Custom Instructions)** | ✅                              | ✅                    | ✅                |
| **Summary Translation (Choose output language)**                                 | ✅                              | ✅                    | ✅                |

> **Note:** Fast Mode relies on YouTube's automatically generated transcripts, which **may not always be available**. Slow Mode manually transcribes the video **for better accuracy but is slower**.

## Technology Stack

The Summarization API is built using **Node.js** with **TypeScript**:

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript-based backend)
- **AI Models:** [OpenAI GPT-4o](https://openai.com), [Whisper](https://openai.com/whisper), [TTS-1](https://openai.com), [DeepSeek Chat](https://deepseek.com)
- **Video Processing:** [YouTube Transcript API](https://github.com/TimeForANinja/node-youtube-transcript), [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **File Handling:** [Multer](https://github.com/expressjs/multer) for uploads, [PDF Parsing](https://www.npmjs.com/package/pdf-parse), [Docx Processing](https://www.npmjs.com/package/mammoth)
- **Storage:** Local file system or AWS S3 integration
- **Authentication:** API Key-based access control
- **Task Scheduling:** Cron Jobs for file cleanup

## Use Cases

This API is ideal for various applications, including:

🔹 **Content Summarization Services** – Generating brief overviews of lengthy documents or videos.  
🔹 **Podcast & Video Highlights** – Extracting key insights from long-form media.  
🔹 **Education & Research** – Providing concise explanations of academic papers or lectures.  
🔹 **Voice-Based Applications** – Enabling TTS-based content consumption.

## Next Steps

To get started, proceed with the **[Getting Started](./getting-started.md)** section, which includes installation and configuration instructions.

# Let's Summarize API

Let's Summarize API is a backend service that provides video, PDF, and text summarization capabilities. Users can integrate this service into their applications, offering summarization for videos via YouTube URLs, PDF files, and text documents.

---

## Prerequisites

Before you get started, make sure you have the following installed:

- Node.js (v20 or higher)
- pnpm (v10 or higher)

## Getting Started

Follow these steps to set up your development environment:

### 1. Install Dependencies

Install the required dependencies using pnpm:

```bash
pnpm install
```
### 2. Start the Development Server
To run the server in development mode, use:

```bash
pnpm start:dev
```
The API will be available at http://localhost:5000 by default.

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying the `.env.example`, or using:

```bash
cp .env.example .env
```
### 4. Install yt-dlp

**Windows:**
- Download from [here](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe)
- Move the downloaded file (**yt-dlp.exe**) to a directory and add that directory path to your system path environment variables.

not using windows? check their [official installation documentation](https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#installation)

### 5. Install FFmpeg

**Windows:**
```bash
winget install "FFmpeg (Essentials Build)"
```

For other installation options, check the [FFmpeg website](https://ffmpeg.org/download.html).
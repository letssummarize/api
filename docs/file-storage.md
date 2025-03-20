# File Storage

The Summarization API processes and stores files when handling **file summarization**, **YouTube video transcription**, and **text-to-speech**. This document explains how files are managed, stored, cleaned up, and how to configure AWS S3 for remote storage.

- [File Storage](#file-storage)
  - [Storage Overview](#storage-overview)
  - [Storage Locations](#storage-locations)
  - [Local Storage](#local-storage)
    - [Example Local Paths](#example-local-paths)
  - [AWS S3 Storage](#aws-s3-storage)
    - [How to Set Up AWS S3 for Storage](#how-to-set-up-aws-s3-for-storage)
    - [Example AWS S3 Path](#example-aws-s3-path)
  - [File Cleanup](#file-cleanup)
    - [Automatic Cleanup](#automatic-cleanup)
    - [Cron Job for Cleanup](#cron-job-for-cleanup)
  - [Next Steps](#next-steps)

---

## Storage Overview

- **Uploaded Documents (PDF, DOCX, TXT)** – Used for file summarization.
- **Audio Files (MP3)** – Generated when processing YouTube videos (if slow mode is used).
- **TTS Audio Files (MP3)** – Created when text-to-speech (`listen: true`) is enabled.

---

## Storage Locations

| File Type           | Storage Location                          |
| ------------------- | ----------------------------------------- |
| Uploaded files      | `./downloads/` (default)                  |
| YouTube audio files | `./downloads/` (if transcribed manually)  |
| TTS-generated audio | `./public/` (if stored locally) or AWS S3 |

> TTS-generated audio files are temporarily stored locally or can be uploaded to **AWS S3** if `USE_S3=true` is set in the environment variables.

---

## Local Storage

By default, all files are saved **locally** in the `downloads` directory unless AWS S3 is enabled.

### Example Local Paths

- `/downloads/example.pdf` (uploaded document)
- `/downloads/audio-example.mp3` (YouTube audio transcription)
- `/public/audio-summary.mp3` (text-to-speech output)

---

## AWS S3 Storage

If **AWS S3 storage** is enabled (`USE_S3=true`), TTS-generated audio files will be uploaded to the configured S3 bucket instead of being stored locally.

### How to Set Up AWS S3 for Storage

To store files on AWS S3, follow these steps:

1. **Create an AWS IAM User**

   - Follow the [AWS guideline](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html)
   - Attach the **AmazonS3FullAccess** permission policy.
   - Generate an access key and save it.

2. **Create an S3 Bucket**

   - Open the **S3 service** in AWS.
   - Click **Create Bucket**.
   - Choose a unique and valid bucket name.
   - Disable **Block all public access** if you want direct access to stored files (not recommended).
   - Click **Create Bucket**.
   - Generate aws bucket policy from [here](https://awspolicygen.s3.amazonaws.com/policygen.html), **with the following settings**:
     - **Select Type of Policy**: `S3 Bucket Policy`
     - **Actions**: check the checkbox `All Actions ('*')`
     - **Resource**: `arn:aws:s3:::your-bucket-name/*`
     - Click: **Add Statement**.
     - Copy the generated policy **JSON**.
   - Enter the created bucket, go to **permissions** tab.
   - Click **Add bucket policy**.
   - Paste the generated policy JSON.
   - Click **Save**.
   - Copy the **Bucket Name**.

3. **Set Up Environment Variables**  
   Add the following to your `.env` file:

   ```ini
   USE_S3=true
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=your-aws-region
   AWS_S3_BUCKET=your-bucket-name
   ```

4. **Restart the API**  
   Run the API again so that it loads the new S3 configuration:

   ```sh
   pnpm run start:dev
   ```

---

### Example AWS S3 Path

Instead of returning a local file path, responses will include a **signed S3 URL**:

```json
{
  "audioFilePath": "https://bucket-name.s3.region.amazonaws.com/audios/audio-summary.mp3"
}
```

---

## File Cleanup

To prevent excessive storage usage, the API automatically deletes old files.

### Automatic Cleanup

- **Local files** older than `MAX_FILE_AGE` (default: **24 hours**) are deleted.
- **AWS S3 files** remain stored unless manually deleted.

### Cron Job for Cleanup

The API runs a scheduled task **every midnight** to remove old files.

---

## Next Steps

- [Error Handling & Debugging](./error-handling-debugging.md) – Learn about API errors and troubleshooting.
- [Summarization Options & Customization](./summarization-options-customization.md) – Configure summarization settings.

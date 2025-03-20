<h1>File Storage</h1>

The Summarization API processes and stores files when handling **file summarization**, **YouTube video transcription**, and **text-to-speech**. This document explains how files are managed, stored, cleaned up, and how to configure AWS S3 for remote storage.

- [Storage Overview](#storage-overview)
- [Storage Locations](#storage-locations)
  - [Local Storage (`USE_S3=false`)](#local-storage-use_s3false)
  - [AWS S3 Storage (`USE_S3=true`)](#aws-s3-storage-use_s3true)
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

The API processes and stores the following types of files:

| File Type                               | Purpose                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------- |
| **Uploaded Documents** (PDF, DOCX, TXT) | Used for **file summarization**.                                           |
| **YouTube Audio Files** (MP3)           | Generated when processing YouTube videos (if **Slow Speed Mode** is used). |
| **TTS Audio Files** (MP3)               | Created when **text-to-speech (`listen: true`)** is enabled.               |

---

## Storage Locations

The storage location depends on the **S3 configuration**.

### Local Storage (`USE_S3=false`)

| File Type           | Storage Path   |
| ------------------- | -------------- |
| YouTube audio files | `./downloads/` |
| TTS-generated audio | `./public/`    |

> `downloads/` directory is not publicly accessible.

### AWS S3 Storage (`USE_S3=true`)

| File Type           | Storage Path (S3 Bucket)         |
| ------------------- | -------------------------------- |
| YouTube audio files | `s3://your-bucket-name/downloads/`  |
| TTS-generated audio | `s3://your-bucket-name/audios/`     |

> When `USE_S3=true`, **all files are stored in AWS S3** instead of the local file system.

---

## Local Storage

By default, all files are stored **locally** in the `downloads` directory.

### Example Local Paths

| File Type          | Local Path                     |
| ------------------ | ------------------------------ |
| YouTube Audio File | `/downloads/audio-example.mp3` |
| TTS Audio File     | `/public/audio-summary.mp3`    |

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

Instead of returning a local file path, responses with `audioFilePath` will include a **signed S3 URL**:

```json
{
  "audioFilePath": "https://bucket-name.s3.region.amazonaws.com/audios/audio-summary.mp3"
}
```

---

## File Cleanup

To prevent excessive storage usage, the API **automatically deletes old files**.

### Automatic Cleanup

- **Local files** older than `MAX_FILE_AGE` (default: **24 hours**) are deleted.
- **AWS S3 files** remain stored **unless manually deleted**.

### Cron Job for Cleanup

The API runs a scheduled cleanup task every midnight to remove old files

> If `USE_S3=true`, you will need to manually delete old files from S3 or set up an **S3 Lifecycle Policy**.

---

## Next Steps

- [Error Handling & Debugging](./error-handling-debugging.md) – Learn about API errors and troubleshooting.
- [Summarization Options & Customization](./summarization-options-customization.md) – Configure summarization settings.

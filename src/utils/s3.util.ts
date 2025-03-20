import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface S3UploadOptions {
  folder: string;
  contentType: string;
}

export async function uploadFileToS3(
  filePath: string,
  fileName: string,
  options: S3UploadOptions
): Promise<string> {
  try {
    checkS3Config();

    const fileContent = readFileSync(filePath);
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${options.folder}/${fileName}`,
      Body: fileContent,
      ContentType: options.contentType,
      ACL: ObjectCannedACL.public_read,
    };

    console.log(
      `Uploading file to S3: ${fileName} to bucket ${process.env.AWS_S3_BUCKET}/${options.folder}`,
    );

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    console.log(`File uploaded successfully: ${fileName}`);

    return getS3Url(options.folder, fileName);
  } catch (error) {
    console.error('S3 Upload Error:', error.message);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

// Backward compatibility for audio uploads
export async function uploadAudioToS3(
  filePath: string,
  fileName: string,
): Promise<string> {
  return uploadFileToS3(filePath, fileName, {
    folder: 'audios',
    contentType: 'audio/mpeg',
  });
}

export function checkS3Config() {
  if (
    !process.env.AWS_S3_BUCKET ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      'Missing required S3 configuration. Please check your environment variables.',
    );
  }
}

export function getS3Url(folder: string, fileName: string): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${folder}/${fileName}`;
}

// Helper function for audio URLs (backward compatibility)
export function getS3AudioDir(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/audios/`;
}

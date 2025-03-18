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

export async function uploadAudioToS3(
  filePath: string,
  fileName: string,
): Promise<string> {
  try {
    checkS3Config();

    const fileContent = readFileSync(filePath);
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `audios/${fileName}`,
      Body: fileContent,
      ContentType: 'audio/mpeg',
      ACL: ObjectCannedACL.public_read,
    };

    console.log(
      `Uploading file to S3: ${fileName} to bucket ${process.env.AWS_S3_BUCKET}`,
    );

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    console.log(`File uploaded successfully: ${fileName}`);

    return getS3AudioDir() + fileName;
  } catch (error) {
    console.error('S3 Upload Error:', error.message);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

export function checkS3Config() {
  if (
    !process.env.AWS_S3_BUCKET ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      'Missing required S3 configuration (AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY)',
    );
  }
}

export function getS3AudioDir() {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/audios/`;
}

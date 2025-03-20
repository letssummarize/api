import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { readFileSync, promises as fsPromises, createReadStream, existsSync } from 'fs';
import { DOWNLOAD_DIR } from './constants';
import { join } from 'path';
import { cleanUpFile, generateAudioFilename } from './files.util';

/**
 * S3 client instance configured with AWS credentials from environment variables
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Options for uploading files to S3
 * @interface S3UploadOptions
 * @property {string} folder - The target folder path in S3 bucket
 * @property {string} contentType - MIME type of the file being uploaded
 */
interface S3UploadOptions {
  folder: string;
  contentType: string;
}

/**
 * Uploads a file to AWS S3 with public read access
 * @param {string} filePath - Local path to the file to be uploaded
 * @param {string} fileName - Name to be used for the file in S3
 * @param {S3UploadOptions} options - Upload configuration options
 * @returns {Promise<string>} The public URL of the uploaded file
 * @throws {Error} When S3 configuration is missing or upload fails
 */
export async function uploadFileToS3(
  filePath: string,
  fileName: string,
  options: S3UploadOptions,
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

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return getS3Url(options.folder, fileName);
  } catch (error) {
    console.error('S3 Upload Error:', error.message);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Uploads a TTS-generated audio file to the 'audios' folder in S3
 * @param {string} filePath - Local path to the audio file
 * @param {string} fileName - Name to be used for the audio file in S3
 * @returns {Promise<string>} The public URL of the uploaded audio file
 * @throws {Error} When S3 configuration is missing or upload fails
 */
export async function uploadTTSAudioToS3(
  filePath: string,
  fileName: string,
): Promise<string> {
  return uploadFileToS3(filePath, fileName, {
    folder: 'audios',
    contentType: 'audio/mpeg',
  });
}

/**
 * Uploads a downloaded audio file to the 'downloads' folder in S3
 * @param {string} filePath - Local path to the audio file
 * @param {string} fileName - Name to be used for the audio file in S3
 * @returns {Promise<string>} The public URL of the uploaded audio file
 * @throws {Error} When S3 configuration is missing or upload fails
 */
export async function uploadDownloadedAudioToS3(
  filePath: string,
  fileName: string,
): Promise<string> {
  return uploadFileToS3(filePath, fileName, {
    folder: 'downloads',
    contentType: 'audio/mpeg',
  });
}

/**
 * Validates required S3 configuration environment variables
 * @throws {Error} When any required S3 configuration variable is missing
 */
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

/**
 * Generates the public URL for a file in S3
 *
 * @param folder - The folder path in S3 bucket (e.g., 'audios' or 'downloads')
 * @param fileName - Name of the file
 * @returns Complete S3 public URL for the file in format: https://{bucket}.s3.{region}.amazonaws.com/{folder}/{fileName}
 */
export function getS3Url(folder: string, fileName: string): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${folder}/${fileName}`;
}

/**
 * Gets the base S3 URL for the audio files directory
 *
 * @returns Base S3 URL for the audios folder in format: https://{bucket}.s3.{region}.amazonaws.com/audios
 * @remarks This is specifically for TTS-generated audio files, not downloaded YouTube audio files
 */
export function getS3AudioDir(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/audios/`;
}

/**
 * Downloads a file from S3 and creates a readable stream for processing.
 *
 * - Fetches the file from the given `filePath` (S3 URL).
 * - Saves it temporarily in `DOWNLOAD_DIR` with a unique timestamped filename.
 * - Returns a **readable stream** for further processing (e.g., transcription).
 * - Ensures proper error handling and cleanup of temporary files.
 *
 * @param fileUrl - The URL of the file stored in S3.
 * @returns An object containing the file stream and cleanup function
 * @throws {Error} If the file cannot be downloaded, saved, or accessed.
 */
export async function downloadFileFromS3(fileUrl: string): Promise<{ 
  stream: ReturnType<typeof createReadStream>;
  cleanup: () => Promise<void>;
}> {
  if (!fileUrl) {
    throw new Error('Invalid file URL: URL cannot be empty');
  }

  const tempFilePath = join(DOWNLOAD_DIR, generateAudioFilename() + '.mp3');

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fsPromises.writeFile(tempFilePath, buffer);
    console.log(`Downloaded ${tempFilePath} file from S3 for transcription`);
    
    return {
      stream: createReadStream(tempFilePath),
      cleanup: async () => {
        try {
          await fsPromises.unlink(tempFilePath);
          console.log(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (error) {
          console.error(`Failed to clean up temporary file ${tempFilePath}:`, error);
        }
      }
    };
  } catch (error) {
    if (existsSync(tempFilePath)) {
      await cleanUpFile(tempFilePath);
    }
    console.error(`Error downloading ${tempFilePath} file from S3: ${error.message}`);
    throw new Error(`Could not download file from S3: ${error.message}`);
  }
}

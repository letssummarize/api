import OpenAI from 'openai';
import { promises as fsPromises } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { DOWNLOAD_DIR, PUBLIC_DIR, AUDIO_FORMAT } from './constants';
import { cleanUpFile, generateAudioFilename } from './files.util';
import { uploadTTSAudioToS3 } from './s3.util';
import { USE_S3 } from './constants';
import { BadRequestException } from '@nestjs/common';

/**
 * Converts text to speech using OpenAI's TTS-1 model and stores the audio file.
 *
 * @param text - The text content to convert to speech
 * @param apiKey - OpenAI API key for authentication (must be an OpenAI key, DeepSeek keys are not supported)
 * @returns A promise that resolves to the URL where the audio file can be accessed:
 *          - S3 URL if USE_S3 is true and upload succeeds
 *          - Local public URL as fallback if S3 upload fails or USE_S3 is false
 * @throws {BadRequestException} If audio generation fails or if a non-OpenAI API key is used
 *
 * @remarks
 * The function implements a hybrid storage approach:
 * 1. Generates audio using OpenAI's TTS-1 model with 'alloy' voice
 * 2. Stores audio locally in DOWNLOAD_DIR with MP3 format
 * 3. If USE_S3 is true, attempts to upload to S3 'audios' folder
 * 4. Falls back to local storage if S3 upload fails
 */
export async function convertTextToSpeech(
  text: string,
  apiKey: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  try {
    console.log('TTS processing ...');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const fileName = generateAudioFilename();
    const audioFileName = `${fileName}.${AUDIO_FORMAT}`;
    const audioFilePath = `${DOWNLOAD_DIR}/${audioFileName}`;
    await fsPromises.writeFile(audioFilePath, buffer);

    if (USE_S3) {
      try {
        // Upload to S3
        const s3Url = await uploadTTSAudioToS3(audioFilePath, audioFileName);
        console.log(`Audio file uploaded to S3: ${s3Url}`);

        // Clean up local file after successful S3 upload
        try {
          await fsPromises.unlink(audioFilePath);
          console.log('Cleaned up local audio file after S3 upload');
        } catch (cleanupError) {
          console.error('Failed to clean up local audio file:', cleanupError);
        }

        return s3Url;
      } catch (s3Error) {
        console.error('S3 upload failed, falling back to local file:', s3Error);
        return `${PUBLIC_DIR}/${audioFileName}`;
      }
    }

    return `${PUBLIC_DIR}/${audioFileName}`;
  } catch (error) {
    // Clean up any partially created files
    const audioPath = join(DOWNLOAD_DIR, `${generateAudioFilename()}.${AUDIO_FORMAT}`);
    if (existsSync(audioPath)) {
      await cleanUpFile(audioPath);
    }

    console.error('Error generating the audio:', error);
    throw new BadRequestException('Failed to generate audio');
  }
}

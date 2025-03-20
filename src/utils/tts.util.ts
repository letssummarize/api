import OpenAI from 'openai';
import { AUDIO_FORMAT, DOWNLOAD_DIR, PUBLIC_DIR, USE_S3 } from './constants';
import { generateAudioFilename } from './files.util';
import { promises as fsPromises } from 'fs';
import { uploadTTSAudioToS3 } from './s3.util';
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
        const s3Url = await uploadTTSAudioToS3(audioFilePath, audioFileName);
        return s3Url;
      } catch (s3Error) {
        console.error('S3 upload failed, falling back to local file:', s3Error);
        return `${PUBLIC_DIR}/${audioFileName}`;
      }
    } else {
      return `${PUBLIC_DIR}/${audioFileName}`;
    }
  } catch (error) {
    console.error('Error generating the audio: ', error.message);
    throw new BadRequestException('Failed to generate audio');
  }
}

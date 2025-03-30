import OpenAI from 'openai';
import { existsSync } from 'fs';
import { FASTAPI_URL, MAX_FILE_AGE } from './constants';
import { getApiKey } from './api-key.util';
import { DEFAULT_OPENAI_API_KEY } from './constants';
import { downloadFileFromS3 } from './s3.util';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Transcribes an audio file using OpenAI's Whisper model.
 * @param audioPath - Path to the downloaded audio file.
 * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service).
 * @returns The transcribed text from the audio file.
 */
export async function transcribeUsingOpenAIWhisper(
  audioPath: string,
  userApiKey?: string,
): Promise<string> {
  const apiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
  const openaiClient = new OpenAI({ apiKey });
  const startTime = new Date();
  let cleanup: (() => Promise<void>) | undefined;

  try {
    console.log(`Transcribing audio... Started at ${startTime.toISOString()}`);

    let fileStream;
    if (audioPath.startsWith('http')) {
      // If it's an S3 URL, download the file first
      const { stream, cleanup: cleanupFn } =
        await downloadFileFromS3(audioPath);
      fileStream = stream;
      cleanup = cleanupFn;
      console.log('Downloaded file from S3 for transcription');
    } else {
      fileStream = createReadStream(audioPath);
    }

    const response = await openaiClient.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(
      `Transcription completed at ${endTime.toISOString()}. Time taken: ${duration} seconds`,
    );

    if (cleanup) {
      await cleanup();
    }

    return response.text;
  } catch (error) {
    const failTime = new Date();
    const duration = (failTime.getTime() - startTime.getTime()) / 1000;
    console.error(
      `Transcription failed at ${failTime.toISOString()}. Time taken: ${duration} seconds. Error: ${error.message}`,
    );

    if (cleanup) {
      await cleanup();
    }

    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

export const transcribeUsingFastWhisper = async (
  audioFilePath: string,
  httpService: HttpService,
) => {
  console.log(`Transcribing file using FastWhisper at ${audioFilePath}`);
  try {
    const formData = new FormData();
    formData.append('file', createReadStream(audioFilePath), 'audio.mp3');

    console.log('Sending request to FastWhisper API');
    const response = await firstValueFrom(
      httpService.post(FASTAPI_URL, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      }),
    );

    console.log('Received response from FastWhisper API');
    return response.data.text;
  } catch (error) {
    console.error(
      'Error transcribing audio:',
      error.response?.data || error.message,
    );
    throw new Error('Transcription failed');
  }
};

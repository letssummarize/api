import OpenAI from 'openai';
import { getApiKey } from './api-key.util';
import { createReadStream } from 'fs';
import { DEFAULT_OPENAI_API_KEY } from './constants';

/**
 * Transcribes an audio file using OpenAI's Whisper model.
 * @param audioPath - Path to the downloaded audio file.
 * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service).
 * @returns The transcribed text from the audio file.
 */
export async function transcribeAudio(
  audioPath: string,
  userApiKey?: string,
): Promise<string> {
  const apiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
  const openaiClient = new OpenAI({ apiKey });
  const startTime = new Date();

  try {
    const fileStream = createReadStream(audioPath);

    const response = await openaiClient.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    return response.text;
  } catch (error) {
    const failTime = new Date();
    const duration = (failTime.getTime() - startTime.getTime()) / 1000;
    console.error(
      `Transcription failed at ${failTime.toISOString()}. Time taken: ${duration} seconds. Error: ${error.message}`,
    );
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

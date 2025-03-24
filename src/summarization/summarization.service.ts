import { BadRequestException, Injectable } from '@nestjs/common';
import { Downloader } from 'ytdl-mp3';
import { SummarizeVideoDto } from './dto/summarize-video.dto';
import { existsSync, promises as fsPromises } from 'fs';
import {
  cleanupOldFiles,
  ensureDownloadDirectory,
  extractTextFromFile,
  generateAudioFilename,
} from '../utils/files.util';
import { SummarizationOptionsDto } from './dto/summarization-options.dto';
import {
  getSummarizationOptions,
  preparePrompt,
  summarizeWithDeepSeek,
  summarizeWithGemini,
  summarizeWithOpenAi,
} from '../utils/summarization.util';
import {
  AUDIO_FORMAT,
  DEFAULT_DEEPSEEK_API_KEY,
  DEFAULT_OPENAI_API_KEY,
  DEFAULT_GEMENI_API_KEY,
  DOWNLOAD_DIR,
  MAX_FILE_AGE,
  USE_S3,
} from '../utils/constants';
import {
  STTModel,
  SummarizationModel,
  SummarizationSpeed,
} from './enums/summarization-options.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YoutubeTranscriptNotAvailableError } from 'youtube-transcript';
import {
  extractVideoId,
  extractYouTubeVideoMetadata,
  fetchYouTubeTranscript,
  isValidYouTubeUrl,
} from '../utils/video.util';
import { SummarizationOptions } from './interfaces/summarization-options.interface';
import { getApiKey } from '../utils/api-key.util';
import { convertTextToSpeech } from '../utils/tts.util';
import { transcribeUsingOpenAIWhisper, transcribeUsingFastWhisper } from '../utils/transcription.util';
import { join } from 'path';
import { uploadDownloadedAudioToS3 } from '../utils/s3.util';
import { HttpService } from '@nestjs/axios';
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class SummarizationService {
  private downloader: Downloader;

  constructor(private readonly httpService: HttpService) {
    if (!USE_S3) {
      ensureDownloadDirectory();
    }
    this.downloader = new Downloader({
      getTags: false,
      outputDir: DOWNLOAD_DIR,
    });
  }

  /**
   * Summarizes a YouTube video using either direct transcript fetching or audio-based transcription.
   * @param content - Contains the videoUrl to be summarized
   * @param optionsDto - User-specified summarization options (length, format, etc.)
   * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service)
   * @returns An object containing the transcript and summary of the video
   * @throws BadRequestException if the YouTube URL is invalid or if summarization fails
   */
  async summarizeYouTubeVideo(
    content: SummarizeVideoDto,
    optionsDto?: SummarizationOptionsDto,
    userApiKey?: string,
  ) {
    const { videoUrl } = content;
    console.log(`summarizing video ${videoUrl} ... `);
    if (!isValidYouTubeUrl(videoUrl)) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    const options = getSummarizationOptions(optionsDto);

    if (
      userApiKey &&
      options?.model !== SummarizationModel.OPENAI &&
      options?.speed === SummarizationSpeed.SLOW
    ) {
      throw new BadRequestException(
        'Slow mode is only supported with OpenAI. Please select OpenAI as the summarization model.',
      );
    }

    try {
      if (options?.speed === SummarizationSpeed.FAST) {
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
          return this.summarizeYouTubeVideoUsingAudio(
            videoUrl,
            options,
            userApiKey,
          );
        }

        try {
          // Attempt to fetch the YouTube transcript
          const transcript = await fetchYouTubeTranscript(videoId);

          // Summarize the transcript if available
          const { text, summary, audioFilePath } = await this.summarizeText(
            transcript,
            options,
            userApiKey,
          );
          const vidMetadata = await extractYouTubeVideoMetadata(videoUrl);

          return {
            summary,
            transcript: text,
            videoMetadata: { ...vidMetadata },
            ...(audioFilePath ? { audioFilePath } : {}),
          };
        } catch (error) {
          if (error.message.includes('401')) {
            throw new BadRequestException(
              'The api key you provided is invalid',
            );
          }
          if (error instanceof YoutubeTranscriptNotAvailableError) {
            throw new BadRequestException(
              'This video does not have a YouTube transcript. Please use SLOW mode instead.',
            );
          } else {
            console.error('error ', error);
            throw new BadRequestException(
              'This video does not have a YouTube transcript. Please use SLOW mode instead. Or check your network connection',
            );
          }
        }
      }

      // Default to slow mode
      return this.summarizeYouTubeVideoUsingAudio(
        videoUrl,
        options,
        userApiKey,
      );
    } catch (error) {
      console.error('Error:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Generates a summary for the given text using GPT-4o.
   * @param text - The text to summarize.
   * @param options - Summarization preferences (length, format, etc.).
   * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service).
   * @returns The summarized version of the input text.
   */
  async summarizeText(
    text: string,
    options?: SummarizationOptions,
    userApiKey?: string,
  ) {
    console.log(`summarizing Text ${text} ... `);
    if (
      userApiKey &&
      options?.listen &&
      options.model !== SummarizationModel.OPENAI
    ) {
      throw new BadRequestException(
        'Text-to-speech is only supported with OpenAI. Please select OpenAI as the summarization model.',
      );
    }

    const prompt = preparePrompt(options as SummarizationOptions, text);

    let apiKey: string;
    let summary: string;
    if (options?.model === SummarizationModel.DEEPSEEK) {
      apiKey = getApiKey(userApiKey, DEFAULT_DEEPSEEK_API_KEY);
      summary = await summarizeWithDeepSeek(apiKey, prompt);
    } else if (options?.model === SummarizationModel.GEMENI) {
      apiKey = getApiKey(userApiKey, DEFAULT_GEMENI_API_KEY);
      summary = await summarizeWithGemini(apiKey, prompt);
    } else {
      apiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
      summary = await summarizeWithOpenAi(apiKey, prompt);
    }

    if (options?.listen) {
      const openaiApiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);

      const audioFilePath = await convertTextToSpeech(summary, openaiApiKey);
      return {
        summary,
        text,
        ...(audioFilePath ? { audioFilePath } : {}),
      };
    }

    return { summary, text };
  }

  /**
   * Summarizes an uploaded file.
   * @param file - The uploaded file (PDF, DOCX, or TXT).
   * @param optionsDto - User-specified summarization options.
   * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service).
   * @returns The summarized text of the file's content.
   */
  async summarizeFile(
    file: Express.Multer.File,
    optionsDto?: SummarizationOptionsDto,
    userApiKey?: string,
  ) {
    console.log(`summarizing file ${file.path} ... `);
    const options = getSummarizationOptions(optionsDto);

    // Extract text based on file type
    const text = await extractTextFromFile(file);

    if (!text.trim()) {
      throw new BadRequestException('Could not extract text from the file.');
    }

    // Summarize the extracted text
    return this.summarizeText(text, options, userApiKey);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleFileCleanup() {
    cleanupOldFiles(DOWNLOAD_DIR, MAX_FILE_AGE);
  }

  private async summarizeYouTubeVideoUsingAudio(
    videoUrl: string,
    options?: SummarizationOptions,
    userApiKey?: string,
  ) {
    console.log(`summarizing YOutube Video Using audio ${videoUrl} ... `);
    try {
      const audioPath = await this.downloadAudio(videoUrl);
      let transcript: string;
      if (options?.sttModel === STTModel.FAST_WHISPER) {
        transcript = await transcribeUsingFastWhisper(audioPath, this.httpService);
      } else {
        transcript = await transcribeUsingOpenAIWhisper(audioPath, userApiKey);
      }
      
      const {summary, audioFilePath} = await this.summarizeText(transcript, options, userApiKey);
      const vidMetadata = await extractYouTubeVideoMetadata(videoUrl);

      return {
        summary,
        transcript,
        videoMetadata: { ...vidMetadata },
        ...(audioFilePath ? { audioFilePath } : {}),
      };
    } catch (error) {
      throw new Error(
        `Failed to summarize video using audio: ${error.message}`,
      );
    }
  }

  /**
   * Downloads audio from a YouTube video using yt-dlp-exec.
   * @param videoUrl - The URL of the YouTube video.
   * @returns The file path of the downloaded audio.
   * @throws Error if the audio download fails.
   */
  private async downloadAudio(videoUrl: string): Promise<string> {
    console.log(`Download Audio ${videoUrl} ... `);
    const fileName = generateAudioFilename();
    const audioFileName = `${fileName}.${AUDIO_FORMAT}`;
    let audioPath = join(DOWNLOAD_DIR, audioFileName);

    const startTime = new Date();
    try {
      // Download the audio using ytdl-mp3
      const result = await this.downloader.downloadSong(videoUrl);

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      // Rename the file because ytdl-mp3 uses the video tile as the file name by default
      await fsPromises.rename(result.outputFile, audioPath);

      if (!existsSync(audioPath)) {
        throw new Error('Audio file was not created.');
      }

      // Upload to S3 if enabled
      if (USE_S3) {
        try {
          const s3Url = await uploadDownloadedAudioToS3(
            audioPath,
            audioFileName,
          );
          return s3Url;
        } catch (s3Error) {
          console.error(
            'S3 upload failed, falling back to local file:',
            s3Error,
          );
          return audioPath;
        }
      }

      return audioPath;
    } catch (error) {
      const failTime = new Date();
      const duration = (failTime.getTime() - startTime.getTime()) / 1000;
      console.error(
        `Download failed at ${failTime.toISOString()}. Time taken: ${duration} seconds. Error: ${error.message}`,
      );
      throw new Error('Failed to download audio');
    }
  }
}

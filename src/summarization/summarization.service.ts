import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import OpenAI, { AuthenticationError } from 'openai';
import { existsSync, mkdirSync, createReadStream, readFileSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { extname, join } from 'path';
import { create } from 'youtube-dl-exec';
import { SummarizeVideoDto } from './dto/summarize-video.dto';
import {
  extractTextFromPdf,
  extractTextFromDocx,
  cleanupOldFiles,
} from 'src/utils/files.util';
import { SummarizationOptions } from './interfaces/summarization-options.interface';
import { SummarizationOptionsDto } from './dto/summarization-options.dto';
import {
  extractVideoId,
  extractYouTubeVideoMetadata,
  getApiKey,
  getSummarizationOptions,
  isValidYouTubeUrl,
  validateSummarizationOptions,
} from 'src/utils/summarization.util';
import {
  DEFAULT_OPENAI_API_KEY,
  DEFAULT_DEEPSEEK_API_KEY,
  PATH_TO_YT_DLP,
  DOWNLOAD_DIR,
  PUBLIC_DIR,
  AUDIO_FORMAT,
  MAX_FILE_AGE,
} from 'src/utils/constants';
import { generateAudioFilename } from 'src/utils/files.util';
import {
  SummarizationLanguage,
  SummarizationModel,
  SummarizationSpeed,
  SummaryFormat,
} from './enums/summarization-options.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YoutubeTranscript, YoutubeTranscriptNotAvailableError } from 'youtube-transcript';
import { uploadAudioToS3 } from 'src/utils/s3.util';

@Injectable()
export class SummarizationService {
  private readonly ytdlp = create(PATH_TO_YT_DLP); // Using custom binary

  private readonly MAX_TOKENS = 15000;

  constructor() {
    if (!existsSync(DOWNLOAD_DIR)) {
      mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
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

    if (!isValidYouTubeUrl(videoUrl)) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    const options = getSummarizationOptions(optionsDto);

    if (userApiKey && options?.model !== SummarizationModel.OPENAI && options?.speed === SummarizationSpeed.SLOW) {
      throw new BadRequestException("Slow mode is only supported with OpenAI. Please select OpenAI as the summarization model.")
    }

    try {
      console.log('Fetching transcript for video:', videoUrl);
      console.log('options ', options);
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
          const transcript = await this.fetchYouTubeTranscript(videoId);

          // Summarize the transcript if available
          const { text, summary, audioFilePath } = await this.summarizeText(
            transcript,
            options,
            userApiKey,
          );
          const vidMetadata = await extractYouTubeVideoMetadata(videoUrl);
          console.log('vidMetadata:', vidMetadata);

          return {
            summary,
            transcript: text,
            videoMetadata: { ...vidMetadata },
            ...(audioFilePath ? { audioFilePath } : {}),
          };
        } catch (error) {
          if (error.message.includes('401')) {
            throw new BadRequestException("The api key you provided is invalid")
          }
          if(error instanceof YoutubeTranscriptNotAvailableError) {
            throw new BadRequestException(
              'This video does not have a YouTube transcript. Please use SLOW mode instead.',
            );
          } else {
            throw new BadRequestException("There is a problem with network connection")
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

  private async fetchYouTubeTranscript(videoId: string): Promise<string> {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      const fullTranscript = transcriptItems
        .map((item) => item.text.trim())
        .filter((text) => text.length > 0)
        .join(' ');

      const words = fullTranscript.split(' ');
      const safeLength = Math.floor(this.MAX_TOKENS / 4);
      return words.slice(0, safeLength).join(' ');
    } catch (error) {
      throw new Error(
        `Could not fetch transcript from YouTube: ${error.message}`,
      );
    }
  }

  private async summarizeYouTubeVideoUsingAudio(
    videoUrl: string,
    options?: SummarizationOptions,
    userApiKey?: string,
  ) {
    try {
      console.log(
        'Direct transcript fetch failed, falling back to audio download:',
      );
      const audioPath = await this.downloadAudio(videoUrl);
      const transcript = await this.transcribeAudio(audioPath, userApiKey);
      const summary = await this.summarizeText(transcript, options, userApiKey);
      console.log('Summary:', summary);
      const vidMetadata = await extractYouTubeVideoMetadata(videoUrl);
      console.log('vidMetadata:', vidMetadata);

      return {
        summary,
        transcript,
        videoMetadata: { ...vidMetadata },
        ...(audioPath ? { audioFilePath: audioPath } : {}),
      };
    } catch (error) {
      throw new Error(
        `Failed to summarize video using audio: ${error.message}`,
      );
    }
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
    console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
    const options = getSummarizationOptions(optionsDto);

    // Extract text based on file type
    const text = await this.extractTextFromFile(file);

    if (!text.trim()) {
      throw new BadRequestException('Could not extract text from the file.');
    }

    // Summarize the extracted text
    return this.summarizeText(text, options, userApiKey);
  }

  /**
   * Downloads audio from a YouTube video using yt-dlp-exec.
   * @param videoUrl - The URL of the YouTube video.
   * @returns The file path of the downloaded audio.
   * @throws Error if the audio download fails.
   */
  async downloadAudio(videoUrl: string): Promise<string> {
    const fileName = generateAudioFilename();
    const audioPath = join(DOWNLOAD_DIR, `${fileName}.${AUDIO_FORMAT}`);

    const startTime = new Date();
    try {
      console.log(`Downloading audio... Started at ${startTime.toISOString()}`);
      await this.ytdlp(videoUrl, {
        extractAudio: true,
        audioFormat: AUDIO_FORMAT,
        output: audioPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(
        `Downloaded audio: ${audioPath}. Finished at ${endTime.toISOString()}. Time taken: ${duration} seconds`,
      );

      if (!existsSync(audioPath)) {
        throw new Error('Audio file was not created.');
      }

      return audioPath;
    } catch (error) {
      const failTime = new Date();
      const duration = (failTime.getTime() - startTime.getTime()) / 1000;
      console.error(
        `Error downloading audio: ${error}. Finished at ${failTime.toISOString()}. Time taken: ${duration} seconds`,
      );
      throw new Error('Failed to download audio');
    }
  }

  /**
   * Transcribes an audio file using OpenAI's Whisper model.
   * @param audioPath - Path to the downloaded audio file.
   * @param userApiKey - Optional user-provided OpenAI API key (used when users integrate their own applications with our service).
   * @returns The transcribed text from the audio file.
   */
  private async transcribeAudio(
    audioPath: string,
    userApiKey?: string,
  ): Promise<string> {
    const apiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
    const openaiClient = new OpenAI({ apiKey });
    const startTime = new Date();

    try {
      console.log(
        `Transcribing audio... Started at ${startTime.toISOString()}`,
      );
      const fileStream = createReadStream(audioPath);

      const response = await openaiClient.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      });

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(
        `Transcription finished at ${endTime.toISOString()}. Time taken: ${duration} seconds`,
      );

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

    const { length, format, lang } = getSummarizationOptions(options);
    console.log('DEFAULT_OPENAI_API_KEY', DEFAULT_OPENAI_API_KEY);
    console.log('DEFAULT_DEEPSEEK_API_KEY', DEFAULT_DEEPSEEK_API_KEY);

    if (userApiKey && options?.listen && options.model !== SummarizationModel.OPENAI) {
      throw new BadRequestException("Text-to-speech is only supported with OpenAI. Please select OpenAI as the summarization model.")
    }

    let prompt: string;
    if (options?.format === SummaryFormat.DEFAULT && options?.lang === SummarizationLanguage.DEFAULT) {
      prompt = `Summarize the following text in a ${length} length:\n\n${text}`;
    } else if (options?.format === SummaryFormat.DEFAULT) {
      prompt = `Summarize the following text in a ${length} lenght, in ${lang}:\n\n${text}`;
    } else {
      prompt = `Summarize the following text in a ${length} lenght, in ${format} style in ${lang}:\n\n${text}`;
    }

    let apiKey: string;
    let summary: string;
    if (options?.model === SummarizationModel.DEEPSEEK) {
      apiKey = getApiKey(userApiKey, DEFAULT_DEEPSEEK_API_KEY);
      summary = await this.summarizeWithDeepSeek(apiKey, prompt);
    } else {
      apiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
      summary = await this.summarizeWithOpenAi(apiKey, prompt);
    }

    if (options?.listen) {
      const openaiApiKey = getApiKey(userApiKey, DEFAULT_OPENAI_API_KEY);
      console.log("openaiApiKey is: ", openaiApiKey)

      const audioFilePath = await this.convertTextToSpeech(
        summary,
        openaiApiKey,
      );
      return {
        summary,
        text,
        ...(audioFilePath ? { audioFilePath } : {}),
      };
    }

    return { summary, text };
  }

  async summarizeWithOpenAi(apiKey: string, prompt: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    const startTime = new Date();
    try {
      console.log('Summarizing text with gpt-4o...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a summarization expert who extracts key details from long texts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
      });

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(
        `Summarization finished at ${endTime.toISOString()}. Time taken: ${duration} seconds`,
      );

      return (
        response.choices[0]?.message?.content || 'Could not generate a summary.'
      );
    } catch (error) {
      const failTime = new Date();
      const duration = (failTime.getTime() - startTime.getTime()) / 1000;
      console.error(
        `Summarization failed at ${failTime.toISOString()}. Time taken: ${duration} seconds. Error: ${error.message}`,
      );
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  }

  async summarizeWithDeepSeek(apiKey: string, prompt: string): Promise<string> {
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });
    try {
      console.log('Summarizing text with deepseek...');
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a summarization expert who extracts key details from long texts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
      });
      return (
        response.choices[0]?.message?.content || 'Could not generate a summary.'
      );
    } catch (error) {
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  }

  async convertTextToSpeech(text: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey });

    try {
      console.log(
        'Generating audio for the summary using OpenAI TTS-1 model...',
      );

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

      if (process.env.USE_S3 === 'true') {
        try {
          const s3Url = await uploadAudioToS3(audioFilePath, audioFileName);
          console.log(`Audio file uploaded to S3: ${s3Url}`);
          return s3Url;
        } catch (s3Error) {
          console.error('S3 upload failed, falling back to local file:', s3Error);
          return `${PUBLIC_DIR}/${audioFileName}`;
        }
      } else {
        return `${PUBLIC_DIR}/${audioFileName}`;
      }
    } catch (error) {
      console.log('Error generating the audio: ', error.message);
      throw new BadRequestException('Failed to generate audio');
    }
  }

  /**
   * Extracts text from different file formats.
   * @param file - The uploaded file (PDF, DOCX, or TXT).
   * @returns The extracted text from the file.
   * @throws UnsupportedMediaTypeException if the file format is not supported.
   */
  private async extractTextFromFile(
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.txt':
        return file.buffer.toString('utf-8'); // Read plain text file

      case '.pdf':
        return extractTextFromPdf(file);

      case '.docx':
        return extractTextFromDocx(file);

      default:
        throw new UnsupportedMediaTypeException(
          'Unsupported file format. Only PDF, TXT, and DOCX are allowed.',
        );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleFileCleanup() {
    console.log('Starting the cleanup');
    cleanupOldFiles(DOWNLOAD_DIR, MAX_FILE_AGE);
    console.log('Finished cleaning up old files.');
  }
}

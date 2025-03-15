import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import Ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { createWriteStream, unlinkSync, existsSync, mkdirSync, createReadStream } from 'fs';
import { join } from 'path';
import { create } from 'youtube-dl-exec';
import { config } from 'dotenv';
import { SummarizeVideoDto } from './dto/summarize-video.dto';
config();

@Injectable()
export class SummarizationService {
  // private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly ytdlp = create('E:/yt-dlp/yt-dlp.exe'); // Using custom binary

  private readonly DOWNLOAD_DIR = join(__dirname, '..', '..', 'downloads');
  private readonly AUDIO_FORMAT = 'mp3';

  constructor() {
    if (!existsSync(this.DOWNLOAD_DIR)) {
      mkdirSync(this.DOWNLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Summarizes a YouTube video by downloading its audio, transcribing it, and summarizing the transcript.
   */
  async summarizeYouTubeVideo(dto: SummarizeVideoDto) {
    const { videoUrl, userApiKey } = dto;

    try {
      console.log('Summarizing video:', videoUrl);

      const audioPath = await this.downloadAudio(videoUrl);
      console.log('Downloaded Audio Path:', audioPath);

      const transcript = await this.transcribeAudio(audioPath, userApiKey);
      console.log('Transcript:', transcript);

      const summary = await this.summarizeText(transcript, userApiKey);
      console.log('Summary:', summary);

      unlinkSync(audioPath);

      return { transcript, summary };
    } catch (error) {
      console.error('Error:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Downloads audio from a YouTube video using yt-dlp-exec.
   */
  async downloadAudio(videoUrl: string): Promise<string> {
    const audioPath = join(this.DOWNLOAD_DIR, `audio.${this.AUDIO_FORMAT}`);
    const webmPath = join(this.DOWNLOAD_DIR, `audio.webm`);

    try {
      console.log('Downloading audio...');
      await this.ytdlp(videoUrl, {
        extractAudio: true,
        audioFormat: this.AUDIO_FORMAT,
        output: audioPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      console.log('Audio downloaded:', audioPath);

      if (!existsSync(audioPath)) {
        throw new Error('Audio file was not created.');
      }

      if (existsSync(webmPath)) {
        unlinkSync(webmPath);
        console.log('Deleted temporary .webm file.');
      }

      return audioPath;
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw new Error('Failed to download audio');
    }
  }

  /**
   * Transcribes the audio file to text using OpenAI's Whisper model.
   */
  private async transcribeAudio(audioPath: string, userApiKey?: string): Promise<string> {
    const openaiClient = new OpenAI({ apiKey: userApiKey || process.env.OPENAI_API_KEY });

    try {
      console.log('Transcribing audio...');
      const fileStream = createReadStream(audioPath);

      const response = await openaiClient.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      });

      return response.text;
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Summarizes the given transcript using OpenAI's GPT model.
   */
  async summarizeText(transcript: string, userApiKey?: string): Promise<string> {
    const openaiClient = new OpenAI({ apiKey: userApiKey || process.env.OPENAI_API_KEY });

    try {
      console.log('Summarizing transcript...');
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a summarization expert who extracts key details from long texts.' },
          { role: 'user', content: `Summarize the following text:\n\n${transcript}` },
        ],
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 'Could not generate a summary.';
    } catch (error) {
      throw new Error(`Failed to summarize text: ${error.message}`);
    }
  }
}

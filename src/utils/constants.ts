import { join } from 'path';
import { config } from 'dotenv';
config()

export const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const DEFAULT_DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export const OPENAI_MAX_TOKENS: number = Number(process.env.OPENAI_MAX_TOKENS) || 300;
export const DEEPSEEK_MAX_TOKENS: number = Number(process.env.DEEPSEEK_MAX_TOKENS) || 1000;

export const MAX_TRANSCRIPT_TOKENS: number = Number(process.env.MAX_TRANSCRIPT_TOKENS) || 1500;

export const USE_S3: boolean = process.env.USE_S3 === 'true';

export const DOWNLOAD_DIR = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'downloads');
export const PUBLIC_DIR = '/public/audio';
export const AUDIO_FORMAT = 'mp3';
export const MAX_FILE_AGE = 1000 * 60; // 1 day
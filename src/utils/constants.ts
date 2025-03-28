import path, { join } from 'path';
import { config } from 'dotenv';
config()

export const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const DEFAULT_DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
export const DEFAULT_GEMENI_API_KEY = process.env.GEMENI_API_KEY;

export const OPENAI_MAX_TOKENS: number = Number(process.env.OPENAI_MAX_TOKENS) || 300;
export const DEEPSEEK_MAX_TOKENS: number = Number(process.env.DEEPSEEK_MAX_TOKENS) || 1000;

export const MAX_TRANSCRIPT_TOKENS: number = Number(process.env.MAX_TRANSCRIPT_TOKENS) || 1500;

export const USE_S3: boolean = process.env.USE_S3 === 'true';

export const DOWNLOAD_DIR = join(process.cwd(), 'downloads');
export const PUBLIC_DIR = '/public/audio';
export const AUDIO_FORMAT = 'mp3';
export const MAX_FILE_AGE = 1000 * 60; // 1 day

export const COOKIES_PATH = path.resolve(process.cwd(), 'cookies.txt'); 

export const CORS_ORIGINS: string[] = process.env.CORS ? process.env.CORS.split(',') : ['http://localhost:3001', 'https://letssummarize.vercel.app'];
export const FASTAPI_URL = process.env.FASTAPI_URL || 'your-fastapi-url';

export const PO_TOKEN = process.env.PO_TOKEN;
import { join } from 'path';
import { config } from 'dotenv';
config()

export const DEFAULT_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const DEFAULT_DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export const PATH_TO_YT_DLP = process.env.PATH_TO_YT_DLP || 'add-your-path-here';

export const DOWNLOAD_DIR = join(process.cwd(), 'downloads');
export const PUBLIC_DIR = '/public/audio';
export const AUDIO_FORMAT = 'mp3';
export const MAX_FILE_AGE = 1000 * 60; // 1 day
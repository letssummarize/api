import { BadRequestException } from '@nestjs/common';
import { SummarizationOptionsDto } from '../summarization/dto/summarization-options.dto';
import {
  SummaryLength,
  SummaryFormat,
} from '../summarization/enums/summarization-options.enum';
import { SummarizationOptions } from '../summarization/interfaces/summarization-options.interface';
import { readdirSync, unlinkSync } from 'fs';
import { basename, join } from 'path';

export function isValidYouTubeUrl(url: string): boolean {
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
  return ytRegex.test(url);
}

export function getSummarizationOptions(
  options?: SummarizationOptionsDto,
): SummarizationOptions {
  return {
    length: options?.length ?? SummaryLength.STANDARD,
    format: options?.format ?? SummaryFormat.NARRATIVE,
    listen: options?.listen ?? false,
  };
}

export function getApiKey(userApiKey?: string, defaultApiKey?: string): string {
  if (userApiKey) return userApiKey;
  if (defaultApiKey) return defaultApiKey;
  throw new BadRequestException('API key is required');
}

export async function cleanupFiles(
  directory: string,
  prefix: string,
): Promise<void> {
  try {
    const files = await readdirSync(directory);
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const filePath = join(directory, file);
        await unlinkSync(filePath);
        console.log('Deleted file:', filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error.message);
  }
}

export function generateRandomSuffix(): string {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${dateString}_${randomString}`;
}

export function extractPrefixFromPath(filePath: string): string {
  const filename = basename(filePath);
  const prefix = filename.split('.').slice(0, -1).join('.');
  return prefix;
}

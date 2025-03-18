import { BadRequestException } from '@nestjs/common';
import { SummarizationOptionsDto } from '../summarization/dto/summarization-options.dto';
import {
  SummaryLength,
  SummaryFormat,
} from '../summarization/enums/summarization-options.enum';
import { SummarizationOptions } from '../summarization/interfaces/summarization-options.interface';

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
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/,
    /youtu\.be\/([\w-]{11})(?:\?|&|$)/,
    /\/shorts\/([\w-]{11})(?:\?|&|$)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
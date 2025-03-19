import { BadRequestException } from '@nestjs/common';
import { SummarizationOptionsDto } from '../summarization/dto/summarization-options.dto';
import {
  SummaryLength,
  SummaryFormat,
  SummarizationSpeed,
  SummarizationModel,
  SummarizationLanguage,
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
    format: options?.format ?? SummaryFormat.DEFAULT,
    listen: options?.listen ?? false,
    model: options?.model ?? SummarizationModel.DEFAULT,
    speed: options?.speed ?? SummarizationSpeed.DEFAULT,
    lang: options?.lang ?? SummarizationLanguage.DEFAULT,
    customInstructions: options?.customInstructions ?? undefined,
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
    /\/shorts\/([\w-]{11})(?:\?|&|$)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extracts YouTube video metadata including thumbnail URL, title, and channel name
 * @param url YouTube video URL
 * @returns Promise with video metadata or null if extraction fails
 */
export async function extractYouTubeVideoMetadata(url: string): Promise<{
  thumbnail: string | null;
  title: string | null;
  channelName: string | null;
}> {
  const emptyResult = {
    thumbnail: null,
    title: null,
    channelName: null,
  };

  try {
    const videoId = extractVideoId(url);
    if (!videoId) return { ...emptyResult };

    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!videoId) return { ...emptyResult };

    const data = await response.json();
    const title = (await data.title) || 'Unknown Title';
    const channelName = data.author_name || 'Unknown Channel';
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      thumbnail,
      title,
      channelName,
    };
  } catch (error) {
    console.error('Error extracting YouTube video metadata:', error);
    return { ...emptyResult };
  }
}

export function validateSummarizationOptions(
  options: SummarizationOptions,
): void {
  console.log('received options: ', options);
  if (
    options.length &&
    !Object.values(SummaryLength).includes(options.length)
  ) {
    options.length = SummaryLength.STANDARD;
  }
  if (
    options.format &&
    !Object.values(SummaryFormat).includes(options.format)
  ) {
    options.format = SummaryFormat.DEFAULT;
  }
  if (
    options.model &&
    !Object.values(SummarizationModel).includes(options.model)
  ) {
    options.model = SummarizationModel.DEFAULT;
  }
  if (
    options.speed &&
    !Object.values(SummarizationSpeed).includes(options.speed)
  ) {
    options.speed = SummarizationSpeed.DEFAULT;
  }
  if (typeof options.listen !== 'boolean') {
    options.listen = false;
  }
  console.log('validated options: ', options);
}

export function preparePrompt(options: SummarizationOptions, text: string) {
  const { length, format, lang } = getSummarizationOptions(options);
  let prompt: string;

  if (options?.customInstructions && options?.lang === SummarizationLanguage.DEFAULT) {
    prompt = `Summarize the following text based on these special requirements: ${options.customInstructions}`;
  } else if (options?.customInstructions && options?.lang !== SummarizationLanguage.DEFAULT) {
    prompt = `Summarize the following text in ${lang} based on these special requirements: ${options.customInstructions}`;
  } else {
    if (
      options?.format === SummaryFormat.DEFAULT &&
      options?.lang === SummarizationLanguage.DEFAULT
    ) {
      prompt = `Summarize the following text in a ${length} length. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    } else if (options?.format === SummaryFormat.DEFAULT) {
      prompt = `Summarize the following text in a ${length} length, in ${lang}. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    } else {
      prompt = `Summarize the following text in a ${length} length, in ${format} style in ${lang}. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    }
  }

  prompt += `\n\nText to summarize:\n${text}`;

  return prompt;
}

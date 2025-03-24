import OpenAI from 'openai';
import { SummarizationOptionsDto } from '../summarization/dto/summarization-options.dto';
import {
  SummaryLength,
  SummaryFormat,
  SummarizationSpeed,
  SummarizationModel,
  SummarizationLanguage,
  STTModel,
} from '../summarization/enums/summarization-options.enum';
import { SummarizationOptions } from '../summarization/interfaces/summarization-options.interface';
import { DEEPSEEK_MAX_TOKENS, OPENAI_MAX_TOKENS } from './constants';

/**
 * Creates a complete SummarizationOptions object with default values for missing options
 * @param {SummarizationOptionsDto} [options] - Optional partial summarization options
 * @returns {SummarizationOptions} Complete summarization options with defaults applied
 */
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
    sttModel: options?.sttModel ?? STTModel.DEFAULT,
    customInstructions: options?.customInstructions ?? undefined,
  };
}

/**
 * Validates and sanitizes summarization options by ensuring all fields have valid values
 * Invalid values are replaced with defaults
 * @param {SummarizationOptions} options - The options to validate
 * @throws {never} This function modifies the options object in place and doesn't throw
 */
export function validateSummarizationOptions(
  options: SummarizationOptions,
): void {
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
}

/**
 * Prepares a prompt for text summarization based on the provided options
 * @param {SummarizationOptions} options - Configuration options for the summarization
 * @param {string} text - The text to be summarized
 * @returns {string} A formatted prompt string ready for the summarization model
 */
export function preparePrompt(options: SummarizationOptions, text: string) {
  const { length, format, lang } = getSummarizationOptions(options);
  let prompt: string;

  if (
    options?.customInstructions &&
    options?.lang === SummarizationLanguage.DEFAULT
  ) {
    prompt = `Summarize the following text based on these special requirements: ${options.customInstructions}`;
  } else if (
    options?.customInstructions &&
    options?.lang !== SummarizationLanguage.DEFAULT
  ) {
    prompt = `Summarize the following text in ${lang} based on these special requirements: ${options.customInstructions}`;
  } else {
    if (
      options?.format === SummaryFormat.DEFAULT &&
      options?.lang === SummarizationLanguage.DEFAULT
    ) {
      prompt = `Summarize the following text in a ${length} length. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    } else if (
      options?.format === SummaryFormat.DEFAULT &&
      options?.lang !== SummarizationLanguage.DEFAULT
    ) {
      prompt = `Summarize the following text in a ${length} length, in ${lang}. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    } else if (
      options?.format !== SummaryFormat.DEFAULT &&
      options?.lang === SummarizationLanguage.DEFAULT
    ) {
      prompt = `Summarize the following text in a ${length} length, in ${format} style. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    } else {
      prompt = `Summarize the following text in a ${length} length, in ${format} style in ${lang}. Focus on the key points, main arguments, and important details. Ensure the summary is coherent and complete`;
    }
  }

  prompt += `\n\nText to summarize:\n${text}`;

  return prompt;
}

/**
 * Generates a summary of the input text using OpenAI's GPT-4o model.
 *
 * @param apiKey - OpenAI API key for authentication
 * @param prompt - The text content to be summarized
 * @returns A promise that resolves to the generated summary string
 * @throws Error if the summarization fails, including the original error message
 */
export async function summarizeWithOpenAi(
  apiKey: string,
  prompt: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const startTime = new Date();
  try {
    console.log("Summarizing using OpenAI ...")
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a summarization expert who extracts key details from long texts. Provide well-structured summaries that capture the essence of the content while maintaining readability and coherence.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
    });

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

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

/**
 * Generates a summary of the input text using DeepSeek's chat model.
 *
 * @param apiKey - DeepSeek API key for authentication
 * @param prompt - The text content to be summarized
 * @returns A promise that resolves to the generated summary string
 * @throws Error if the summarization fails, including the original error message
 */
export async function summarizeWithDeepSeek(
  apiKey: string,
  prompt: string,
): Promise<string> {
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
  });
  try {
    console.log("Summarizing using deepseek ...")
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You are a summarization expert who extracts key details from long texts. Provide well-structured summaries that capture the essence of the content while maintaining readability and coherence.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: DEEPSEEK_MAX_TOKENS,
    });
    return (
      response.choices[0]?.message?.content || 'Could not generate a summary.'
    );
  } catch (error) {
    throw new Error(`Failed to summarize text: ${error.message}`);
  }
}

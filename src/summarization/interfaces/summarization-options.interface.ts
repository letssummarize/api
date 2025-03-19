import { SummarizationLanguage, SummarizationModel, SummarizationSpeed, SummaryFormat, SummaryLength } from "../enums/summarization-options.enum";

export interface SummarizationOptions {
    length?: SummaryLength,
    format?: SummaryFormat,
    model?: SummarizationModel,
    listen?: boolean,
    speed?: SummarizationSpeed,
    lang?: SummarizationLanguage,
    customInstructions?: string,
}
import { SummaryFormat, SummaryLength } from "../enums/summarization-options.enum";

export interface SummarizationOptions {
    length?: SummaryLength,
    format?: SummaryFormat,
    listen?: boolean
}
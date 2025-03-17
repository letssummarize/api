import { SummarizationModel, SummaryFormat, SummaryLength } from "../enums/summarization-options.enum";

export interface SummarizationOptions {
    length?: SummaryLength,
    format?: SummaryFormat,
    model?: SummarizationModel,
    listen?: boolean
}
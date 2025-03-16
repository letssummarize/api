import { IsOptional, IsEnum, IsBoolean } from "class-validator";
import { SummaryFormat, SummaryLength } from "../enums/summarization-options.enum";

export class SummarizationOptionsDto {
    @IsOptional()
    @IsEnum(SummaryLength)
    length?: SummaryLength;
  
    @IsOptional()
    @IsEnum(SummaryFormat)
    format?: SummaryFormat;
  
    @IsOptional()
    @IsBoolean()
    listen?: boolean;
  }
  
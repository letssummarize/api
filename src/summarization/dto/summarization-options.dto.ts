import { IsOptional, IsEnum, IsBoolean, IsString } from "class-validator";
import { SummarizationLanguage, SummarizationModel, SummarizationSpeed, SummaryFormat, SummaryLength } from "../enums/summarization-options.enum";

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

    @IsOptional()
    @IsEnum(SummarizationModel)
    model?: SummarizationModel;

    @IsOptional()
    @IsEnum(SummarizationSpeed)
    speed?: SummarizationSpeed;

    @IsOptional()
    @IsEnum(SummarizationLanguage)
    lang?: SummarizationLanguage;

    @IsOptional()
    @IsString()
    customInstructions?: string;
  }
  
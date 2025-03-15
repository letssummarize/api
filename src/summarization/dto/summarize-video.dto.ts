import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SummarizeVideoDto {
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @IsString()
  @IsOptional()
  userApiKey?: string;
}

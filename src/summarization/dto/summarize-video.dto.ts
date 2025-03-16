import { IsNotEmpty, IsString } from 'class-validator';

export class SummarizeVideoDto {
  @IsString()
  @IsNotEmpty()
  videoUrl: string;
}

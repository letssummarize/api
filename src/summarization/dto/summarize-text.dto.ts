import { IsNotEmpty, IsString } from 'class-validator';

export class SummarizeTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

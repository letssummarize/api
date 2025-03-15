import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SummarizationService } from './summarization.service';
import { SummarizeVideoDto } from './dto/summarize-video.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { FILE_VALIDATOR_PIPE } from './pipes/file-validation.pipe';

@Controller('summarize')
export class SummarizationController {
  constructor(private readonly summarizationService: SummarizationService) {}

  @Post('video')
  async summarizeYouTube(@Body() dto: SummarizeVideoDto) {
    const summary = await this.summarizationService.summarizeYouTubeVideo(dto);

    return { summary };
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async summarizeFile(@UploadedFile(FILE_VALIDATOR_PIPE) file: Express.Multer.File, @Body('apiKey') userApiKey?: string) {
    console.log(file);
    return this.summarizationService.summarizeFile(file, userApiKey);
  }

  @Get()
  getMessage() {
    return 'Hello there.';
  }
}

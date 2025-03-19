import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SummarizationService } from './summarization.service';
import { SummarizeVideoDto } from './dto/summarize-video.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { FILE_VALIDATOR_PIPE } from './pipes/file-validation.pipe';
import { SummarizationOptionsDto } from './dto/summarization-options.dto';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Request } from 'express';
import { SummarizeTextDto } from './dto/summarize-text.dto';

@Controller('summarize')
@UseGuards(ApiKeyGuard)
export class SummarizationController {
  constructor(private readonly summarizationService: SummarizationService) {}

  @Post('video')
  async summarizeYouTube(
    @Req() req: Request,
    @Body()
    body: { content: SummarizeVideoDto; options?: SummarizationOptionsDto },
  ) {
    const { content, options } = body;
    const userApiKey = (req as any).apiKey;

    const summary = await this.summarizationService.summarizeYouTubeVideo(content, options, userApiKey);

    return { ...summary };
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async summarizeFile(
    @UploadedFile(FILE_VALIDATOR_PIPE) file: Express.Multer.File,
    @Req() req: Request,
    @Body() options?: SummarizationOptionsDto,
  ) {
    const userApiKey = (req as any).apiKey;
    const summary = await this.summarizationService.summarizeFile(file, options, userApiKey);
    return { ...summary };
  }

  @Post('text')
  async summarizeText(
    @Req() req: Request,
    @Body()
    body: { content: SummarizeTextDto; options: SummarizationOptionsDto },
  ) {
    const { content, options } = body;
    const userApiKey = (req as any).apiKey;
    const summary = await this.summarizationService.summarizeText(content.text, options, userApiKey);
    return { ...summary };
  }

  @Get()
  getMessage() {
    return 'Hello there.';
  }
}

import { Controller, Post, Body, Get } from '@nestjs/common';
import { SummarizationService } from './summarization.service';
import { SummarizeVideoDto } from './dto/summarize-video.dto';

@Controller('summarize')
export class SummarizationController {
  constructor(private readonly summarizationService: SummarizationService) {}

  @Post('video')
  async summarizeYouTube(@Body() dto: SummarizeVideoDto) {
    
    const summary = await this.summarizationService.summarizeYouTubeVideo(dto);

    return { summary };
  }

  @Get()
  getMessage() {
    return "Hello there."
  }
}

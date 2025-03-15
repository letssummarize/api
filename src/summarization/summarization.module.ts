import { Module } from '@nestjs/common';
import { SummarizationController } from './summarization.controller';
import { SummarizationService } from './summarization.service';

@Module({
  controllers: [SummarizationController],
  providers: [SummarizationService]
})
export class SummarizationModule {}

import { Module } from '@nestjs/common';
import { SummarizationController } from './summarization.controller';
import { SummarizationService } from './summarization.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SummarizationController],
  providers: [SummarizationService]
})
export class SummarizationModule {}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SummarizationModule } from './summarization/summarization.module';

@Module({
  imports: [SummarizationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { SummarizationModule } from './summarization/summarization.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PUBLIC_DIR } from './utils/constants';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'downloads'),
      serveRoot: PUBLIC_DIR,
    }),
    SummarizationModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

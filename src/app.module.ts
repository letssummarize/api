import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SummarizationModule } from './summarization/summarization.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'downloads'),
    //   serveRoot: PUBLIC_DIR,
    // }),
    SummarizationModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

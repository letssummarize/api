import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  if (process.env.NODE_ENV === 'production') {
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp;
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}

// Run locally in development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Export for Vercel in production
export default bootstrap;

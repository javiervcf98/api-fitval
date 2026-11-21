import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { configureApp } from './app.config';
import { AppModule } from './app.module';

// En tu ordenador, lee el .env. En Render no hay .env: las variables las pone Render
if (existsSync('.env')) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app); // prefijo /api y ValidationPipe

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

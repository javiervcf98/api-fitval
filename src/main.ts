import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { configureApp } from './app.config';
import { AppModule } from './app.module';

// En tu ordenador, lee el .env. En Render no hay .env: las variables las pone Render
if (existsSync('.env')) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En Render, las peticiones llegan a través de un proxy: así se ve la IP real
  app.set('trust proxy', 1);

  configureApp(app); // helmet, prefijo /api, versiones, ValidationPipe y filtro de errores

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

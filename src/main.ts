import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'node:path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');
  // Mantiene una versión explícita y uniforme para todos los contratos HTTP.
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { join } from "node:path";

import { AppModule } from "./app.module";

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
  app.setBaseViewsDir(join(__dirname, "views"));
  app.setViewEngine("hbs");
  app.useStaticAssets(join(process.cwd(), "public"), {
    prefix: "/laboratorio/",
  });
  app.setGlobalPrefix("api/v1");

  // Sin autenticación en este ciclo: el laboratorio solo escucha en loopback.
  if (!["development", "test"].includes(process.env.NODE_ENV || "development"))
    throw new Error("Autenticación pendiente: solo laboratorio local");
  await app.listen(process.env.PORT ?? 3000, "127.0.0.1");
}

void bootstrap();

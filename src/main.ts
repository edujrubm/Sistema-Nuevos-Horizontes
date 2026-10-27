import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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
  app.setGlobalPrefix("api");

  const openApiConfig = new DocumentBuilder()
    .setTitle("Sistema Nuevos Horizontes")
    .setDescription(
      "API institucional. Los ejemplos y ambientes de prueba usan datos sintéticos.",
    )
    .setVersion("1.0")
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/docs", app, openApiDocument);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { join } from "node:path";

import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/errors/api-exception.filter";
import { idSolicitudMiddleware } from "./common/errors/id-solicitud.middleware";
import { crearExcepcionValidacion } from "./common/errors/validation-exception.factory";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(idSolicitudMiddleware);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: crearExcepcionValidacion,
    }),
  );
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');
  app.setGlobalPrefix('api/v1');
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

  // Sin autenticaciÃ³n en este ciclo: el laboratorio solo escucha en loopback.
  if (!["development", "test"].includes(process.env.NODE_ENV || "development"))
    throw new Error("AutenticaciÃ³n pendiente: solo laboratorio local");
  await app.listen(process.env.PORT ?? 3000, "127.0.0.1");
}

void bootstrap();

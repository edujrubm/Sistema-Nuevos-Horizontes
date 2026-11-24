import { configurarTransporteApi } from "./common/errors/transporte";

import { NestFactory } from "@nestjs/core";

import { NestExpressApplication } from "@nestjs/platform-express";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import helmet from "helmet";
import { join } from "node:path";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  configurarTransporteApi(app);

  app.setGlobalPrefix("api");
  app.setBaseViewsDir(join(__dirname, "views"));
  app.setViewEngine("hbs");

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Nuevos Horizontes")
      .setVersion("1.0")
      .build(),
  );

  SwaggerModule.setup("api/docs", app, document);

  if (!["development", "test"].includes(process.env.NODE_ENV || "development"))
    throw new Error("AutenticaciÃ³n pendiente: solo entorno local");

  await app.listen(process.env.PORT ?? 3000, "127.0.0.1");
}

void bootstrap();

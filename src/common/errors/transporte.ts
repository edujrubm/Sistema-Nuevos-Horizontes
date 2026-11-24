import { INestApplication } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { ErrorApi } from "./error-api";
import { clasificarError, identificarSolicitud } from "./errores.filter";
/** Instalar antes de init/listen. Nest reutiliza los parsers ya registrados. */
export function configurarTransporteApi(app: INestApplication) {
  app.use(identificarSolicitud);
  app.getHttpAdapter().registerParserMiddleware("api/v1", false);
  app.use(
    (error: unknown, _req: Request, _res: Response, next: NextFunction) => {
      const type = (error as { type?: string } | null)?.type;
      if (
        [
          "entity.parse.failed",
          "entity.too.large",
          "request.aborted",
          "charset.unsupported",
          "encoding.unsupported",
        ].includes(type || "")
      ) {
        // Conserva la clasificación antes de que Nest convierta SyntaxError a un 400 genérico.
        next(new ErrorApi(clasificarError(error).codigo));
      } else next(error);
    },
  );
}

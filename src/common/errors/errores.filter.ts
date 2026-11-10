import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { CATALOGO, CodigoError } from "./catalogo";
import { ErrorApi, codigoTecnico, falloConexion } from "./error-api";
export type SolicitudApi = Request & { idSolicitud?: string };
export function identificarSolicitud(
  req: SolicitudApi,
  res: Response,
  next: NextFunction,
) {
  req.idSolicitud = "SOL-" + randomUUID();
  res.setHeader("X-Id-Solicitud", req.idSolicitud);
  next();
}
export function clasificarError(
  error: unknown,
  rutaEncontrada = true,
): { codigo: CodigoError; estado: number } {
  if (error instanceof ErrorApi)
    return { codigo: error.codigo, estado: error.getStatus() };
  const raw = error as { type?: string } | null;
  if (["charset.unsupported", "encoding.unsupported"].includes(raw?.type || ""))
    return { codigo: "TIPO_CONTENIDO_NO_ADMITIDO", estado: 415 };
  if (raw?.type === "entity.parse.failed")
    return { codigo: "JSON_INVALIDO", estado: 400 };
  if (raw?.type === "entity.too.large")
    return { codigo: "SOLICITUD_DEMASIADO_GRANDE", estado: 413 };
  if (raw?.type === "request.aborted")
    return { codigo: "SOLICITUD_NO_COMPLETADA_A_TIEMPO", estado: 408 };
  if (
    falloConexion(error) ||
    ["40001", "40P01"].includes(codigoTecnico(error) || "")
  )
    return { codigo: "BASE_DATOS_NO_DISPONIBLE", estado: 503 };
  if (error instanceof HttpException) {
    const estado = error.getStatus();
    const known: Partial<Record<number, CodigoError>> = {
      400: "FORMATO_INVALIDO",
      401: "AUTENTICACION_REQUERIDA",
      403: "ACCESO_DENEGADO",
      404: rutaEncontrada ? "REGISTRO_NO_ENCONTRADO" : "RUTA_NO_ENCONTRADA",
      405: "METODO_NO_PERMITIDO",
      406: "FORMATO_RESPUESTA_NO_ADMITIDO",
      408: "SOLICITUD_NO_COMPLETADA_A_TIEMPO",
      413: "SOLICITUD_DEMASIADO_GRANDE",
      415: "TIPO_CONTENIDO_NO_ADMITIDO",
      429: "DEMASIADAS_SOLICITUDES",
    };
    if (estado >= 400 && estado < 500)
      return { codigo: known[estado] || "SOLICITUD_RECHAZADA", estado };
  }
  return { codigo: "ERROR_INTERNO", estado: 500 };
}
@Catch()
export class ErroresApiFilter implements ExceptionFilter {
  private readonly logger = new Logger("ErroresApi");
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp(),
      req = http.getRequest<SolicitudApi>(),
      res = http.getResponse<Response>();
    const idSolicitud = req.idSolicitud || "SOL-" + randomUUID();
    let codigo: CodigoError = "ERROR_INTERNO",
      estado = 500;
    try {
      ({ codigo, estado } = clasificarError(error, !!req.route));
    } catch {
      /* Respaldo mínimo. */
    }
    if (
      error instanceof HttpException &&
      error.getStatus() === 413 &&
      req.route?.path === "/api/v1/beneficiarias/:id/documentos/cargas"
    )
      codigo = "ARCHIVO_DEMASIADO_GRANDE";
    // No registrar cuerpos, URL, SQL, valores, mensajes o pilas con datos sensibles.
    const code = codigoTecnico(error);
    try {
      this.logger.error(
        JSON.stringify({
          idSolicitud,
          estado,
          codigo,
          tipo: error instanceof Error ? error.name : "Desconocido",
          ...(code && /^[A-Z0-9_]{1,30}$/.test(code) ? { causa: code } : {}),
        }),
      );
    } catch {
      /* Un fallo del registro no impide responder al usuario. */
    }
    if (res.headersSent || res.destroyed) {
      if (!res.destroyed) res.destroy();
      return;
    }
    res.setHeader("X-Id-Solicitud", idSolicitud);
    res.status(estado).json({
      estado,
      codigo,
      mensaje: CATALOGO[codigo].mensaje,
      errores: error instanceof ErrorApi ? error.errores : [],
      idSolicitud,
    });
  }
}

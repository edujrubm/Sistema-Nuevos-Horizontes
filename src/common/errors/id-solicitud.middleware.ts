import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export interface SolicitudConId extends Request {
  idSolicitud?: string;
}

export function generarIdSolicitud(): string {
  return `SOL-${randomUUID().replaceAll("-", "")}`;
}

export function idSolicitudMiddleware(
  request: SolicitudConId,
  response: Response,
  next: NextFunction,
) {
  request.idSolicitud = generarIdSolicitud();
  response.setHeader("X-Id-Solicitud", request.idSolicitud);
  next();
}

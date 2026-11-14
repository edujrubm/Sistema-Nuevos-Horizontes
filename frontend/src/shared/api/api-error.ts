import { z } from "zod";
import catalogo from "./errores-catalogo.json";

const apiErrorSchema = z.object({
  estado: z.number(),
  codigo: z.string(),
  mensaje: z.string(),
  errores: z
    .array(z.object({ campo: z.string(), mensaje: z.string() }))
    .default([]),
  idSolicitud: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export class ApiError extends Error {
  constructor(public readonly body: ApiErrorBody) {
    super(body.mensaje);
    this.name = "ApiError";
  }

  /** Alias temporales para consumidores publicados; existe una sola clase de error. */
  get estado() {
    return this.body.estado;
  }
  get codigo() {
    return this.body.codigo;
  }
  get errores() {
    return this.body.errores;
  }
  get idSolicitud() {
    return this.body.idSolicitud;
  }
}

export function parseApiError(value: unknown, status: number): ApiError {
  const body =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const parsed = apiErrorSchema.safeParse({
    ...body,
    estado: status,
    idSolicitud:
      typeof body.idSolicitud === "string" ? body.idSolicitud : "no-disponible",
  });
  if (parsed.success && Object.hasOwn(catalogo, parsed.data.codigo)) {
    return new ApiError(parsed.data);
  }

  return new ApiError({
    estado: status,
    codigo: "RESPUESTA_NO_RECONOCIDA",
    mensaje: "No se pudo completar la solicitud. Inténtalo nuevamente.",
    errores: [],
    idSolicitud: "no-disponible",
  });
}

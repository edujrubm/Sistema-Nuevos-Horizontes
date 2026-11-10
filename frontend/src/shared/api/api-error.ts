import { z } from "zod";

const apiErrorSchema = z.object({
  estado: z.number(),
  codigo: z.string(),
  mensaje: z.string(),
  errores: z.array(z.object({ campo: z.string(), mensaje: z.string() })).default([]),
  idSolicitud: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export class ApiError extends Error {
  constructor(public readonly body: ApiErrorBody) {
    super(body.mensaje);
    this.name = "ApiError";
  }
}

export function parseApiError(value: unknown, status: number): ApiError {
  const parsed = apiErrorSchema.safeParse(value);
  if (parsed.success) return new ApiError(parsed.data);

  return new ApiError({
    estado: status,
    codigo: "RESPUESTA_NO_RECONOCIDA",
    mensaje: "No se pudo completar la solicitud. Inténtalo nuevamente.",
    errores: [],
    idSolicitud: "no-disponible",
  });
}

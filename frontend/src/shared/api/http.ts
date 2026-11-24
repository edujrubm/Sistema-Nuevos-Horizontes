import { apiRequest, areaRequestOptions } from "./http-client";
export { ApiError } from "./api-error";
export type DetalleError =
  import("./api-error").ApiErrorBody["errores"][number];
/** Compatibilidad del contrato anterior; toda configuración y transporte está en apiRequest. */
export function http<T>(
  ruta: string,
  op: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  return apiRequest<T>(
    ruta,
    {
      method: op.method || "GET",
      body: op.body === undefined ? undefined : JSON.stringify(op.body),
      signal: op.signal,
    },
    areaRequestOptions,
  );
}

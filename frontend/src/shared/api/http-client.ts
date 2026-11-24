import { ApiError, parseApiError } from "./api-error";

export interface ApiRequestOptions {
  timeoutMs?: number;
}
/** Conserva el límite ya utilizado por los registros de área. */
export const areaRequestOptions: ApiRequestOptions = { timeoutMs: 20_000 };

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  if (init.signal?.aborted) controller.abort();
  // Los consumidores existentes del equipo conservan su comportamiento sin un límite nuevo.
  const timeout =
    options.timeoutMs === undefined
      ? undefined
      : setTimeout(abort, options.timeoutMs);
  try {
    // Configuración única para módulos actuales y consumidores de compatibilidad.
    const base =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_BASE ||
      "/api/v1";
    const response = await fetch(`${base}${path}`, {
      ...init,
      method: init.method || "GET",
      headers,
      signal: controller.signal,
      credentials: "same-origin",
    });
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) throw parseApiError(payload, response.status);
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError || init.signal?.aborted) throw error;
    const writing = !["GET", "HEAD"].includes(
      (init.method || "GET").toUpperCase(),
    );
    throw new ApiError({
      estado: 0,
      codigo: writing ? "RESPUESTA_NO_RECIBIDA" : "CONEXION_NO_DISPONIBLE",
      mensaje: writing
        ? "No recibimos confirmación. Consulta el registro antes de volver a guardar para evitar duplicados."
        : "No se pudo conectar. Conservamos los datos; intenta de nuevo.",
      errores: [],
      idSolicitud: "no-disponible",
    });
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abort);
  }
}

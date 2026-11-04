import catalogo from "./errores-catalogo.json";
export interface DetalleError {
  campo: string;
  mensaje: string;
}
export class ApiError extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly errores: DetalleError[] = [],
    readonly idSolicitud = "",
  ) {
    super(mensaje);
  }
}
export async function http<T>(
  ruta: string,
  op: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  op.signal?.addEventListener("abort", abort, { once: true });
  if (op.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    const r = await fetch((import.meta.env.VITE_API_BASE || "/api/v1") + ruta, {
      method: op.method || "GET",
      headers: op.body ? { "Content-Type": "application/json" } : undefined,
      body: op.body ? JSON.stringify(op.body) : undefined,
      signal: controller.signal,
      credentials: "same-origin",
    });
    const json: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      const x = (json && typeof json === "object" ? json : {}) as Record<
        string,
        unknown
      >;
      const conocido =
        typeof x.codigo === "string" && Object.hasOwn(catalogo, x.codigo);
      const detalles =
        Array.isArray(x.errores) &&
        x.errores.every(
          (v) =>
            v && typeof v.campo === "string" && typeof v.mensaje === "string",
        )
          ? (x.errores as DetalleError[])
          : [];
      throw new ApiError(
        r.status,
        conocido ? String(x.codigo) : "RESPUESTA_NO_VALIDA",
        conocido
          ? catalogo[x.codigo as keyof typeof catalogo]
          : "No se pudo completar la solicitud. Intenta de nuevo o comunícate con soporte.",
        detalles,
        typeof x.idSolicitud === "string" ? x.idSolicitud : "",
      );
    }
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (op.signal?.aborted) throw e;
    const escritura = op.method && !["GET", "HEAD"].includes(op.method);
    throw new ApiError(
      0,
      escritura ? "RESPUESTA_NO_RECIBIDA" : "CONEXION_NO_DISPONIBLE",
      escritura
        ? "No recibimos confirmación. Consulta el registro antes de volver a guardar para evitar duplicados."
        : "No se pudo conectar. Conservamos los datos; intenta de nuevo.",
    );
  } finally {
    clearTimeout(timeout);
    op.signal?.removeEventListener("abort", abort);
  }
}

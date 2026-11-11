import { apiRequest } from "@/shared/api/http-client";
import { ApiError, parseApiError } from "@/shared/api/api-error";
export interface Documento {
  id: string;
  formularioId: string;
  categoria: string;
  nombreDocumento: string | null;
  tamanoBytes: string;
  versionDocumento: number;
  versionRegistro: number;
  cargadoEn: string;
  fechaDocumento: string | null;
  descripcion: string | null;
  estadoRevisionCodigo: string;
  anuladoEn: string | null;
  motivoAnulacion: string | null;
  motivoCambio?: string | null;
  cargadoPor: string;
  autorNombre?: string;
}
export interface ContextoDocumentos {
  area: string;
  formularios: {
    id: string;
    tipo: string;
    estadoCodigo: string;
    ninoId: string | null;
    fechaAtencion: string;
  }[];
  resumen: {
    documentosActivos: number;
    versionesConservadas: number;
    pendientesRevision: number;
    tamanoBytes: string;
  };
  categorias: string[];
  capacidades: { cargar: boolean; anular: boolean };
}
export interface FiltrosDocumentos {
  pagina: number;
  buscar: string;
  categoria: string;
  estado: string;
}
export const contextoDocumentos = (id: string, signal?: AbortSignal) =>
  apiRequest<ContextoDocumentos>(`/beneficiarias/${id}/documentos/contexto`, {
    signal,
  });
export const listarDocumentos = (
  id: string,
  f: FiltrosDocumentos,
  signal?: AbortSignal,
) => {
  const q = new URLSearchParams({
    pagina: String(f.pagina),
    limite: "20",
    ultimas: "true",
  });
  if (f.buscar.trim()) q.set("buscar", f.buscar.trim());
  if (f.categoria) q.set("categoria", f.categoria);
  if (f.estado) q.set("estado", f.estado);
  return apiRequest<{
    datos: Documento[];
    pagina: number;
    limite: number;
    total: number;
  }>(`/beneficiarias/${id}/documentos?${q}`, { signal });
};
export const versionesDocumentos = (id: string, signal?: AbortSignal) =>
  apiRequest<{ datos: Documento[]; total: number }>(
    `/documentos/${id}/versiones`,
    { signal },
  );
export const anularDocumento = (d: Documento, motivo: string) =>
  apiRequest<Documento>(`/documentos/${d.id}/anular`, {
    method: "POST",
    body: JSON.stringify({ version: d.versionRegistro, motivo }),
  });
const base = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
export function validarPdf(file: File): string | undefined {
  if (!file.size) return "El archivo está vacío.";
  if (file.size > 20 * 1024 * 1024) return "El PDF no puede superar 20 MB.";
  if (!/\.pdf$/i.test(file.name) || file.type !== "application/pdf")
    return "Selecciona un documento PDF. No se admiten imágenes.";
}
export function cargarDocumento(
  id: string,
  form: FormData,
  onProgress: (value: number) => void,
  signal: AbortSignal,
): Promise<Documento> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    const incierto = () => {
      cleanup();
      reject(
        new ApiError({
          estado: 0,
          codigo: "RESULTADO_OPERACION_INCIERTO",
          mensaje:
            "No recibimos confirmación de la carga. Consulta los documentos antes de volver a subir el archivo para evitar duplicados.",
          errores: [],
          idSolicitud: "",
        }),
      );
    };
    xhr.open("POST", `${base}/beneficiarias/${id}/documentos/cargas`);
    xhr.withCredentials = true;
    xhr.timeout = 120000;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      cleanup();
      let json: unknown;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        incierto();
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(parseApiError(json, xhr.status));
        return;
      }
      if (
        !json ||
        typeof json !== "object" ||
        !("id" in json) ||
        typeof json.id !== "string"
      ) {
        incierto();
        return;
      }
      resolve(json as Documento);
    };
    xhr.onerror = incierto;
    xhr.ontimeout = incierto;
    xhr.onabort = incierto;
    if (signal.aborted) {
      incierto();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(form);
  });
}
export async function descargarDocumento(id: string, signal?: AbortSignal) {
  const r = await fetch(`${base}/documentos/${id}/archivo`, {
    signal,
    credentials: "same-origin",
  });
  if (!r.ok) throw parseApiError(await r.json().catch(() => null), r.status);
  if (!r.headers.get("content-type")?.includes("application/pdf"))
    throw new Error("No se recibió un archivo PDF válido.");
  return r.blob();
}

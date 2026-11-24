import { apiRequest } from "@/shared/api/http-client";

export interface AdmissionSection {
  id?: string;
  seccion: string;
  contenido: Record<string, unknown>;
  version?: number;
  actualizadoEn?: string;
}

export interface AdmissionRecord {
  id: string;
  expedienteId: string;
  correlativo: string | null;
  lugar: string | null;
  fecha: string | null;
  estado: "BORRADOR" | "CONFIRMADA";
  version: number;
  actualizadoEn: string;
  secciones: AdmissionSection[];
  hijos: ChildDraft[];
}

export interface ChildDraft {
  id?: string;
  version?: number;
  nombre?: string;
  cui?: string;
  tipoDocumento?: "DPI_CUI" | "PASAPORTE" | "OTRO" | "SIN_DOCUMENTO";
  documentoAlternativo?: string;
  otroTipoDocumento?: string;
  fechaNacimiento?: string;
  reconocido?: boolean | null;
  genero?: "F" | "M" | "O";
}

export interface StartAdmissionInput {
  nombre: string;
  cui?: string;
  fechaNacimiento?: string;
  lugar?: string;
  fechaEntrevista?: string;
}

interface StartAdmissionResponse {
  data: { fichaInicial: { id: string; version: number; estado: string } };
}

interface AdmissionResponse {
  data: AdmissionRecord;
}

export interface AdmissionListItem {
  id: string;
  correlativo: string | null;
  lugar: string | null;
  fecha: string | null;
  estado: "BORRADOR" | "CONFIRMADA";
  version: number;
  actualizadoEn: string;
}

interface AdmissionListResponse {
  data: AdmissionListItem[];
  page: { nextCursor: string | null; hasMore: boolean };
}

interface SavePageResponse {
  data: {
    id: string;
    estado: string;
    version: number;
    pagina: string;
    seccionesGuardadas: string[];
    hijos: Array<ChildDraft & { id: string; version: number }>;
  };
}

export function startAdmission(input: StartAdmissionInput) {
  return apiRequest<StartAdmissionResponse>("/fichas-iniciales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdmission(id: string, signal?: AbortSignal) {
  return apiRequest<AdmissionResponse>(`/fichas-iniciales/${id}`, { signal });
}

export function listAdmissions(
  status: AdmissionListItem["estado"],
  cursor?: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ estado: status, limite: "20" });
  if (cursor) params.set("cursor", cursor);
  return apiRequest<AdmissionListResponse>(
    `/fichas-iniciales?${params.toString()}`,
    { signal },
  );
}

export function saveAdmissionPage(
  id: string,
  page: string,
  input: {
    secciones: Record<string, Record<string, unknown>>;
    hijos?: ChildDraft[];
    versionFicha: number;
    motivo: string;
  },
) {
  return apiRequest<SavePageResponse>(
    `/fichas-iniciales/${id}/paginas/${page}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function confirmAdmission(id: string, version: number) {
  return apiRequest<AdmissionResponse>(`/fichas-iniciales/${id}/confirmar`, {
    method: "POST",
    body: JSON.stringify({
      version,
      motivo: "Confirmación final de ficha inicial desde frontend",
    }),
  });
}

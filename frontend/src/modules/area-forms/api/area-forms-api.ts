import { apiRequest } from "@/shared/api/http-client";

export type AreaFormState = string;

export interface AreaForm {
  id: string;
  expedienteId: string;
  ninoId: string | null;
  areaId: string;
  area: string;
  tipo: string;
  estado: AreaFormState;
  fechaAtencion: string;
  profesionalId: string;
  capturadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  version: number;
  detalle: Record<string, unknown>;
  examenMental: Record<string, unknown> | null;
}

export interface AreaFormsResponse {
  data: AreaForm[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface AreaFormType {
  codigo: string;
  descripcion: string;
  areaId: string;
  area: string;
  detalle: string | null;
  requiereNino: boolean | null;
  admiteExamenMental: boolean;
  campos: string[];
}

export interface AreaFormTypesResponse {
  data: AreaFormType[];
  estados: {
    codigos: { borrador: string; confirmado: string; descartado: string };
    catalogo: Array<{ codigo: string; descripcion: string }>;
    listo: boolean;
  };
}

export interface ListAreaFormsFilters {
  areaId?: string;
  tipo?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateAreaFormInput {
  tipo: string;
  ninoId?: string;
  fechaAtencion: string;
  profesionalId: string;
  detalle: Record<string, unknown>;
  examenMental?: Record<string, unknown>;
}

export interface UpdateAreaFormInput {
  version: number;
  motivo: string;
  fechaAtencion?: string;
  profesionalId?: string;
  detalle?: Record<string, unknown>;
  examenMental?: Record<string, unknown>;
}

export function listAreaForms(
  beneficiaryId: string,
  filters: ListAreaFormsFilters = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ limite: String(filters.limit ?? 25) });
  if (filters.areaId) query.set("areaId", filters.areaId);
  if (filters.tipo) query.set("tipo", filters.tipo);
  if (filters.cursor) query.set("cursor", filters.cursor);

  return apiRequest<AreaFormsResponse>(
    `/beneficiarias/${beneficiaryId}/formularios-area?${query}`,
    { signal },
  );
}

export function getAreaForm(id: string, signal?: AbortSignal) {
  return apiRequest<{ data: AreaForm }>(`/formularios-area/${id}`, { signal });
}

export function listAreaFormTypes(signal?: AbortSignal) {
  return apiRequest<AreaFormTypesResponse>("/tipos-formulario", { signal });
}

export function createAreaForm(
  beneficiaryId: string,
  input: CreateAreaFormInput,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: AreaForm }>(
    `/beneficiarias/${beneficiaryId}/formularios-area`,
    { method: "POST", body: JSON.stringify(input), signal },
  );
}

export function updateAreaForm(
  id: string,
  input: UpdateAreaFormInput,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: AreaForm }>(`/formularios-area/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    signal,
  });
}

export function confirmAreaForm(
  id: string,
  version: number,
  motivo: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: AreaForm }>(`/formularios-area/${id}/confirmar`, {
    method: "POST",
    body: JSON.stringify({ version, motivo }),
    signal,
  });
}

export function discardAreaForm(
  id: string,
  version: number,
  motivo: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: AreaForm }>(`/formularios-area/${id}/descartar`, {
    method: "POST",
    body: JSON.stringify({ version, motivo }),
    signal,
  });
}

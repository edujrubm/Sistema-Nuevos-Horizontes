import { apiRequest } from "@/shared/api/http-client";

export interface BeneficiarySummary {
  id: string;
  nombre: string;
  fechaNacimiento?: string | null;
  cuiEnmascarado?: string | null;
}

export interface BeneficiariesResponse {
  data: BeneficiarySummary[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface BeneficiaryDetail extends BeneficiarySummary {
  alfabetismo?: boolean | null;
  enfermedadPermanente?: boolean | null;
  nombreEnfermedad?: string | null;
  tipoTratamiento?: string | null;
  otrosPadecimientos?: string | null;
  version: number;
  expediente: {
    id: string;
    activo: boolean;
    version: number;
    motivoInactivacion?: string | null;
  } | null;
  fichaInicial: {
    id: string;
    correlativo?: string | null;
    lugar?: string | null;
    fecha?: string | null;
    estado: "BORRADOR" | "CONFIRMADA";
    version: number;
    actualizadoEn?: string;
  } | null;
}

export interface BeneficiaryChild {
  id: string;
  nombre: string;
  cuiEnmascarado?: string | null;
  fechaNacimiento?: string | null;
  reconocido?: boolean | null;
  genero?: string | null;
  activo: boolean;
  version: number;
}

export function listBeneficiaries(search: string, cursor?: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ limite: "20" });
  if (search.trim()) query.set("nombre", search.trim());
  if (cursor) query.set("cursor", cursor);
  return apiRequest<BeneficiariesResponse>(`/beneficiarias?${query}`, { signal });
}

export function getBeneficiary(id: string, signal?: AbortSignal) {
  return apiRequest<BeneficiaryDetail>(`/beneficiarias/${id}`, { signal });
}

export function listBeneficiaryChildren(id: string, signal?: AbortSignal) {
  return apiRequest<{ data: BeneficiaryChild[] }>(`/beneficiarias/${id}/hijos`, { signal });
}

export function searchBeneficiaryMatches(cui: string, signal?: AbortSignal) {
  return apiRequest<{ data: BeneficiarySummary[] }>("/beneficiarias/buscar-coincidencias", {
    method: "POST",
    body: JSON.stringify({ cui }),
    signal,
  });
}

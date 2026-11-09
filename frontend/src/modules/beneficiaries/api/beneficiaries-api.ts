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
  paisOrigenId?: string | null;
  departamentoOrigenId?: string | null;
  municipioOrigenId?: string | null;
  ocupacionId?: string | null;
  residencia?: {
    id: string;
    direccionActual?: string | null;
    numeroCasa?: string | null;
    telefonoCelular?: string | null;
    direccionAlternativa?: string | null;
    personaEnlace?: string | null;
    relacionPersonaEnlace?: string | null;
    urbano?: boolean | null;
    paisResidenciaId?: string | null;
    departamentoResidenciaId?: string | null;
    municipioResidenciaId?: string | null;
    areaResidencial?: {
      colonia?: string | null;
      barrioPopular?: string | null;
      asentamiento?: string | null;
      zona?: string | null;
      aldea?: string | null;
      caserio?: string | null;
      canton?: string | null;
      otro?: string | null;
    } | null;
  } | null;
  lugarOcupacion?: {
    id: string;
    nombre?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    personaContacto?: string | null;
    cargoPersonaContacto?: string | null;
  } | null;
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

export interface BeneficiaryHistoryItem {
  id: string;
  recurso: string;
  operacion: string;
  motivo: string | null;
  registradoEn: string;
}

export interface UpdateBeneficiaryInput {
  nombre?: string;
  fechaNacimiento?: string;
  alfabetismo?: boolean;
  enfermedadPermanente?: boolean;
  nombreEnfermedad?: string;
  tipoTratamiento?: string;
  otrosPadecimientos?: string;
  residencia?: {
    direccionActual?: string;
    numeroCasa?: string;
    telefonoCelular?: string;
    direccionAlternativa?: string;
    personaEnlace?: string;
    relacionPersonaEnlace?: string;
    urbano?: boolean;
    paisResidenciaId?: string;
    departamentoResidenciaId?: string;
    municipioResidenciaId?: string;
    areaResidencial?: {
      colonia?: string; barrioPopular?: string; asentamiento?: string; zona?: string;
      aldea?: string; caserio?: string; canton?: string; otro?: string;
    };
  };
  lugarOcupacion?: {
    nombre?: string;
    direccion?: string;
    telefono?: string;
    personaContacto?: string;
    cargoPersonaContacto?: string;
  };
  version: number;
  motivo: string;
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

export function searchBeneficiaryMatches(filters: { cui?: string; nombre?: string }, signal?: AbortSignal) {
  return apiRequest<{ data: BeneficiarySummary[] }>("/beneficiarias/buscar-coincidencias", {
    method: "POST",
    body: JSON.stringify(filters),
    signal,
  });
}

export function updateBeneficiary(id: string, input: UpdateBeneficiaryInput) {
  return apiRequest<{ data: BeneficiarySummary & { version: number } }>(`/beneficiarias/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changeBeneficiaryStatus(id: string, active: boolean, version: number, reason: string) {
  return apiRequest<{ data: { id: string; activo: boolean; version: number } }>(
    `/beneficiarias/${id}/${active ? "reactivar" : "inactivar"}`,
    { method: "POST", body: JSON.stringify({ version, motivo: reason }) },
  );
}

export function getBeneficiaryHistory(id: string, signal?: AbortSignal) {
  return apiRequest<{ data: BeneficiaryHistoryItem[] }>(`/beneficiarias/${id}/historial`, { signal });
}

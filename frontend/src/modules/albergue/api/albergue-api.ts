import { apiRequest } from "@/shared/api/http-client";

export interface ShelterSummary {
  estanciasActivas: number;
  beneficiariasPresentes: number;
  salidasTemporalesPendientes: number;
  egresosRegistrados: number;
}

export interface ShelterStay {
  id: string;
  beneficiariaId: string;
  fechaIngreso: string;
  fechaEgreso: string | null;
  estadoAlbergueId: string | null;
}

export interface ShelterStaysResponse {
  datos: ShelterStay[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

export function getShelterSummary(signal?: AbortSignal) {
  return apiRequest<ShelterSummary>("/albergue/resumen", { signal });
}

export function listShelterStays(signal?: AbortSignal) {
  return apiRequest<ShelterStaysResponse>("/albergue/estancias?pagina=1&limite=20", {
    signal,
  });
}

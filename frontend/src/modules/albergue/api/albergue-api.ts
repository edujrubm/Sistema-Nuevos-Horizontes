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

export interface CreateShelterStayInput {
  beneficiariaId: string;
}

export interface CreateTemporaryExitInput {
  destino: string;
  trabajadorAsignado?: string;
}

export interface PendingTemporaryExit {
  movimientoId: string;
  estanciaId: string;
  beneficiariaId: string;
  beneficiariaNombre: string;
  fechaSalida: string;
  destino: string;
  trabajadorAsignado: string | null;
}

export interface CreateShelterBirthInput {
  nombre: string;
  fechaNacimiento: string;
  cui?: string;
  genero?: "M" | "F";
  reconocido?: boolean;
}

export interface ShelterMovement {
  movimientoId: string;
  estanciaId: string;
  beneficiariaId: string;
  beneficiariaNombre: string;
  fechaSalida: string;
  fechaRetorno: string | null;
  destino: string;
  trabajadorAsignado: string | null;
  estadoMovimiento: "PENDIENTE" | "COMPLETADO";
}

export interface ShelterMovementsResponse {
  datos: ShelterMovement[];
  paginacion: { pagina: number; limite: number; total: number; totalPaginas: number };
}

export function getShelterSummary(signal?: AbortSignal) {
  return apiRequest<ShelterSummary>("/albergue/resumen", { signal });
}

export function listShelterStays(signal?: AbortSignal) {
  return apiRequest<ShelterStaysResponse>("/albergue/estancias?pagina=1&limite=20", {
    signal,
  });
}

export function createShelterStay(input: CreateShelterStayInput) {
  return apiRequest<ShelterStay>("/albergue/estancias", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTemporaryExit(estanciaId: string, input: CreateTemporaryExitInput) {
  return apiRequest(`/albergue/estancias/${estanciaId}/salidas-temporales`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listPendingTemporaryExits(signal?: AbortSignal) {
  return apiRequest<PendingTemporaryExit[]>("/albergue/salidas-temporales/pendientes", { signal });
}

export function registerShelterReturn(estanciaId: string) {
  return apiRequest(`/albergue/estancias/${estanciaId}/retornos`, { method: "POST" });
}

export function closeShelterStay(estanciaId: string) {
  return apiRequest(`/albergue/estancias/${estanciaId}/egreso`, { method: "POST" });
}

export function registerShelterBirth(estanciaId: string, input: CreateShelterBirthInput) {
  return apiRequest(`/albergue/estancias/${estanciaId}/nacimientos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listShelterMovements(signal?: AbortSignal) {
  return apiRequest<ShelterMovementsResponse>("/albergue/movimientos?pagina=1&limite=20", { signal });
}

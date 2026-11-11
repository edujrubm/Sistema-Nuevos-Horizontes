import { apiRequest } from "@/shared/api/http-client";

export interface ShelterSummary {
  estanciasActivas: number;
  beneficiariasPresentes: number;
  salidasTemporalesPendientes: number;
  egresosRegistrados: number;
  menoresActivos?: number;
  personasActivas?: number;
}

export interface ShelterStay {
  id: string;
  beneficiariaId: string;
  beneficiariaNombre?: string;
  salidaPendiente?: boolean;
  menoresActivos?: number;
  acompanantes?: { id: string; nombre: string }[];
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
  ninoIds?: string[];
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

export interface StayFilters {
  pagina?: number;
  estado?: string;
  presencia?: string;
  buscar?: string;
}
export function listShelterStays(
  signal?: AbortSignal,
  filters: StayFilters = {},
) {
  const q = new URLSearchParams({
    pagina: String(filters.pagina || 1),
    limite: "20",
    estado: filters.estado || "ACTIVAS",
  });
  if (filters.presencia) q.set("presencia", filters.presencia);
  if (filters.buscar?.trim())
    return apiRequest<ShelterStaysResponse>("/albergue/estancias/buscar", {
      method: "POST",
      body: JSON.stringify({
        pagina: filters.pagina || 1,
        limite: 20,
        estado: filters.estado || "ACTIVAS",
        presencia: filters.presencia || "TODOS",
        buscar: filters.buscar.trim(),
      }),
      signal,
    });
  return apiRequest<ShelterStaysResponse>(`/albergue/estancias?${q}`, {
    signal,
  });
}
// Selectores operativos: recuperar todas las páginas, no truncar silenciosamente a 20.
export async function listAllActiveStays(signal?: AbortSignal) {
  let pagina = 1,
    datos: ShelterStay[] = [];
  for (;;) {
    const r = await listShelterStays(signal, { pagina, estado: "ACTIVAS" });
    datos = datos.concat(r.datos);
    if (pagina >= r.paginacion.totalPaginas) return { ...r, datos };
    pagina++;
  }
}

export function createShelterStay(input: CreateShelterStayInput) {
  return apiRequest<ShelterStay>("/albergue/estancias", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTemporaryExit(
  estanciaId: string,
  input: CreateTemporaryExitInput,
) {
  return apiRequest(`/albergue/estancias/${estanciaId}/salidas-temporales`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listPendingTemporaryExits(signal?: AbortSignal) {
  return apiRequest<PendingTemporaryExit[]>(
    "/albergue/salidas-temporales/pendientes",
    { signal },
  );
}

export function registerShelterReturn(estanciaId: string) {
  return apiRequest(`/albergue/estancias/${estanciaId}/retornos`, {
    method: "POST",
  });
}

export function closeShelterStay(estanciaId: string, motivo: string) {
  return apiRequest(`/albergue/estancias/${estanciaId}/egreso`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export function registerShelterBirth(
  estanciaId: string,
  input: CreateShelterBirthInput,
) {
  return apiRequest(`/albergue/estancias/${estanciaId}/nacimientos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listShelterMovements(signal?: AbortSignal) {
  return apiRequest<ShelterMovementsResponse>(
    "/albergue/movimientos?pagina=1&limite=20",
    { signal },
  );
}

export interface ShelterEvent {
  id: string;
  estanciaId: string;
  tipo: string;
  fecha: string;
  motivo: string;
  responsable: string;
  beneficiariaNombre: string;
}
export function listShelterHistory(
  filters: { pagina: number; tipo: string; desde: string; hasta: string },
  signal?: AbortSignal,
) {
  const q = new URLSearchParams({
    pagina: String(filters.pagina),
    limite: "20",
  });
  if (filters.tipo) q.set("tipo", filters.tipo);
  if (filters.desde) q.set("desde", filters.desde);
  if (filters.hasta) q.set("hasta", filters.hasta);
  return apiRequest<{
    datos: ShelterEvent[];
    paginacion: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  }>(`/albergue/historial?${q}`, { signal });
}

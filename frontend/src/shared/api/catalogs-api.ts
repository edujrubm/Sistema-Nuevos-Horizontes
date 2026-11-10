import { apiRequest } from "./http-client";

export interface CatalogOption {
  id: string;
  nombre: string | null;
}

interface CatalogResponse<T extends CatalogOption = CatalogOption> {
  data: T[];
}

export function getCountries(signal?: AbortSignal) {
  return apiRequest<CatalogResponse>("/catalogos/paises", { signal });
}

export function getDepartments(countryId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ paisId: countryId });
  return apiRequest<CatalogResponse<CatalogOption & { paisId: string }>>(`/catalogos/departamentos?${query}`, { signal });
}

export function getMunicipalities(departmentId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ departamentoId: departmentId });
  return apiRequest<CatalogResponse<CatalogOption & { departamentoId: string }>>(`/catalogos/municipios?${query}`, { signal });
}

export function getCatalog(type: string, signal?: AbortSignal) {
  return apiRequest<CatalogResponse>(`/catalogos/${type}`, { signal });
}

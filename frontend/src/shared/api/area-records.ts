import { apiRequest, areaRequestOptions } from "./http-client";

import type { Ficha, Hijo, Entrada, Revision, Pagina } from "../types/api";
export const api = {
  beneficiarias: (nombre: string, cursor: string, signal?: AbortSignal) =>
    apiRequest<{
      data: { id: string; nombre: string; cuiEnmascarado: string | null }[];
      page: { hasMore: boolean; nextCursor: string | null };
    }>(
      `/beneficiarias?${new URLSearchParams({ limite: "25", ...(nombre ? { nombre } : {}), ...(cursor ? { cursor } : {}) })}`,
      { signal },
      areaRequestOptions,
    ),
  beneficiaria: (id: string, signal?: AbortSignal) =>
    apiRequest<{
      id: string;
      nombre: string;
      cuiEnmascarado: string | null;
      fechaNacimiento: string | null;
      ocupacionId: string | null;
      estadoCivilId: string | null;
      residencia: Record<string, unknown> | null;
      fichaInicial: { id: string; correlativo: string | null } | null;
    }>(`/beneficiarias/${id}`, { signal }, areaRequestOptions),
  fichas: (id: string, area: string, pagina = 1, signal?: AbortSignal) =>
    apiRequest<Pagina<Ficha>>(
      `/${area}/beneficiarias/${id}/fichas?pagina=${pagina}`,
      { signal },
      areaRequestOptions,
    ),
  resumen: (id: string, signal?: AbortSignal) =>
    apiRequest<Record<string, unknown>>(
      `/trabajo-social/beneficiarias/${id}/resumen`,
      { signal },
      areaRequestOptions,
    ),
  hijos: (id: string, pagina = 1, signal?: AbortSignal) =>
    apiRequest<Pagina<Hijo>>(
      `/guarderia/beneficiarias/${id}/hijos?pagina=${pagina}`,
      { signal },
      areaRequestOptions,
    ),
  infantiles: (id: string, pagina = 1, signal?: AbortSignal) =>
    apiRequest<Pagina<Ficha>>(
      `/guarderia/hijos/${id}/fichas?pagina=${pagina}`,
      { signal },
      areaRequestOptions,
    ),
  ficha: async (id: string, signal?: AbortSignal) =>
    (
      await apiRequest<{ data: Ficha }>(
        `/formularios-area/${id}`,
        { signal },
        areaRequestOptions,
      )
    ).data,
  crearFicha: async (id: string, body: unknown) =>
    (
      await apiRequest<{ data: Ficha }>(
        `/beneficiarias/${id}/formularios-area`,
        { method: "POST", body: JSON.stringify(body) },
        areaRequestOptions,
      )
    ).data,
  guardarFicha: async (id: string, body: unknown) =>
    (
      await apiRequest<{ data: Ficha }>(
        `/formularios-area/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        areaRequestOptions,
      )
    ).data,
  confirmarFicha: async (id: string, body: unknown) =>
    (
      await apiRequest<{ data: Ficha }>(
        `/formularios-area/${id}/confirmar`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        areaRequestOptions,
      )
    ).data,
  referencias: (id: string, pagina = 1, signal?: AbortSignal) =>
    apiRequest<Pagina<Ficha>>(
      `/legal/beneficiarias/${id}/referencias?pagina=${pagina}`,
      { signal },
      areaRequestOptions,
    ),
  referencia: (id: string, signal?: AbortSignal) =>
    apiRequest<Ficha>(
      `/legal/referencias/${id}`,
      { signal },
      areaRequestOptions,
    ),
  crearReferencia: (id: string, body: unknown) =>
    apiRequest<Ficha>(
      `/legal/beneficiarias/${id}/referencias`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      areaRequestOptions,
    ),
  guardarReferencia: (id: string, body: unknown) =>
    apiRequest<Ficha>(
      `/legal/referencias/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      areaRequestOptions,
    ),
  confirmarReferencia: (id: string, body: unknown) =>
    apiRequest<Ficha>(
      `/legal/referencias/${id}/confirmar`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      areaRequestOptions,
    ),
  evolucion: (id: string, filtro: string, signal?: AbortSignal) =>
    apiRequest<Pagina<Entrada>>(
      `/beneficiarias/${id}/hoja-evolutiva?${filtro}`,
      { signal },
      areaRequestOptions,
    ),
  crearEntrada: (id: string, body: unknown) =>
    apiRequest<Entrada>(
      `/beneficiarias/${id}/hoja-evolutiva`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      areaRequestOptions,
    ),
  corregirEntrada: (id: string, body: unknown) =>
    apiRequest<Entrada>(
      `/entradas-evolutivas/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      areaRequestOptions,
    ),
  revisiones: (id: string, pagina = 1, signal?: AbortSignal) =>
    apiRequest<Pagina<Revision>>(
      `/entradas-evolutivas/${id}/revisiones?pagina=${pagina}`,
      { signal },
      areaRequestOptions,
    ),
};

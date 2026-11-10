import { http } from "./http";
import type { Ficha, Hijo, Entrada, Revision, Pagina } from "../types/api";
export const api = {
  beneficiarias: (nombre: string, cursor: string, signal?: AbortSignal) =>
    http<{
      data: { id: string; nombre: string; cuiEnmascarado: string | null }[];
      page: { hasMore: boolean; nextCursor: string | null };
    }>(
      `/beneficiarias?${new URLSearchParams({ limite: "25", ...(nombre ? { nombre } : {}), ...(cursor ? { cursor } : {}) })}`,
      { signal },
    ),
  beneficiaria: (id: string, signal?: AbortSignal) =>
    http<{
      id: string;
      nombre: string;
      cuiEnmascarado: string | null;
      fechaNacimiento: string | null;
      ocupacionId: string | null;
      estadoCivilId: string | null;
      residencia: Record<string, unknown> | null;
      fichaInicial: { id: string; correlativo: string | null } | null;
    }>(`/beneficiarias/${id}`, { signal }),
  fichas: (id: string, area: string, pagina = 1, signal?: AbortSignal) =>
    http<Pagina<Ficha>>(
      `/${area}/beneficiarias/${id}/fichas?pagina=${pagina}`,
      { signal },
    ),
  resumen: (id: string, signal?: AbortSignal) =>
    http<Record<string, unknown>>(
      `/trabajo-social/beneficiarias/${id}/resumen`,
      { signal },
    ),
  hijos: (id: string, pagina = 1, signal?: AbortSignal) =>
    http<Pagina<Hijo>>(
      `/guarderia/beneficiarias/${id}/hijos?pagina=${pagina}`,
      { signal },
    ),
  infantiles: (id: string, pagina = 1, signal?: AbortSignal) =>
    http<Pagina<Ficha>>(`/guarderia/hijos/${id}/fichas?pagina=${pagina}`, {
      signal,
    }),
  ficha: async (id: string, signal?: AbortSignal) =>
    (await http<{ data: Ficha }>(`/formularios-area/${id}`, { signal })).data,
  crearFicha: async (id: string, body: unknown) =>
    (
      await http<{ data: Ficha }>(`/beneficiarias/${id}/formularios-area`, {
        method: "POST",
        body,
      })
    ).data,
  guardarFicha: async (id: string, body: unknown) =>
    (
      await http<{ data: Ficha }>(`/formularios-area/${id}`, {
        method: "PATCH",
        body,
      })
    ).data,
  confirmarFicha: async (id: string, body: unknown) =>
    (
      await http<{ data: Ficha }>(`/formularios-area/${id}/confirmar`, {
        method: "POST",
        body,
      })
    ).data,
  referencias: (id: string, pagina = 1, signal?: AbortSignal) =>
    http<Pagina<Ficha>>(
      `/legal/beneficiarias/${id}/referencias?pagina=${pagina}`,
      { signal },
    ),
  referencia: (id: string, signal?: AbortSignal) =>
    http<Ficha>(`/legal/referencias/${id}`, { signal }),
  crearReferencia: (id: string, body: unknown) =>
    http<Ficha>(`/legal/beneficiarias/${id}/referencias`, {
      method: "POST",
      body,
    }),
  guardarReferencia: (id: string, body: unknown) =>
    http<Ficha>(`/legal/referencias/${id}`, { method: "PATCH", body }),
  confirmarReferencia: (id: string, body: unknown) =>
    http<Ficha>(`/legal/referencias/${id}/confirmar`, { method: "POST", body }),
  evolucion: (id: string, filtro: string, signal?: AbortSignal) =>
    http<Pagina<Entrada>>(`/beneficiarias/${id}/hoja-evolutiva?${filtro}`, {
      signal,
    }),
  crearEntrada: (id: string, body: unknown) =>
    http<Entrada>(`/beneficiarias/${id}/hoja-evolutiva`, {
      method: "POST",
      body,
    }),
  corregirEntrada: (id: string, body: unknown) =>
    http<Entrada>(`/entradas-evolutivas/${id}`, { method: "PATCH", body }),
  revisiones: (id: string, pagina = 1, signal?: AbortSignal) =>
    http<Pagina<Revision>>(
      `/entradas-evolutivas/${id}/revisiones?pagina=${pagina}`,
      { signal },
    ),
};

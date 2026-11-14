import { ApiError } from "@/shared/api/api-error";
import { apiRequest, areaRequestOptions } from "@/shared/api/http-client";
import { api as records } from "@/shared/api/area-records";

import type { Ficha, Pagina } from "@/shared/types/api";

export interface GuarderiaChild {
  ninoId: string;
  nombre: string;
  inscrito: boolean;
  fechaNac: string | null;
  expedienteId: string;
}
export interface CatalogOption {
  id: string;
  nombre: string | null;
}
const noEncontrado = () =>
  new ApiError({
    estado: 404,
    codigo: "REGISTRO_NO_ENCONTRADO",
    mensaje: "No se encontró la ficha o el niño en este expediente.",
    errores: [],
    idSolicitud: "no-disponible",
  });

export const guarderiaApi = {
  children: (id: string, page: number, signal?: AbortSignal) =>
    apiRequest<Pagina<GuarderiaChild>>(
      `/guarderia/beneficiarias/${id}/hijos?pagina=${page}`,
      { signal },
      areaRequestOptions,
    ),
  list: async (
    beneficiaryId: string,
    childId: string,
    page: number,
    childrenPage: number,
    signal?: AbortSignal,
  ) => {
    const children = await guarderiaApi.children(
      beneficiaryId,
      childrenPage,
      signal,
    );
    const child = children.datos.find((n) => n.ninoId === childId);
    if (!child?.inscrito) throw noEncontrado();
    return { ...(await records.infantiles(childId, page, signal)), child };
  },
  get: async (id: string, beneficiaryId: string, signal?: AbortSignal) => {
    const [result, person] = await Promise.all([
      apiRequest<{ data: Ficha & { expedienteId: string } }>(
        `/formularios-area/${id}`,
        { signal },
        areaRequestOptions,
      ),
      apiRequest<{ expediente: { id: string } | null }>(
        `/beneficiarias/${beneficiaryId}`,
        { signal },
        areaRequestOptions,
      ),
    ]);
    if (
      result.data.tipo !== "GUARDERIA" ||
      !result.data.ninoId ||
      result.data.expedienteId !== person.expediente?.id
    )
      throw noEncontrado();
    return result.data;
  },
  catalogs: async (signal?: AbortSignal) => {
    const [etnias, escolaridades] = await Promise.all([
      apiRequest<{ data: CatalogOption[] }>(
        "/catalogos/etnias",
        { signal },
        areaRequestOptions,
      ),
      apiRequest<{ data: CatalogOption[] }>(
        "/catalogos/niveles-estudio",
        {
          signal,
        },
        areaRequestOptions,
      ),
    ]);
    return { etnias: etnias.data, escolaridades: escolaridades.data };
  },
  maternalCatalog: async (
    tipo: "estados-civiles" | "ocupaciones",
    signal?: AbortSignal,
  ) =>
    (
      await apiRequest<{ data: CatalogOption[] }>(
        `/catalogos/${tipo}`,
        {
          signal,
        },
        areaRequestOptions,
      )
    ).data,
  create: (
    id: string,
    input: {
      ninoId: string;
      fechaAtencion: string;
      profesionalId: string;
      detalle: Record<string, unknown>;
    },
  ) => records.crearFicha(id, { ...input, tipo: "GUARDERIA" }),
  save: (
    id: string,
    version: number,
    detalle: Record<string, unknown>,
    fechaAtencion: string,
    profesionalId: string,
  ) =>
    records.guardarFicha(id, {
      version,
      motivo: "Guardado de borrador",
      detalle,
      fechaAtencion,
      profesionalId,
    }),
  confirm: (id: string, version: number) =>
    records.confirmarFicha(id, {
      version,
      motivo: "Confirmación inicial de ficha",
    }),
  discard: (id: string, version: number, motivo: string) =>
    apiRequest<{ data: Ficha }>(
      `/formularios-area/${id}/descartar`,
      {
        method: "POST",
        body: JSON.stringify({ version, motivo }),
      },
      areaRequestOptions,
    ),
};

export function childrenPage(value: string | null) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

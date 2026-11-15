import { ApiError } from "@/shared/api/api-error";
import { apiRequest, areaRequestOptions } from "@/shared/api/http-client";
import { api as records } from "@/shared/api/area-records";

import type { Ficha } from "@/shared/types/api";

export const socialApi = {
  list: (id: string, page: number, signal: AbortSignal) =>
    records.fichas(id, "trabajo-social", page, signal),
  summary: (id: string, signal: AbortSignal) =>
    apiRequest<{ totalFichas: number; totalRiesgos: number | null }>(
      `/trabajo-social/beneficiarias/${id}/resumen`,
      { signal },
      areaRequestOptions,
    ),
  get: async (id: string, signal: AbortSignal, beneficiaryId: string) => {
    const form = await records.ficha(id, signal);
    if (form.tipo !== "SOCIAL")
      throw new ApiError({
        estado: 404,
        codigo: "REGISTRO_NO_ENCONTRADO",
        mensaje: "No se encontró la ficha social solicitada.",
        errores: [],
        idSolicitud: "no-disponible",
      });
    // Protege la cabecera del cliente; la autorización definitiva corresponde al servidor.
    const expedienteId = (form as Ficha & { expedienteId?: string })
      .expedienteId;
    if (
      !expedienteId ||
      expedienteId !==
        (
          await apiRequest<{ expediente: { id: string } | null }>(
            `/beneficiarias/${beneficiaryId}`,
            { signal },
            areaRequestOptions,
          )
        ).expediente?.id
    )
      throw new ApiError({
        estado: 404,
        codigo: "REGISTRO_NO_ENCONTRADO",
        mensaje: "No se encontró la ficha social solicitada.",
        errores: [],
        idSolicitud: "no-disponible",
      });
    return form;
  },
  create: (
    id: string,
    input: {
      fechaAtencion: string;
      profesionalId: string;
      detalle: Record<string, unknown>;
    },
  ) => records.crearFicha(id, { ...input, tipo: "SOCIAL" }),
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

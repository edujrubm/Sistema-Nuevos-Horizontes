import { api as records } from "@/shared/api/area-records";
import { ApiError, http } from "@/shared/api/http";
import type { Ficha } from "@/shared/types/api";

export const socialApi = {
  list: (id: string, page: number, signal: AbortSignal) =>
    records.fichas(id, "trabajo-social", page, signal),
  summary: (id: string, signal: AbortSignal) =>
    http<{ totalFichas: number; totalRiesgos: number | null }>(
      `/trabajo-social/beneficiarias/${id}/resumen`,
      { signal },
    ),
  get: async (id: string, signal: AbortSignal) => {
    const form = await records.ficha(id, signal);
    if (form.tipo !== "SOCIAL")
      throw new ApiError(
        404,
        "REGISTRO_NO_ENCONTRADO",
        "No se encontró la ficha social solicitada.",
      );
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
    http<{ data: Ficha }>(`/formularios-area/${id}/descartar`, {
      method: "POST",
      body: { version, motivo },
    }),
};

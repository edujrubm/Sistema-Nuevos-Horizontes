import { api as records } from "@/shared/api/area-records";
import { http, ApiError } from "@/shared/api/http";
import type { Ficha } from "@/shared/types/api";

export interface LegalDraft {
  fechaAtencion: string;
  profesionalId: string;
  detalle: Record<string, unknown>;
}
export const legalApi = {
  list: (id: string, reference: boolean, page: number, signal: AbortSignal) =>
    reference
      ? records.referencias(id, page, signal)
      : records.fichas(id, "legal", page, signal),
  get: async (id: string, reference: boolean, signal: AbortSignal) => {
    const form = reference
      ? await records.referencia(id, signal)
      : await records.ficha(id, signal);
    if (form.tipo !== (reference ? "REFERENCIA_LEGAL" : "LEGAL"))
      throw new ApiError(
        404,
        "REGISTRO_NO_ENCONTRADO",
        "No se encontró el registro solicitado.",
      );
    return form;
  },
  create: (id: string, reference: boolean, input: LegalDraft) =>
    reference
      ? records.crearReferencia(id, input)
      : records.crearFicha(id, { ...input, tipo: "LEGAL" }),
  save: (
    id: string,
    reference: boolean,
    version: number,
    reason: string,
    detalle: Record<string, unknown>,
  ) =>
    reference
      ? records.guardarReferencia(id, { version, motivo: reason, detalle })
      : records.guardarFicha(id, { version, motivo: reason, detalle }),
  confirm: (id: string, reference: boolean, version: number) =>
    reference
      ? records.confirmarReferencia(id, {
          version,
          motivo: "Confirmación inicial de ficha",
        })
      : records.confirmarFicha(id, {
          version,
          motivo: "Confirmación inicial de ficha",
        }),
  discard: (id: string, version: number, reason: string) =>
    http<{ data: Ficha }>(`/formularios-area/${id}/descartar`, {
      method: "POST",
      body: { version, motivo: reason },
    }),
};

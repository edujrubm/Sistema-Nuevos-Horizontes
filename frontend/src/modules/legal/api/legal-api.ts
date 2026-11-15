import { ApiError } from "@/shared/api/api-error";
import { apiRequest, areaRequestOptions } from "@/shared/api/http-client";
import { api as records } from "@/shared/api/area-records";

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
  get: async (
    id: string,
    reference: boolean,
    signal: AbortSignal,
    beneficiaryId: string,
  ) => {
    const form = reference
      ? await records.referencia(id, signal)
      : await records.ficha(id, signal);
    if (form.tipo !== (reference ? "REFERENCIA_LEGAL" : "LEGAL"))
      throw new ApiError({
        estado: 404,
        codigo: "REGISTRO_NO_ENCONTRADO",
        mensaje: "No se encontró el registro solicitado.",
        errores: [],
        idSolicitud: "no-disponible",
      });
    // No presenta contenido de otro expediente bajo la cabecera de esta beneficiaria.
    // Es una protección del cliente; no sustituye autorización en el servidor.
    const expedienteId = (form as Ficha & { expedienteId?: string })
      .expedienteId;
    const owned = reference
      ? Boolean(beneficiaryId) &&
        (form as Ficha & { beneficiariaId?: string }).beneficiariaId ===
          beneficiaryId
      : Boolean(expedienteId) &&
        expedienteId ===
          (
            await apiRequest<{ expediente: { id: string } | null }>(
              `/beneficiarias/${beneficiaryId}`,
              { signal },
              areaRequestOptions,
            )
          ).expediente?.id;
    if (!owned)
      throw new ApiError({
        estado: 404,
        codigo: "REGISTRO_NO_ENCONTRADO",
        mensaje: "No se encontró el registro solicitado.",
        errores: [],
        idSolicitud: "no-disponible",
      });
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
    apiRequest<{ data: Ficha }>(
      `/formularios-area/${id}/descartar`,
      {
        method: "POST",
        body: JSON.stringify({ version, motivo: reason }),
      },
      areaRequestOptions,
    ),
};

import type { Ficha } from "@/shared/types/api";
import type { AreaForm } from "../api/area-forms-api";

/** Sólo transforma la representación; no determina permisos, estados ni reglas de persistencia. */
export function asAreaForm(record: Ficha, area: string): AreaForm {
  return {
    expedienteId: "",
    areaId: "",
    capturadoPor: "",
    actualizadoEn: "",
    examenMental: null,
    ...record,
    area,
    ninoId: record.ninoId ?? null,
    estado: record.estadoCodigo ?? record.estado ?? "",
    creadoEn: record.creadoEn ?? "",
  };
}

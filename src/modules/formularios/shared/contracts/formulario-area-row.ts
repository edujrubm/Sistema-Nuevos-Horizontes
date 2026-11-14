import type { CodigoTipoFormulario } from "../formulario-tipos";

/** Representación común de un formulario con su detalle de área. */
export interface FormularioAreaRow {
  id: string;
  expedienteId: string;
  ninoId: string | null;
  areaId: string;
  area: string | null;
  tipo: CodigoTipoFormulario;
  estado: string;
  fechaAtencion: Date;
  profesionalId: string;
  capturadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
  version: number;
  detalle: Record<string, unknown>;
  examenMental: Record<string, unknown> | null;
}

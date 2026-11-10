export type TipoFichaMedica =
  'MEDICINA_NINEZ' | 'MEDICINA_ADOLESCENTE' | 'MEDICINA_MUJER';

/** Identificación mínima usada para comprobar la existencia de una beneficiaria. */
export interface ResumenBeneficiariaMedicina {
  id: string;
  expedienteId: string;
  nombre: string;
  cui: string | null;
  fechaNacimiento: string | null;
}

/** Identificación infantil y vínculo con la beneficiaria responsable. */
export interface ResumenHijoMedicina {
  id: string;
  expedienteId: string;
  nombre: string | null;
  cui: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  beneficiaria: {
    id: string;
    nombre: string;
  };
}

/** Representación completa de una atención médica, con detalle discriminado por tipo. */
export interface FichaMedica {
  id: string;
  tipo: TipoFichaMedica;
  estado: string;
  fechaAtencion: string;
  edadAlAtender: number | null;
  version: number;
  identidadAlAtender: Record<string, unknown>;
  firmaDocumentoId: string | null;
  profesional: {
    id: string;
    nombre: string;
  };
  capturadoPor: {
    id: string;
    nombre: string;
  };
  creadoEn: string;
  actualizadoEn: string;
  datosGenerales: Record<string, unknown> | null;
  familiaresDeclarados: Record<string, unknown>[];
  detalle: Record<string, unknown>;
}

/** Contrato paginado utilizado por ambos listados de Medicina. */
export interface ListadoFichasMedicina {
  data: FichaMedica[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

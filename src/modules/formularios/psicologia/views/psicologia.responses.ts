export interface ResumenBeneficiaria {
  id: string;
  expedienteId: string;
  nombre: string;
  cui: string | null;
  fechaNacimiento: string | null;
}

export interface ResumenHijo {
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

export interface FichaPsicologica {
  id: string;
  tipo: 'PSICOLOGIA_MUJER' | 'PSICOLOGIA_NINEZ';
  estado: string;
  fechaAtencion: string;
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
  examenMental: Record<string, unknown> | null;
}

export interface ListadoFichasPsicologia {
  data: FichaPsicologica[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface Pagina<T> {
  datos: T[];
  pagina: number;
  limite: number;
  total: number;
}
export interface Ficha {
  id: string;
  tipo: string;
  estado?: string;
  estadoCodigo?: string;
  version: number;
  fechaAtencion: string;
  profesionalId: string;
  creadoEn?: string;
  identidadAlAtender?: { edad_a_la_atencion?: number | null };
  ninoId?: string | null;
  detalle: Record<string, unknown>;
}
export interface Hijo {
  ninoId: string;
  nombre: string;
  inscrito: boolean;
}
export interface Entrada {
  id: string;
  formularioId: string;
  accion: string;
  contenido: string;
  fechaAtencion: string;
  profesionalId: string;
  profesionalNombre?: string;
  version: number;
  planSeguimiento?: string;
  resultado?: string;
  registradoEn?: string;
}
export interface Revision {
  id: string;
  operacion: string;
  fecha?: string;
  registradoEn?: string;
  motivo: string;
  autor: { usuarioId: string; nombre?: string };
  cambios: { campo: string; antes: unknown; despues: unknown }[];
}
export interface Capacidades {
  crearFicha: boolean;
  editarFicha: boolean;
  confirmarFicha: boolean;
  crearReferencia: boolean;
  corregirReferencia: boolean;
  crearEvolucion: boolean;
  corregirEvolucion: boolean;
  verRevisiones: boolean;
}
export const soloLectura: Capacidades = {
  crearFicha: false,
  editarFicha: false,
  confirmarFicha: false,
  crearReferencia: false,
  corregirReferencia: false,
  crearEvolucion: false,
  corregirEvolucion: false,
  verRevisiones: false,
};

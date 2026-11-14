import type { EntradaReciente } from "../../../evolucion/lectura";
import type { FichaSocial } from "../entities/ficha-social.entity";

/** Representación de lectura; no expone el CUI completo ni la identidad de la cabecera. */
export interface ResumenSocialDto {
  beneficiariaId: string;
  expedienteId: string;
  totalFichas: number;
  ultimaAtencion: Date | null;
  beneficiaria: {
    id: string;
    nombre: string;
    fechaNac: Date | null;
    cuiProtegido: string | null;
    edadCalculada: number | null;
  };
  ultimaFicha: (Omit<FichaSocial, "formularioId"> & {
    id: string;
    estadoCodigo: string;
    fechaAtencion: Date;
    actualizadoEn: Date;
    version: number;
    profesionalId: string;
    profesionalNombre: string;
    detalle: Omit<FichaSocial, "formularioId">;
  }) | null;
  historialReciente: EntradaReciente[];
  camposSinSoporte: string[];
  totalRiesgos: null;
}

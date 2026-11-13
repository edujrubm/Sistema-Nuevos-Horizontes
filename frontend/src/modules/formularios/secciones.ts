import { socialSections } from "../social";
export interface Seccion {
  titulo: string;
  tarjeta: string;
  campos: string[];
}
export const secciones: Record<string, Seccion[]> = {
  SOCIAL: socialSections,
  LEGAL: [
    {
      titulo: "Partes y fecha",
      tarjeta: "Partes",
      campos: ["demandadoNombreDeclarado", "relacionPartes", "numeroJuicio"],
    },
    {
      titulo: "Diagnóstico y plan",
      tarjeta: "Diagnóstico jurídico y plan legal",
      campos: [
        "diagnosticoJuridico",
        "normativaAplicable",
        "objetivoLegal",
        "planTratamiento",
        "referencia",
      ],
    },
    {
      titulo: "Proceso judicial",
      tarjeta: "Proceso y actuaciones",
      campos: [
        "inicioProcesoFecha",
        "inicioProcesoDescripcion",
        "juzgado",
        "tipoJuicio",
        "juezOficial",
        "estadoProceso",
        "proximaActuacionFecha",
        "actuacionesRealizadas",
      ],
    },
    {
      titulo: "Diligenciamiento",
      tarjeta: "Diligenciamiento y cierre",
      campos: ["diligenciamiento", "acuerdosProximosPasos", "observaciones"],
    },
  ],
  GUARDERIA: [
    {
      titulo: "Ingreso",
      tarjeta: "Ingreso e identificación",
      campos: ["numeroFicha", "fechaIngreso"],
    },
    { titulo: "Traslado", tarjeta: "Responsable de traslado", campos: [] },
    {
      titulo: "Situación familiar",
      tarjeta: "Situación familiar",
      campos: [
        "situacionSocioeconomica",
        "condicionVivienda",
        "observacionesFamiliares",
      ],
    },
    {
      titulo: "Madre y padre",
      tarjeta: "Datos de la madre y del padre",
      campos: [],
    },
    {
      titulo: "Escolaridad y salud",
      tarjeta: "Escolaridad y salud",
      campos: [
        "lugarEstudio",
        "telefonoEscuela",
        "padeceEnfermedad",
        "enfermedadDetalle",
        "tratamiento",
        "indicacionesSalud",
        "observaciones",
      ],
    },
  ],
};

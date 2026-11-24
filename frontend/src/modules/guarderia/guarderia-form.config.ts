export const guarderiaFields: Record<string, string> = {
  numeroFicha: "Número de ficha",
  fechaIngreso: "Fecha de ingreso",
  etniaId: "Etnia",
  situacionSocioeconomica: "Situación socioeconómica",
  condicionVivienda: "Tipo de vivienda",
  observacionesFamiliares: "Observaciones familiares",
  escolaridadId: "Nivel de escolaridad",
  lugarEstudio: "Centro educativo",
  telefonoEscuela: "Teléfono del centro",
  padeceEnfermedad: "Padece enfermedad",
  enfermedadDetalle: "Enfermedad o condición",
  tratamiento: "Tratamiento",
  indicacionesSalud: "Indicaciones relevantes",
  observaciones: "Observaciones",
};
export const guarderiaSections = [
  {
    titulo: "Ingreso",
    tarjeta: "Ingreso e identificación",
    campos: ["numeroFicha", "fechaIngreso", "etniaId"],
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
      "escolaridadId",
      "lugarEstudio",
      "telefonoEscuela",
      "padeceEnfermedad",
      "enfermedadDetalle",
      "tratamiento",
      "indicacionesSalud",
      "observaciones",
    ],
  },
];

/** Mantiene las dos tarjetas del mockup sin crear fichas independientes. */
export function tarjetasGuarderia(pagina: number) {
  if (pagina === 4)
    return [
      {
        tarjeta: "Escolaridad",
        campos: ["escolaridadId", "lugarEstudio", "telefonoEscuela"],
      },
      {
        tarjeta: "Salud",
        campos: [
          "padeceEnfermedad",
          "enfermedadDetalle",
          "tratamiento",
          "indicacionesSalud",
          "observaciones",
        ],
      },
    ];
  const seccion = guarderiaSections[pagina];
  return seccion.campos.length
    ? [{ tarjeta: seccion.tarjeta, campos: seccion.campos }]
    : [];
}

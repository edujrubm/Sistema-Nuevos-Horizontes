/** Etiquetas institucionales de la ficha social; las claves conservan el contrato API. */
export const socialFields: Record<string, string> = {
  tipoVivienda: "Tipo de vivienda",
  composicionFamiliar: "Composición familiar",
  historiaViolencia: "Historia de vida de la problemática de violencia",
  redesApoyo: "Redes familiares y comunitarias",
  dependenciaEconomica: "Dependencia económica",
  diagnosticoSocial: "Diagnóstico social",
  riesgosIdentificados: "Riesgos identificados",
  planEliminacionRiesgos: "Plan de eliminación de riesgos",
  objetivoGeneral: "Objetivo general",
  actividades: "Actividades",
  responsablePlan: "Responsable del plan",
  fechaRevision: "Fecha de revisión",
  areaCoordinacionId: "Coordinación con otras áreas",
  evaluacion: "Evaluación",
  resultadosAlcanzados: "Resultados alcanzados",
  fechaCierre: "Fecha de cierre",
  observaciones: "Observaciones",
};

export const socialSections = [
  {
    titulo: "Identificación",
    tarjeta: "Identificación y contexto familiar",
    campos: ["tipoVivienda", "composicionFamiliar"],
  },
  {
    titulo: "Historia de violencia",
    tarjeta: "Historia de violencia",
    campos: ["historiaViolencia", "redesApoyo", "dependenciaEconomica"],
  },
  {
    titulo: "Diagnóstico y riesgos",
    tarjeta: "Diagnóstico social y riesgos",
    campos: [
      "diagnosticoSocial",
      "riesgosIdentificados",
      "planEliminacionRiesgos",
    ],
  },
  {
    titulo: "Plan de intervención",
    tarjeta: "Plan de tratamiento",
    campos: [
      "objetivoGeneral",
      "actividades",
      "responsablePlan",
      "fechaRevision",
      "areaCoordinacionId",
    ],
  },
  {
    titulo: "Cierre",
    tarjeta: "Evaluación y cierre",
    campos: [
      "evaluacion",
      "resultadosAlcanzados",
      "fechaCierre",
      "observaciones",
    ],
  },
];

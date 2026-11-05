export type TipoCampoFormulario =
  "texto" | "booleano" | "entero" | "numero" | "fecha" | "instante" | "id";

export interface DefinicionTipoFormulario {
  tabla: string;
  requiereNino: boolean;
  admiteExamenMental?: boolean;
  campos: Readonly<Record<string, TipoCampoFormulario>>;
}

function campos(
  tipo: TipoCampoFormulario,
  nombres: readonly string[],
): Record<string, TipoCampoFormulario> {
  return Object.fromEntries(nombres.map((nombre) => [nombre, tipo]));
}

const camposPsicologiaComunes = {
  ...campos("texto", [
    "motivoConsulta",
    "historiaProblemaActual",
    "antecedentesPatologicos",
    "antecedentesNoPatologicos",
    "historiaFamiliar",
    "pruebasAuxiliares",
    "criteriosDiagnosticos",
    "ejeI",
    "ejeIi",
    "ejeIii",
    "ejeIv",
    "ejeV",
    "planTerapeutico",
    "observaciones",
    "referidaPor",
  ]),
  ...campos("entero", ["numeroHermanos", "ordenEntreHermanos"]),
  ...campos("fecha", ["fechaReferencia"]),
};

export const CAMPOS_EXAMEN_MENTAL = {
  ...campos("texto", [
    "apariencia",
    "actitud",
    "lenguaje",
    "percepcion",
    "humor",
    "inteligencia",
    "orientacionEspacial",
    "orientacionTemporal",
    "contenidoPensamiento",
    "cursoPensamiento",
    "controlImpulsos",
    "insight",
  ]),
} as const;

export const TIPOS_FORMULARIO = {
  PSICOLOGIA_MUJER: {
    tabla: "psicologia_mujer",
    requiereNino: false,
    admiteExamenMental: true,
    campos: {
      ...camposPsicologiaComunes,
      ...campos("entero", [
        "hijosVivosReportados",
        "hijosFallecidosReportados",
      ]),
    },
  },
  PSICOLOGIA_NINEZ: {
    tabla: "psicologia_ninez",
    requiereNino: true,
    admiteExamenMental: true,
    campos: {
      ...camposPsicologiaComunes,
      ...campos("texto", [
        "antecedentesPersonales",
        "enfermedadesMadreEmbarazo",
        "tipoEmbarazo",
        "condicionesParto",
        "movimientosGenerales",
        "desdeCuandoEnuresis",
        "desdeCuandoEncopresis",
        "problemasHablaDetalle",
        "conQuienDuerme",
        "motivoTemorOscuridad",
        "miedoLugarDetalle",
        "actitudMadre",
        "actitudPadre",
        "relacionEntrePadres",
        "reaccionNegacion",
        "frecuenciaBerrinches",
        "respuestaPadresBerrinches",
        "juguetesPreferidos",
        "juegosPreferidos",
        "estrategiasObedienciaMadre",
        "castigosUtilizados",
        "reaccionCastigos",
        "acontecimientosImportantes",
      ]),
      ...campos("booleano", [
        "otrasPersonasCasa",
        "hijoDeseado",
        "colaboraActividadesDomesticas",
        "enuresis",
        "encopresis",
        "problemasHabla",
        "obedeceOrdenesSencillas",
        "resistenciaDormir",
        "mismaCama",
        "temorOscuridad",
        "miedoLugar",
        "gustaAbrazoPadres",
      ]),
      ...campos("numero", [
        "gestacionSemanas",
        "sostuvoCabezaMeses",
        "gateoMeses",
        "seSentoMeses",
        "seParoMeses",
        "primerosPasosMeses",
        "horasSueno",
      ]),
    },
  },
  SOCIAL: {
    tabla: "ficha_social",
    requiereNino: false,
    campos: {
      ...campos("booleano", ["dependenciaEconomica"]),
      ...campos("fecha", ["fechaRevision", "fechaCierre"]),
      ...campos("id", ["areaCoordinacionId"]),
      ...campos("texto", [
        "tipoVivienda",
        "composicionFamiliar",
        "redesApoyo",
        "responsablePlan",
        "resultadosAlcanzados",
        "observaciones",
        "historiaViolencia",
        "diagnosticoSocial",
        "riesgosIdentificados",
        "planEliminacionRiesgos",
        "objetivoGeneral",
        "actividades",
        "evaluacion",
      ]),
    },
  },
  MEDICINA_NINEZ: {
    tabla: "consulta_medica",
    requiereNino: true,
    campos: {},
  },
  MEDICINA_ADOLESCENTE: {
    tabla: "consulta_medica",
    requiereNino: false,
    campos: {},
  },
  MEDICINA_MUJER: {
    tabla: "consulta_medica",
    requiereNino: false,
    campos: {},
  },
  LEGAL: {
    tabla: "ficha_legal",
    requiereNino: false,
    campos: {
      ...campos("id", ["demandadoAgresorId"]),
      ...campos("texto", [
        "relacionPartes",
        "normativaAplicable",
        "objetivoLegal",
        "tipoJuicio",
        "estadoProceso",
        "actuacionesRealizadas",
        "acuerdosProximosPasos",
        "observaciones",
        "demandadoNombreDeclarado",
        "diagnosticoJuridico",
        "planTratamiento",
        "referencia",
        "inicioProcesoDescripcion",
        "juzgado",
        "numeroJuicio",
        "juezOficial",
        "diligenciamiento",
      ]),
      ...campos("fecha", ["inicioProcesoFecha", "proximaActuacionFecha"]),
    },
  },
  REFERENCIA_LEGAL: {
    tabla: "referencia_legal",
    requiereNino: false,
    campos: {
      ...campos("texto", [
        "destino",
        "origen",
        "motivoReferencia",
        "recomendaciones",
        "medioEntrega",
      ]),
    },
  },
  GUARDERIA: {
    tabla: "ficha_guarderia",
    requiereNino: true,
    campos: {
      ...campos("texto", [
        "observacionesFamiliares",
        "indicacionesSalud",
        "numeroFicha",
        "situacionSocioeconomica",
        "condicionVivienda",
        "lugarEstudio",
        "telefonoEscuela",
        "enfermedadDetalle",
        "tratamiento",
        "observaciones",
      ]),
      ...campos("fecha", ["fechaIngreso"]),
      ...campos("id", ["etniaId", "escolaridadId"]),
      ...campos("booleano", ["padeceEnfermedad"]),
    },
  },
} as const satisfies Record<string, DefinicionTipoFormulario>;

const camposMedicina = {
  ...campos("texto", [
    "nombreResponsableDeclarado",
    "motivoConsulta",
    "historiaEnfermedadActual",
    "esquemaVacunacion",
    "condicionesNacer",
    "antecedentesPatologicos",
    "antecedentesImportancia",
    "antecedentesGinecologicos",
    "examenFisicoGeneral",
    "cabeza",
    "torax",
    "abdomen",
    "genitales",
    "ginecologico",
    "extremidades",
    "impresionClinica",
    "tratamiento",
    "laboratoriosExamenes",
    "referencia",
    "proximaCitaIndicaciones",
  ]),
  ...campos("numero", [
    "frecuenciaCardiacaLpm",
    "frecuenciaRespiratoriaRpm",
    "temperaturaC",
    "tallaCm",
    "pesoKg",
    "presionSistolicaMmhg",
    "presionDiastolicaMmhg",
  ]),
  ...campos("instante", ["proximaCita"]),
};

for (const codigo of [
  "MEDICINA_NINEZ",
  "MEDICINA_ADOLESCENTE",
  "MEDICINA_MUJER",
] as const) {
  Object.assign(TIPOS_FORMULARIO[codigo].campos, camposMedicina);
}

export type CodigoTipoFormulario = keyof typeof TIPOS_FORMULARIO;

export function esCodigoTipoFormulario(
  valor: string,
): valor is CodigoTipoFormulario {
  return Object.hasOwn(TIPOS_FORMULARIO, valor);
}

export function aSnakeCase(valor: string): string {
  return valor.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
}

export function aCamelCase(valor: string): string {
  return valor.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase());
}

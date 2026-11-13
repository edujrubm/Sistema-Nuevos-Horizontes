export interface AdmissionField {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "date"
    | "time"
    | "tel"
    | "number"
    | "select"
    | "checkboxGroup";
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  catalog?:
    | "countries"
    | "departments"
    | "municipalities"
    | "estados-civiles"
    | "etnias"
    | "ocupaciones"
    | "niveles-estudio"
    | "estados-estudio";
  inputMode?: "numeric";
  maxLength?: number;
  fullWidth?: boolean;
  collapseWhenHidden?: boolean;
  showWhen?: { field: string; equals?: string; includes?: string };
}

export interface AdmissionSectionDefinition {
  key: string;
  title: string;
  description?: string;
  fields: AdmissionField[];
}

export interface AdmissionPageDefinition {
  key: string;
  title: string;
  shortTitle: string;
  sections: AdmissionSectionDefinition[];
}

export const admissionPages: AdmissionPageDefinition[] = [
  {
    key: "identificacion",
    title: "Identificación",
    shortTitle: "Identificación",
    sections: [
      {
        key: "identificacion",
        title: "Datos de identificación",
        description:
          "Los datos maestros de la beneficiaria se mantienen en su perfil estructurado.",
        fields: [
          { name: "lugarNacimiento", label: "Lugar de nacimiento" },
          { name: "nacionalidadDeclarada", label: "Nacionalidad declarada" },
          { name: "personaAcompanante", label: "Persona acompañante" },
          {
            name: "parentescoAcompanante",
            label: "Parentesco de la persona acompañante",
          },
          {
            name: "cuiAcompanante",
            label: "DPI/CUI de la persona acompañante",
            inputMode: "numeric",
            maxLength: 13,
            hint: "Si se registra un DPI/CUI, debe contener 13 dígitos.",
          },
          {
            name: "observacionesIdentificacion",
            label: "Observaciones de identificación",
            type: "textarea",
          },
        ],
      },
    ],
  },
  {
    key: "residencia",
    title: "Residencia y contacto",
    shortTitle: "Residencia",
    sections: [
      {
        key: "residencia",
        title: "Contacto y ubicación",
        description:
          "Completa la ubicación actual, los medios de contacto y la clasificación residencial.",
        fields: [
          {
            name: "paisResidenciaId",
            label: "País de residencia",
            type: "select",
            catalog: "countries",
          },
          {
            name: "departamentoResidenciaId",
            label: "Departamento de residencia",
            type: "select",
            catalog: "departments",
          },
          {
            name: "municipioResidenciaId",
            label: "Municipio de residencia",
            type: "select",
            catalog: "municipalities",
          },
          {
            name: "direccionActual",
            label: "Dirección actual",
            type: "textarea",
          },
          { name: "telefonoCasa", label: "Teléfono de casa", type: "tel" },
          { name: "telefonoCelular", label: "Celular", type: "tel" },
          {
            name: "direccionAlternativa",
            label: "Dirección alternativa",
            type: "textarea",
          },
          { name: "personaEnlace", label: "Nombre de persona enlace" },
          {
            name: "relacionPersonaEnlace",
            label: "Relación con persona enlace",
          },
          {
            name: "telefonoPersonaEnlace",
            label: "Teléfono de persona enlace",
            type: "tel",
          },
          {
            name: "celularPersonaEnlace",
            label: "Celular de persona enlace",
            type: "tel",
          },
          {
            name: "areaResidencial",
            label: "Tipo de área residencial",
            type: "select",
            options: [
              { value: "URBANA", label: "Área urbana" },
              { value: "RURAL", label: "Área rural" },
            ],
          },
          { name: "coloniaBarrio", label: "Colonia o barrio popular" },
          { name: "asentamientoZona", label: "Asentamiento o zona" },
          { name: "aldea", label: "Aldea" },
          { name: "caserio", label: "Caserío" },
          { name: "canton", label: "Cantón" },
          { name: "otroDetalleResidencial", label: "Otro detalle residencial" },
        ],
      },
    ],
  },
  {
    key: "datos-salud",
    title: "Datos generales y salud",
    shortTitle: "Datos y salud",
    sections: [
      {
        key: "datos-generales",
        title: "Datos generales",
        fields: [
          {
            name: "estadoCivilDeclarado",
            label: "Estado civil",
            type: "select",
            options: [
              "Casada",
              "Soltera",
              "Unida",
              "Separada",
              "Divorciada",
              "Noviazgo",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otroEstadoCivil",
            label: "Especificar otro estado civil",
            showWhen: { field: "estadoCivilDeclarado", equals: "Otra" },
          },
          {
            name: "etniaDeclarada",
            label: "Etnia",
            type: "select",
            options: ["Mestiza", "Maya", "Garífuna", "Xinca", "Otra"].map(
              (label) => ({ value: label, label }),
            ),
          },
          {
            name: "otraEtnia",
            label: "Especificar otra etnia",
            showWhen: { field: "etniaDeclarada", equals: "Otra" },
          },
          {
            name: "ocupacionDeclarada",
            label: "Ocupación",
          },
          {
            name: "estudiaActualmente",
            label: "¿Estudia actualmente?",
            type: "select",
            options: [
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
            ],
          },
          { name: "lugarTrabajoOEstudio", label: "Lugar de trabajo o estudio" },
          {
            name: "direccionTrabajoOEstudio",
            label: "Dirección de trabajo o estudio",
          },
          {
            name: "telefonoTrabajoOEstudio",
            label: "Teléfono de trabajo o estudio",
            type: "tel",
          },
          {
            name: "personaContactoTrabajoOEstudio",
            label: "Persona de contacto",
          },
          {
            name: "cargoPersonaContacto",
            label: "Cargo de la persona de contacto",
          },
          {
            name: "alfabetismo",
            label: "¿Sabe leer y escribir?",
            type: "select",
            options: [
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ],
          },
          {
            name: "nivelEscolaridadDeclarado",
            label: "Nivel de escolaridad alcanzado",
            type: "select",
            options: [
              "Sin escolaridad",
              "Primaria incompleta",
              "Primaria completa",
              "Secundaria incompleta",
              "Secundaria completa",
              "Diversificado incompleto",
              "Diversificado completo",
              "Universidad incompleta",
              "Universidad completa",
              "Otros",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otroNivelEscolaridad",
            label: "Especificar otro nivel de escolaridad",
            showWhen: { field: "nivelEscolaridadDeclarado", equals: "Otros" },
          },
        ],
      },
      {
        key: "salud",
        title: "Salud",
        fields: [
          {
            name: "enfermedadPermanente",
            label: "¿Tiene una enfermedad permanente?",
            type: "select",
            options: [
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ],
          },
          {
            name: "nombreEnfermedad",
            label: "¿Cuál enfermedad?",
            showWhen: { field: "enfermedadPermanente", equals: "true" },
          },
          {
            name: "tipoTratamiento",
            label: "Tratamiento que lleva",
            type: "textarea",
            showWhen: { field: "enfermedadPermanente", equals: "true" },
          },
          {
            name: "otrosPadecimientos",
            label: "Otros padecimientos",
            type: "textarea",
          },
        ],
      },
    ],
  },
  {
    key: "familia",
    title: "Familia y personas agresoras",
    shortTitle: "Familia",
    sections: [
      {
        key: "agresores",
        title: "Personas agresoras",
        description:
          "Captura inicial de la persona agresora declarada. La API deberá definir el contrato repetible definitivo.",
        fields: [
          { name: "nombre", label: "Nombre" },
          { name: "edad", label: "Edad", type: "number" },
          {
            name: "tipoDocumento",
            label: "Tipo de documento",
            type: "select",
            options: [
              { value: "DPI_CUI", label: "DPI/CUI" },
              { value: "PASAPORTE", label: "Pasaporte" },
              { value: "OTRO", label: "Otro" },
            ],
          },
          {
            name: "otroTipoDocumento",
            label: "Especificar otro documento",
            showWhen: { field: "tipoDocumento", equals: "OTRO" },
          },
          {
            name: "cuiPasaporte",
            label: "Número de documento",
            maxLength: 20,
            hint: "Para DPI/CUI se requieren exactamente 13 dígitos.",
          },
          { name: "ocupacion", label: "Ocupación" },
          { name: "ingresoMensual", label: "Ingreso mensual" },
          { name: "lugarTrabajo", label: "Lugar de trabajo" },
          { name: "horarioInicio", label: "Hora de inicio", type: "time" },
          { name: "horarioFin", label: "Hora de salida", type: "time" },
          { name: "telefono", label: "Teléfono", type: "tel" },
          {
            name: "direccion",
            label: "Dirección o residencia",
            type: "textarea",
          },
          {
            name: "conocimientoViolenciaSexual",
            label: "En violencia sexual, persona conocida o desconocida",
            type: "select",
            options: [
              { value: "CONOCIDA", label: "Conocida" },
              { value: "DESCONOCIDA", label: "Desconocida" },
            ],
          },
          { name: "relacionParentesco", label: "Relación o parentesco" },
        ],
      },
    ],
  },
  {
    key: "violencia",
    title: "Hechos de violencia",
    shortTitle: "Violencia",
    sections: [
      {
        key: "motivo-consulta",
        title: "Motivo de consulta",
        fields: [
          { name: "relato", label: "Motivo expresado", type: "textarea" },
        ],
      },
      {
        key: "tipos-violencia",
        title: "Tipos de violencia",
        fields: [
          {
            name: "seleccion",
            label: "Selecciona todas las opciones que correspondan",
            type: "checkboxGroup",
            options: [
              "Física",
              "Psicológica",
              "Verbal",
              "Sexual",
              "Patrimonial",
              "Económica",
              "Trata",
              "Violación",
              "Amenaza de muerte",
              "Misoginia",
              "Femicidio",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otra",
            label: "Especificar otra",
            showWhen: { field: "seleccion", includes: "Otra" },
          },
        ],
      },
      {
        key: "objetos-agresion",
        title: "Objetos o medios de agresión",
        fields: [
          {
            name: "seleccion",
            label: "Selecciona todas las opciones que correspondan",
            type: "checkboxGroup",
            options: [
              "Manos",
              "Pies",
              "Arma blanca",
              "Brazos",
              "Arma de fuego",
              "Objeto",
              "Todas",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otra",
            label: "Especificar otra",
            showWhen: { field: "seleccion", includes: "Otra" },
          },
        ],
      },
    ],
  },
  {
    key: "riesgo",
    title: "Situación y análisis de riesgo",
    shortTitle: "Riesgo",
    sections: [
      {
        key: "situaciones-riesgo",
        title: "Situaciones de riesgo",
        fields: [
          {
            name: "factores",
            label: "Factores declarados",
            type: "checkboxGroup",
            options: [
              "Vive con quien agrede",
              "La golpea frecuentemente",
              "Hospitalización por agresión",
              "Consumo de alcohol o drogas",
              "Se encuentra embarazada",
              "Se ha separado de la pareja",
              "Participa en agrupaciones ilícitas",
              "Otra situación",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "tiempoEmbarazo",
            label: "Tiempo de embarazo",
            showWhen: {
              field: "factores",
              includes: "Se encuentra embarazada",
            },
          },
          {
            name: "otraSituacion",
            label: "Otra situación",
            showWhen: { field: "factores", includes: "Otra situación" },
          },
          {
            name: "tiempoAgresion",
            label: "Tiempo de agresión",
            type: "select",
            options: ["Varios días", "Varios meses", "Varios años", "Otro"].map(
              (label) => ({ value: label, label }),
            ),
          },
          {
            name: "otroPeriodo",
            label: "Otro período",
            showWhen: { field: "tiempoAgresion", equals: "Otro" },
            fullWidth: true,
          },
          {
            name: "vinculosAgresores",
            label: "¿Quién la ha estado agrediendo?",
            type: "checkboxGroup",
            options: [
              "Padre",
              "Esposo",
              "Conviviente",
              "Compañero",
              "Exesposo",
              "Padrastro",
              "Hijo",
              "Familia del cónyuge",
              "Hermano",
              "Exconviviente",
              "Tío",
              "Abuelo",
              "Novio",
              "Exnovio",
              "Otro",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otroVinculoAgresor",
            label: "Especificar otro vínculo",
            showWhen: { field: "vinculosAgresores", includes: "Otro" },
          },
          {
            name: "agredeOtrosFamiliares",
            label: "¿Agrede a otros familiares?",
            type: "select",
            options: [
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
            ],
          },
          {
            name: "familiaresAgredidos",
            label: "¿A quién?",
            showWhen: { field: "agredeOtrosFamiliares", equals: "SI" },
          },
          {
            name: "formaAgresionFamiliares",
            label: "¿De qué forma?",
            type: "textarea",
            showWhen: { field: "agredeOtrosFamiliares", equals: "SI" },
          },
        ],
      },
    ],
  },
  {
    key: "referencias",
    title: "Referencias y apoyo",
    shortTitle: "Referencias",
    sections: [
      {
        key: "referencias",
        title: "Origen y derivaciones",
        fields: [
          {
            name: "origen",
            label: "Institución o medio que refirió",
            type: "select",
            options: [
              "Oficina de Atención a la Víctima del MP",
              "Otra oficina del MP",
              "Defensoría de la Mujer PDH",
              "Otra oficina PDH",
              "Bufete universitario",
              "Bufete particular",
              "Juzgado",
              "PGN",
              "Policía Nacional Civil",
              "Grupo de mujeres o feministas",
              "Centro de Salud",
              "Amistades o familiares",
              "Radio, televisión o prensa",
              "ONG",
              "Defensa Pública Penal",
              "Secretaría de la Mujer del OJ",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otroOrigen",
            label: "Especificar otro origen",
            showWhen: { field: "origen", equals: "Otra" },
          },
        ],
      },
      {
        key: "apoyo-recibido",
        title: "Apoyo previo",
        fields: [
          {
            name: "recibioApoyo",
            label: "¿Recibió apoyo?",
            type: "select",
            options: [
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
            ],
          },
          {
            name: "lugar",
            label: "¿Dónde?",
            showWhen: { field: "recibioApoyo", equals: "SI" },
            collapseWhenHidden: true,
          },
          {
            name: "tipo",
            label: "Tipo de apoyo",
            showWhen: { field: "recibioApoyo", equals: "SI" },
            collapseWhenHidden: true,
          },
          {
            name: "fecha",
            label: "Fecha",
            type: "date",
            showWhen: { field: "recibioApoyo", equals: "SI" },
            collapseWhenHidden: true,
          },
          {
            name: "traeDenuncia",
            label: "¿Trae denuncia?",
            type: "select",
            options: [
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
            ],
          },
          {
            name: "internas",
            label: "¿A dónde fue referida dentro del CAIMUS?",
            type: "checkboxGroup",
            options: [
              "Área Psicológica",
              "Área Legal",
              "Área de Albergue Temporal",
              "Área Social",
              "Área Médica",
              "Grupos de Autoayuda o Apoyo",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otraInterna",
            label: "Especificar otra referencia interna",
            showWhen: { field: "internas", includes: "Otra" },
          },
          {
            name: "externas",
            label: "¿A dónde fue referida externamente?",
            type: "checkboxGroup",
            options: [
              "Oficina de Atención a la Víctima del MP",
              "Otras oficinas MP",
              "Defensoría de la Mujer PDH",
              "Otras oficinas PDH",
              "Bufetes universitarios",
              "Bufetes particulares",
              "RENAP",
              "Municipalidades",
              "Centro de Prácticas de la Universidad",
              "Otros juzgados",
              "Oficina de la Mujer y Niñez de la PGN",
              "Otra oficina PGN",
              "Policía Nacional Civil",
              "Grupos de mujeres y feministas",
              "Juzgados de familia",
              "Hospitales",
              "Centro de Salud",
              "DEMI",
              "Otra",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otraExterna",
            label: "Especificar otra referencia externa",
            showWhen: { field: "externas", includes: "Otra" },
          },
        ],
      },
    ],
  },
  {
    key: "entrevista-cierre",
    title: "Entrevista y cierre",
    shortTitle: "Cierre",
    sections: [
      {
        key: "episodio-reciente",
        title: "Último episodio violento",
        fields: [
          {
            name: "relato",
            label: "Historia del episodio reciente",
            type: "textarea",
          },
        ],
      },
      {
        key: "analisis-riesgo",
        title: "Análisis de riesgo",
        fields: [
          { name: "analisis", label: "Análisis realizado", type: "textarea" },
        ],
      },
      {
        key: "plan-seguridad",
        title: "Plan de seguridad",
        fields: [{ name: "plan", label: "Plan acordado", type: "textarea" }],
      },
      {
        key: "evaluacion",
        title: "Evaluación del estado actual",
        fields: [{ name: "detalle", label: "Evaluación", type: "textarea" }],
      },
      {
        key: "entrevista-inicial",
        title: "Entrevista inicial",
        fields: [
          {
            name: "detalle",
            label: "Síntesis de entrevista",
            type: "textarea",
          },
        ],
      },
      {
        key: "seguimiento",
        title: "Seguimiento inmediato",
        fields: [
          {
            name: "detalle",
            label: "Acciones de seguimiento",
            type: "textarea",
          },
        ],
      },
      {
        key: "observaciones",
        title: "Observaciones",
        fields: [
          { name: "detalle", label: "Observaciones finales", type: "textarea" },
          { name: "entrevistador", label: "Nombre de quien entrevista" },
        ],
      },
    ],
  },
];

export const requiredSectionKeys = admissionPages.flatMap((page) =>
  page.sections.map((section) => section.key),
);

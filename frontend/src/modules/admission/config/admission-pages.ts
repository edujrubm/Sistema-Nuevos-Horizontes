export interface AdmissionField {
  name: string;
  label: string;
  /** Dato fuente requerido para completar la reportería institucional. */
  required?: boolean;
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
  exclusiveOptions?: string[];
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
          {
            name: "sexoDeclarado",
            label: "Sexo",
            type: "select",
            required: true,
            options: [
              { value: "F", label: "Femenino" },
              { value: "M", label: "Masculino" },
              { value: "O", label: "Otro" },
            ],
          },
          {
            name: "idiomaAtencion",
            label: "Idioma en el que se brindó la atención",
            type: "select",
            options: [
              "Español",
              "K’iche’",
              "Mam",
              "Achí",
              "Akateko",
              "Awakateko",
              "Chalchiteko",
              "Ch’orti’",
              "Chuj",
              "Itza’",
              "Ixil",
              "Jakalteco (Popti’)",
              "Kaqchikel",
              "Mopan",
              "Pocomam",
              "Poqomchi’",
              "Q’anjob’al",
              "Q’eqchi’",
              "Sakapulteko",
              "Sipakapense",
              "Tz’utujil",
              "Uspanteko",
            ].map((label) => ({ value: label, label })),
            hint: "Español, K’iche’ y Mam aparecen primero por ser los idiomas priorizados.",
          },
          {
            name: "estadoMigratorio",
            label: "Estado migratorio",
            type: "select",
            options: [
              "Migrante",
              "Refugiada",
              "Desplazada",
              "Sin condiciones de vulnerabilidad identificada",
            ].map((label) => ({ value: label, label })),
            hint: "Registra la situación migratoria declarada por la usuaria.",
          },
          { name: "lugarNacimiento", label: "Lugar de nacimiento" },
          {
            name: "nacionalidadDeclarada",
            label: "Nacionalidad declarada",
            required: true,
          },
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
            required: true,
          },
          {
            name: "departamentoResidenciaId",
            label: "Departamento de residencia",
            type: "select",
            catalog: "departments",
            required: true,
          },
          {
            name: "municipioResidenciaId",
            label: "Municipio de residencia",
            type: "select",
            catalog: "municipalities",
            required: true,
          },
          {
            name: "direccionActual",
            label: "Dirección actual",
            type: "textarea",
            required: true,
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
            required: true,
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
            required: true,
            options: [
              "Casada",
              "Divorciada",
              "Separada",
              "Soltera",
              "Unida",
              "Viuda",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "etniaDeclarada",
            label: "Etnia",
            type: "select",
            required: true,
            options: ["Mestiza", "Maya", "Garífuna", "Xinca", "Otra"].map(
              (label) => ({ value: label, label }),
            ),
          },
          {
            name: "otraEtnia",
            label: "Especificar otra etnia",
            required: true,
            showWhen: { field: "etniaDeclarada", equals: "Otra" },
          },
          {
            name: "ocupacionDeclarada",
            label: "Ocupación",
            type: "select",
            required: true,
            options: [
              "Trabajo de casa no remunerado",
              "Comerciante",
              "Trabajo de casa particular",
              "Supervisora",
              "Mesera",
              "Vendedora",
              "Cocinera",
              "Niñera",
              "Tortillera",
              "Bordadora",
              "Tejedora",
              "Inspectora de microbús",
              "Comadrona",
              "Conserje",
              "Agricultora",
              "Dependiente de mostrador",
              "Costurera o modista",
              "Misionera",
              "Estilista",
              "MTS",
              "Agente PNC",
              "Estudiante",
              "Maestra",
              "Perita contadora",
              "Médica",
              "Administradora de empresas",
              "Secretaria oficinista",
              "Enfermera",
              "Licenciada",
              "Licenciada en trabajo social",
              "Ingeniera agrónoma",
              "Asesora de ventas",
              "Psicóloga",
              "Profesional con maestría",
              "Procuradora jurídica",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "situacionSocioeconomica",
            label: "Situación socioeconómica",
            type: "checkboxGroup",
            options: [
              "Con ingresos propios",
              "Sin ingresos propios",
              "Ingresos formales",
              "Ingresos informales",
              "Otros ingresos",
            ].map((label) => ({ value: label, label })),
            exclusiveOptions: ["Sin ingresos propios"],
            hint: "Puedes seleccionar más de una opción cuando corresponda.",
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
            required: true,
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
            required: true,
            showWhen: { field: "nivelEscolaridadDeclarado", equals: "Otros" },
          },
        ],
      },
      {
        key: "salud",
        title: "Salud",
        fields: [
          {
            name: "enGestacion",
            label: "Condición de gestación o lactancia",
            type: "select",
            options: [
              { value: "GESTACION", label: "En gestación" },
              { value: "LACTANCIA", label: "En lactancia" },
              { value: "NINGUNA", label: "Ninguna" },
            ],
          },
          {
            name: "tiempoGestacionSemanas",
            label: "Tiempo de gestación (semanas)",
            type: "number",
            showWhen: { field: "enGestacion", equals: "GESTACION" },
            hint: "Registra las semanas de gestación informadas al momento de la atención.",
          },
          {
            name: "tiposDiscapacidad",
            label: "Discapacidad",
            type: "checkboxGroup",
            options: [
              "Discapacidad física",
              "Discapacidad visual",
              "Discapacidad auditiva",
              "Discapacidad intelectual",
              "Otra discapacidad",
              "Ninguna",
            ].map((label) => ({ value: label, label })),
            exclusiveOptions: ["Ninguna"],
          },
          {
            name: "otraDiscapacidad",
            label: "Especificar otra discapacidad",
            showWhen: {
              field: "tiposDiscapacidad",
              includes: "Otra discapacidad",
            },
          },
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
          {
            name: "relacionParentesco",
            label: "Relación o parentesco",
            required: true,
          },
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
          {
            name: "seleccion",
            label: "Motivo de la visita",
            type: "checkboxGroup",
            required: true,
            options: [
              "Orientación",
              "Pensión alimenticia",
              "Violencia contra la mujer",
              "Paternidad de filiación extramatrimonial",
              "Violencia intrafamiliar",
              "Atención psicológica",
              "Delito de violación",
              "Atención psicológica para su hija o hijo",
              "Consulta médica",
              "Reconocimiento de hija o hijo",
              "Tentativa de femicidio",
              "Femicidio",
              "Divorcio",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "relato",
            label: "Detalle del motivo expresado",
            type: "textarea",
          },
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
            required: true,
            options: [
              "Física",
              "Psicológica",
              "Verbal",
              "Sexual",
              "Patrimonial",
              "Económica",
              "Laboral",
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
            required: true,
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
              "Ex esposo",
              "Conviviente",
              "Ex conviviente",
              "Compañero",
              "Ex compañero",
              "Novio",
              "Ex novio",
              "Concuño",
              "Suegro",
              "Vecino",
              "Jefe",
              "Amigo",
              "Conocido",
              "Desconocido",
              "Maestro",
              "Padrastro",
              "Primo",
              "Hermano",
              "Hermana",
              "Hermanastro",
              "Mujer",
              "Hijo",
              "Hija",
              "Sobrino",
              "Cuñado",
              "Tío",
              "Yerno",
              "Abuelo",
              "Otros",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "otroVinculoAgresor",
            label: "Especificar otro vínculo",
            showWhen: { field: "vinculosAgresores", includes: "Otros" },
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
            required: true,
            options: [
              "Juzgado de la Niñez",
              "Juzgado de paz",
              "Juzgado de Familia",
              "Juzgados de femicidio",
              "Otros juzgados",
              "Oficina del MP",
              "Oficina de Atención a la Víctima",
              "Ministerio de Trabajo",
              "PNC",
              "PGN",
              "Centro de Salud",
              "DEMI",
              "DMM",
              "CAIMUS",
              "PDH",
              "Defensa Pública Penal",
              "Bufete Popular",
              "CONAPREVI",
              "Hospital",
              "APROFAM",
              "ASCAN",
              "AMUTED",
              "RENAP",
              "Instituto de Ciencias Penales Guatemalteco",
              "Amistades",
              "Familiares",
              "Sobreviviente",
              "Grupos de mujeres",
              "Consejo Nacional de Adopciones",
              "Otras ONG",
              "Medios de comunicación",
              "Instituto de la Víctima",
            ].map((label) => ({ value: label, label })),
          },
          {
            name: "referenciasInternas",
            label: "Referencias internas",
            type: "checkboxGroup",
            options: [
              "Psicología",
              "Trabajo Social",
              "Área Médica",
              "Área Legal",
              "Albergue",
              "Guardería",
            ].map((label) => ({ value: label, label })),
            hint: "Selecciona las áreas internas a las que se deriva el caso.",
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
            name: "externas",
            label: "¿A dónde fue referida externamente?",
            type: "checkboxGroup",
            options: [
              "Juzgado de familia",
              "Juzgado de paz",
              "Juzgado de femicidio",
              "Ministerio de Trabajo",
              "Ministerio Público",
              "DEMI",
              "Bufete popular",
              "Centro de Salud",
              "PNC",
              "Hospital Nacional",
              "Bufete de psicología",
              "PGN",
              "ASCAN",
              "Patronato del Diabético",
              "RENAP",
              "PDH",
              "Juzgado de niñez y adolescencia",
              "Ninguna",
              "GGM",
              "Consulado de México",
              "INACIF",
              "Centro educativo",
              "CAIMUS",
              "DMM",
            ].map((label) => ({ value: label, label })),
            exclusiveOptions: ["Ninguna"],
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

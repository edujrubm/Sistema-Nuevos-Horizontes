export interface AdmissionField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "tel" | "number" | "select" | "checkboxGroup";
  hint?: string;
  options?: Array<{ value: string; label: string }>;
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
    sections: [{
      key: "identificacion",
      title: "Datos de identificación",
      description: "Los datos maestros de la beneficiaria se mantienen en su perfil estructurado.",
      fields: [
        { name: "lugarNacimiento", label: "Lugar de nacimiento" },
        { name: "nacionalidadDeclarada", label: "Nacionalidad declarada" },
        { name: "personaAcompanante", label: "Persona acompañante" },
        { name: "parentescoAcompanante", label: "Parentesco de la persona acompañante" },
        { name: "cuiAcompanante", label: "DPI/CUI de la persona acompañante" },
        { name: "observacionesIdentificacion", label: "Observaciones de identificación", type: "textarea" },
      ],
    }],
  },
  {
    key: "residencia",
    title: "Residencia y contacto",
    shortTitle: "Residencia",
    sections: [{
      key: "residencia",
      title: "Contacto y ubicación",
      description: "Completa la ubicación actual, los medios de contacto y la clasificación residencial.",
      fields: [
        { name: "paisResidencia", label: "País de residencia" },
        { name: "departamentoResidencia", label: "Departamento de residencia" },
        { name: "municipioResidencia", label: "Municipio de residencia" },
        { name: "direccionActual", label: "Dirección actual", type: "textarea" },
        { name: "telefonoCasa", label: "Teléfono de casa", type: "tel" },
        { name: "telefonoCelular", label: "Celular", type: "tel" },
        { name: "direccionAlternativa", label: "Dirección alternativa", type: "textarea" },
        { name: "personaEnlace", label: "Nombre de persona enlace" },
        { name: "relacionPersonaEnlace", label: "Relación con persona enlace" },
        { name: "telefonoPersonaEnlace", label: "Teléfono de persona enlace", type: "tel" },
        { name: "celularPersonaEnlace", label: "Celular de persona enlace", type: "tel" },
        {
          name: "tipoArea",
          label: "Tipo de área residencial",
          type: "select",
          options: [{ value: "URBANA", label: "Área urbana" }, { value: "RURAL", label: "Área rural" }],
        },
        { name: "coloniaBarrio", label: "Colonia o barrio popular" },
        { name: "asentamientoZona", label: "Asentamiento o zona" },
        { name: "aldea", label: "Aldea" },
        { name: "caserio", label: "Caserío" },
        { name: "canton", label: "Cantón" },
        { name: "otroDetalleResidencial", label: "Otro detalle residencial" },
      ],
    }],
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
          { name: "estadoCivilDeclarado", label: "Estado civil" },
          { name: "etniaDeclarada", label: "Etnia" },
          { name: "ocupacionDeclarada", label: "Ocupación" },
          {
            name: "estudiaActualmente",
            label: "¿Estudia actualmente?",
            type: "select",
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
          },
          { name: "lugarTrabajoEstudio", label: "Lugar de trabajo o estudio" },
          { name: "direccionTrabajoEstudio", label: "Dirección de trabajo o estudio", type: "textarea" },
          { name: "telefonoTrabajoEstudio", label: "Teléfono de trabajo o estudio", type: "tel" },
          { name: "personaContactoTrabajoEstudio", label: "Persona de contacto" },
          { name: "cargoPersonaContacto", label: "Cargo de la persona de contacto" },
          {
            name: "sabeLeerEscribir",
            label: "¿Sabe leer y escribir?",
            type: "select",
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
          },
          { name: "nivelEscolaridadDeclarado", label: "Nivel de escolaridad alcanzado" },
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
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
          },
          { name: "nombreEnfermedad", label: "¿Cuál enfermedad?" },
          { name: "tratamiento", label: "Tratamiento que lleva", type: "textarea" },
          { name: "otrosPadecimientos", label: "Otros padecimientos", type: "textarea" },
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
        key: "grupo-familiar",
        title: "Grupo familiar",
        fields: [
          { name: "descripcion", label: "Descripción del grupo familiar", type: "textarea" },
          { name: "observaciones", label: "Observaciones del núcleo familiar", type: "textarea" },
        ],
      },
      {
        key: "agresores",
        title: "Personas agresoras",
        description: "Captura inicial de la persona agresora declarada. La API deberá definir el contrato repetible definitivo.",
        fields: [
          { name: "nombre", label: "Nombre" },
          { name: "edad", label: "Edad", type: "number" },
          { name: "cuiPasaporte", label: "DPI/CUI o pasaporte" },
          { name: "ocupacion", label: "Ocupación" },
          { name: "ingresoMensual", label: "Ingreso mensual" },
          { name: "lugarTrabajo", label: "Lugar de trabajo" },
          { name: "horario", label: "Horario" },
          { name: "telefono", label: "Teléfono", type: "tel" },
          { name: "direccion", label: "Dirección o residencia", type: "textarea" },
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
        fields: [{ name: "relato", label: "Motivo expresado", type: "textarea" }],
      },
      {
        key: "tipos-violencia",
        title: "Tipos de violencia",
        fields: [
          {
            name: "seleccion",
            label: "Selecciona todas las opciones que correspondan",
            type: "checkboxGroup",
            options: ["Física", "Psicológica", "Verbal", "Sexual", "Patrimonial", "Económica", "Trata", "Violación", "Amenaza de muerte", "Misoginia", "Femicidio", "Otra"].map((label) => ({ value: label, label })),
          },
          { name: "otra", label: "Especificar otra" },
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
            options: ["Manos", "Pies", "Arma blanca", "Brazos", "Arma de fuego", "Objeto", "Todas", "Otra"].map((label) => ({ value: label, label })),
          },
          { name: "otra", label: "Especificar otra" },
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
          { name: "tiempoEmbarazo", label: "Tiempo de embarazo" },
          { name: "otraSituacion", label: "Otra situación" },
          {
            name: "tiempoAgresion",
            label: "Tiempo de agresión",
            type: "select",
            options: ["Varios días", "Varios meses", "Varios años", "Otro"].map((label) => ({ value: label, label })),
          },
          { name: "otroPeriodo", label: "Otro período" },
          {
            name: "vinculosAgresores",
            label: "¿Quién la ha estado agrediendo?",
            type: "checkboxGroup",
            options: ["Padre", "Esposo", "Conviviente", "Compañero", "Exesposo", "Padrastro", "Hijo", "Familia del cónyuge", "Hermano", "Exconviviente", "Tío", "Abuelo", "Novio", "Exnovio", "Otro"].map((label) => ({ value: label, label })),
          },
          {
            name: "agredeOtrosFamiliares",
            label: "¿Agrede a otros familiares?",
            type: "select",
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
          },
          { name: "familiaresAgredidos", label: "¿A quién?" },
          { name: "formaAgresionFamiliares", label: "¿De qué forma?", type: "textarea" },
        ],
      },
      {
        key: "episodio-reciente",
        title: "Último episodio violento",
        fields: [{ name: "relato", label: "Historia del episodio reciente", type: "textarea" }],
      },
      {
        key: "analisis-riesgo",
        title: "Análisis de riesgo",
        fields: [{ name: "analisis", label: "Análisis realizado", type: "textarea" }],
      },
      {
        key: "plan-seguridad",
        title: "Plan de seguridad",
        fields: [{ name: "plan", label: "Plan acordado", type: "textarea" }],
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
            options: ["Oficina de Atención a la Víctima del MP", "Otra oficina del MP", "Defensoría de la Mujer PDH", "Otra oficina PDH", "Bufete universitario", "Bufete particular", "Juzgado", "PGN", "Policía Nacional Civil", "Grupo de mujeres o feministas", "Centro de Salud", "Amistades o familiares", "Radio, televisión o prensa", "ONG", "Defensa Pública Penal", "Secretaría de la Mujer del OJ", "Otra"].map((label) => ({ value: label, label })),
          },
          { name: "otroOrigen", label: "Especificar otro origen" },
          {
            name: "internas",
            label: "Referencias internas",
            type: "checkboxGroup",
            options: ["Psicología", "Legal", "Albergue Temporal", "Trabajo Social", "Medicina", "Grupos de apoyo", "Otra"].map((label) => ({ value: label, label })),
          },
          { name: "otraInterna", label: "Especificar otra referencia interna" },
          {
            name: "externas",
            label: "Referencias externas",
            type: "checkboxGroup",
            options: ["Ministerio Público", "PDH", "Bufete universitario", "RENAP", "Municipalidad", "Juzgado", "PGN", "Policía Nacional Civil", "Hospital o Centro de Salud", "DEMI", "Otra"].map((label) => ({ value: label, label })),
          },
          { name: "otraExterna", label: "Especificar otra referencia externa" },
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
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
          },
          { name: "lugar", label: "¿Dónde?" },
          { name: "tipo", label: "Tipo de apoyo" },
          { name: "fecha", label: "Fecha", type: "date" },
          {
            name: "traeDenuncia",
            label: "¿Trae denuncia?",
            type: "select",
            options: [{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }],
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
        key: "evaluacion",
        title: "Evaluación del estado actual",
        fields: [{ name: "detalle", label: "Evaluación", type: "textarea" }],
      },
      {
        key: "entrevista-inicial",
        title: "Entrevista inicial",
        fields: [{ name: "detalle", label: "Síntesis de entrevista", type: "textarea" }],
      },
      {
        key: "seguimiento",
        title: "Seguimiento inmediato",
        fields: [{ name: "detalle", label: "Acciones de seguimiento", type: "textarea" }],
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

export interface AdmissionField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "tel";
  hint?: string;
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
      description: "La geografía y dirección principal se almacenan como datos estructurados.",
      fields: [
        { name: "telefonoCasa", label: "Teléfono de casa", type: "tel" },
        { name: "telefonoPersonaEnlace", label: "Teléfono de persona enlace", type: "tel" },
        { name: "detalleAreaResidencial", label: "Colonia, zona, aldea, caserío u otro detalle" },
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
          { name: "etniaDeclarada", label: "Etnia declarada" },
          { name: "detalleOcupacionEstudio", label: "Detalle de ocupación o estudio", type: "textarea" },
        ],
      },
      {
        key: "salud",
        title: "Salud",
        fields: [
          { name: "detalleSalud", label: "Información relevante de salud", type: "textarea" },
          { name: "indicacionesTratamiento", label: "Indicaciones o tratamiento", type: "textarea" },
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
        fields: [{ name: "descripcion", label: "Descripción del grupo familiar", type: "textarea" }],
      },
      {
        key: "agresores",
        title: "Personas agresoras",
        fields: [{ name: "descripcion", label: "Información declarada de personas agresoras", type: "textarea" }],
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
        fields: [{ name: "detalle", label: "Tipos identificados y detalle", type: "textarea" }],
      },
      {
        key: "objetos-agresion",
        title: "Objetos o medios de agresión",
        fields: [{ name: "detalle", label: "Objetos o medios declarados", type: "textarea" }],
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
        fields: [{ name: "detalle", label: "Situaciones identificadas", type: "textarea" }],
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
        fields: [{ name: "detalle", label: "Origen y referencias internas o externas", type: "textarea" }],
      },
      {
        key: "apoyo-recibido",
        title: "Apoyo previo",
        fields: [{ name: "detalle", label: "Lugar, tipo, fecha y denuncia, si aplica", type: "textarea" }],
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

export const SECCIONES_FICHA = [
  "identificacion",
  "residencia",
  "datos-generales",
  "salud",
  "agresores",
  "motivo-consulta",
  "tipos-violencia",
  "objetos-agresion",
  "situaciones-riesgo",
  "referencias",
  "apoyo-recibido",
  "episodio-reciente",
  "analisis-riesgo",
  "plan-seguridad",
  "evaluacion",
  "entrevista-inicial",
  "seguimiento",
  "observaciones",
] as const;

export const esSeccionFicha = (
  valor: string,
): valor is (typeof SECCIONES_FICHA)[number] =>
  (SECCIONES_FICHA as readonly string[]).includes(valor);

/** Las 8 páginas corresponden al flujo visible del formulario de admisión. */
export const PAGINAS_FICHA = {
  identificacion: ["identificacion"],
  residencia: ["residencia"],
  "datos-salud": ["datos-generales", "salud"],
  familia: ["agresores"],
  violencia: ["motivo-consulta", "tipos-violencia", "objetos-agresion"],
  riesgo: ["situaciones-riesgo"],
  referencias: ["referencias", "apoyo-recibido"],
  "entrevista-cierre": [
    "episodio-reciente",
    "analisis-riesgo",
    "plan-seguridad",
    "evaluacion",
    "entrevista-inicial",
    "seguimiento",
    "observaciones",
  ],
} as const satisfies Record<
  string,
  readonly (typeof SECCIONES_FICHA)[number][]
>;

export type PaginaFicha = keyof typeof PAGINAS_FICHA;

export const esPaginaFicha = (valor: string): valor is PaginaFicha =>
  Object.prototype.hasOwnProperty.call(PAGINAS_FICHA, valor);

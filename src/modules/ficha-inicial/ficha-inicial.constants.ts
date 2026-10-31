export const SECCIONES_FICHA = [
  "identificacion",
  "residencia",
  "datos-generales",
  "salud",
  "grupo-familiar",
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

export const CAMPOS_OTROS_FICHA: Readonly<Record<string, readonly string[]>> = {
  identificacion: ["otroTipoDocumento"],
  residencia: ["otroDetalleResidencial"],
  "datos-generales": ["otraEtnia", "otroNivelEscolaridad"],
  salud: ["otraDiscapacidad"],
  agresores: ["otroTipoDocumento"],
  "tipos-violencia": ["otra"],
  "objetos-agresion": ["otra"],
  "situaciones-riesgo": ["otraSituacion", "otroPeriodo", "otroVinculoAgresor"],
};

export interface ValorOtroFicha {
  seccion: string;
  campo: string;
  original: string;
  normalizado: string;
}

export interface ErrorValorOtro {
  campo: string;
  mensaje: string;
}

export function esCampoOtroFicha(seccion: string, campo: string) {
  return CAMPOS_OTROS_FICHA[seccion]?.includes(campo) ?? false;
}

export function normalizarTextoOtro(valor: string) {
  return valor
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLocaleLowerCase("es-GT")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/g, "");
}

export function prepararCamposOtros(
  entrada: Record<string, Record<string, unknown>>,
) {
  const secciones = structuredClone(entrada);
  const valores: ValorOtroFicha[] = [];
  const errores: ErrorValorOtro[] = [];

  for (const [seccion, campos] of Object.entries(CAMPOS_OTROS_FICHA)) {
    const contenido = secciones[seccion];
    if (!contenido) continue;
    for (const campo of campos) {
      // Las claves de versiones anteriores se descartan: la normalización y su
      // etiqueta oficial viven en la tabla relacional de reportería.
      delete contenido[`${campo}Normalizado`];
      delete contenido[`${campo}EtiquetaReporteria`];
      const original = contenido[campo];
      if (original === undefined || original === null || original === "")
        continue;
      if (typeof original !== "string") {
        errores.push({
          campo: `${seccion}.${campo}`,
          mensaje: "El valor de Otra u Otros debe ser texto.",
        });
        continue;
      }
      if (original.length > 2000) {
        errores.push({
          campo: `${seccion}.${campo}`,
          mensaje: "El valor no puede exceder 2000 caracteres.",
        });
        continue;
      }
      const normalizado = normalizarTextoOtro(original);
      if (!normalizado) {
        errores.push({
          campo: `${seccion}.${campo}`,
          mensaje: "Escribe un valor válido, no solamente espacios o puntos.",
        });
        continue;
      }
      valores.push({ seccion, campo, original, normalizado });
    }
  }

  return { secciones, valores, errores };
}

import type { PaginaFicha } from "./ficha-inicial.constants";

interface ErrorCampoReporteria {
  campo: string;
  mensaje: string;
}

type SeccionesFicha = Record<string, Record<string, unknown>>;

interface HijoReporteria {
  nombre?: string;
  fechaNacimiento?: string;
  genero?: string;
}

const CAMPOS_REQUERIDOS: Partial<
  Record<PaginaFicha, Record<string, readonly string[]>>
> = {
  identificacion: {
    identificacion: ["sexoDeclarado", "nacionalidadDeclarada"],
  },
  residencia: {
    residencia: [
      "paisResidenciaId",
      "departamentoResidenciaId",
      "municipioResidenciaId",
      "direccionActual",
      "areaResidencial",
    ],
  },
  "datos-salud": {
    "datos-generales": [
      "estadoCivilDeclarado",
      "etniaDeclarada",
      "ocupacionDeclarada",
      "nivelEscolaridadDeclarado",
    ],
  },
  familia: {
    agresores: ["relacionParentesco"],
  },
  violencia: {
    "motivo-consulta": ["seleccion"],
    "tipos-violencia": ["seleccion"],
  },
  referencias: {
    referencias: ["origen"],
  },
};

function tieneValor(valor: unknown) {
  if (typeof valor === "string") return valor.trim().length > 0;
  if (Array.isArray(valor)) return valor.length > 0;
  return valor !== undefined && valor !== null;
}

function erroresCondicionales(secciones: SeccionesFicha) {
  const errores: ErrorCampoReporteria[] = [];
  const generales = secciones["datos-generales"] ?? {};
  if (generales.etniaDeclarada === "Otra" && !tieneValor(generales.otraEtnia)) {
    errores.push({
      campo: "datos-generales.otraEtnia",
      mensaje: "Especifica la otra etnia para completar la reportería.",
    });
  }
  if (
    generales.nivelEscolaridadDeclarado === "Otros" &&
    !tieneValor(generales.otroNivelEscolaridad)
  ) {
    errores.push({
      campo: "datos-generales.otroNivelEscolaridad",
      mensaje: "Especifica el otro nivel de escolaridad.",
    });
  }
  const violencia = secciones["tipos-violencia"] ?? {};
  if (
    Array.isArray(violencia.seleccion) &&
    violencia.seleccion.includes("Otra") &&
    !tieneValor(violencia.otra)
  ) {
    errores.push({
      campo: "tipos-violencia.otra",
      mensaje: "Especifica el otro tipo de violencia.",
    });
  }
  return errores;
}

/** Valida únicamente los datos fuente usados por los consolidadores históricos. */
export function validarCamposReporteriaPagina(
  pagina: PaginaFicha,
  secciones: SeccionesFicha,
  hijos: HijoReporteria[] = [],
): ErrorCampoReporteria[] {
  const errores = Object.entries(CAMPOS_REQUERIDOS[pagina] ?? {}).flatMap(
    ([seccion, campos]) =>
      campos.flatMap((campo) =>
        tieneValor(secciones[seccion]?.[campo])
          ? []
          : [
              {
                campo: `${seccion}.${campo}`,
                mensaje: "Este campo es obligatorio para la reportería.",
              },
            ],
      ),
  );
  errores.push(...erroresCondicionales(secciones));
  if (pagina === "familia") {
    hijos.forEach((hijo, indice) => {
      if (!tieneValor(hijo.nombre))
        errores.push({
          campo: `hijos[${indice}].nombre`,
          mensaje: "El nombre de la hija o hijo es obligatorio.",
        });
      if (!tieneValor(hijo.fechaNacimiento))
        errores.push({
          campo: `hijos[${indice}].fechaNacimiento`,
          mensaje: "La fecha de nacimiento es obligatoria para la reportería.",
        });
      if (!tieneValor(hijo.genero))
        errores.push({
          campo: `hijos[${indice}].genero`,
          mensaje: "El sexo es obligatorio para la reportería.",
        });
    });
  }
  return errores;
}

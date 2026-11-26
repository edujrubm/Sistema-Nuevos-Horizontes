import {
  normalizarTextoOtro,
  prepararCamposOtros,
} from "./normalizacion-otros";

describe("normalización de valores Otra u Otros", () => {
  it.each(["termo", "Termo", "TERMO.", "  TeRmO...  ", "térmo"])(
    "agrupa %p con una sola clave",
    (entrada) => {
      expect(normalizarTextoOtro(entrada)).toBe("termo");
    },
  );

  it("compacta espacios internos y conserva intacto el original", () => {
    const resultado = prepararCamposOtros({
      salud: { otraDiscapacidad: "  Término   compuesto...  " },
    });

    expect(resultado.errores).toEqual([]);
    expect(resultado.secciones.salud).toEqual({
      otraDiscapacidad: "  Término   compuesto...  ",
    });
    expect(resultado.valores).toEqual([
      expect.objectContaining({
        seccion: "salud",
        campo: "otraDiscapacidad",
        normalizado: "termino compuesto",
      }),
    ]);
  });

  it("ignora una clave normalizada enviada por el cliente", () => {
    const resultado = prepararCamposOtros({
      "tipos-violencia": {
        otra: "Labor comunitaria.",
        otraNormalizado: "valor manipulado",
      },
    });

    expect(resultado.secciones["tipos-violencia"]).toEqual({
      otra: "Labor comunitaria.",
    });
    expect(resultado.valores[0].normalizado).toBe("labor comunitaria");
  });

  it("rechaza un valor compuesto solamente por espacios y puntos", () => {
    const resultado = prepararCamposOtros({
      "objetos-agresion": { otra: "  ...  " },
    });

    expect(resultado.errores).toEqual([
      expect.objectContaining({ campo: "objetos-agresion.otra" }),
    ]);
  });
});

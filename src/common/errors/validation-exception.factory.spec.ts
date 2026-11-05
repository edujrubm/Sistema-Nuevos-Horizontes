import { ValidationError } from "class-validator";

import { crearExcepcionValidacion } from "./validation-exception.factory";

describe("crearExcepcionValidacion", () => {
  it("genera un solo detalle español para un campo obligatorio", () => {
    const error = crearExcepcionValidacion([
      {
        property: "nombre",
        constraints: {
          isDefined: "name should not be null",
          isString: "name must be a string",
        },
        children: [],
      } as ValidationError,
    ]);

    expect(error.codigo).toBe("CAMPO_OBLIGATORIO");
    expect(error.erroresPublicos).toEqual([
      { campo: "nombre", mensaje: "Completa este campo obligatorio." },
    ]);
  });

  it("conserva la ruta de un campo anidado sin exponer mensajes internos", () => {
    const error = crearExcepcionValidacion([
      {
        property: "residencia",
        children: [
          {
            property: "paisResidenciaId",
            constraints: { matches: "internal validator message" },
            children: [],
          } as ValidationError,
        ],
      } as ValidationError,
    ]);

    expect(error.codigo).toBe("DATOS_INVALIDOS");
    expect(error.erroresPublicos).toEqual([
      {
        campo: "residencia.paisResidenciaId",
        mensaje: "El dato tiene un formato incorrecto.",
      },
    ]);
  });
});

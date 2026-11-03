import { describe, expect, it } from "vitest";

import { parseApiError } from "./api-error";

describe("parseApiError", () => {
  it("conserva el contrato institucional de errores", () => {
    const error = parseApiError({
      estado: 409,
      codigo: "VERSION_DESACTUALIZADA",
      mensaje: "Vuelve a consultar el registro.",
      errores: [],
      idSolicitud: "SOL-prueba",
    }, 409);

    expect(error.body.codigo).toBe("VERSION_DESACTUALIZADA");
    expect(error.body.idSolicitud).toBe("SOL-prueba");
  });
});

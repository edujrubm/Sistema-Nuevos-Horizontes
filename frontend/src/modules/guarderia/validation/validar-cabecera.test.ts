import { ApiError } from "@/shared/api/api-error";
import { describe, it, expect } from "vitest";

import { validarCabeceraGuarderia } from "./validar-cabecera";
describe("Cabecera Guardería: errores comprensibles y conversión segura", () => {
  it("conserva Guatemala y permite el identificador 0067", () => {
    expect(validarCabeceraGuarderia("2026-11-13T10:30", "0067")).toEqual({
      fechaAtencion: "2026-11-13T16:30:00.000Z",
      profesionalId: "67",
    });
  });
  it.each(["", "2026-02-30T10:30", "2026-13-01T10:30"])(
    "señala la fecha inválida %s sin lanzar RangeError",
    (fecha) => {
      try {
        validarCabeceraGuarderia(fecha, "67");
        throw Error("Debió fallar");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).errores).toEqual([
          expect.objectContaining({ campo: "fechaAtencion" }),
        ]);
      }
    },
  );
  it.each(["0", "abc", "9223372036854775808"])(
    "rechaza identificador inválido %s sin pérdida de precisión",
    (id) => {
      expect(() => validarCabeceraGuarderia("2026-11-13T10:30", id)).toThrow(
        ApiError,
      );
    },
  );
  it("señala ambos campos cuando faltan", () => {
    try {
      validarCabeceraGuarderia("", "");
      throw Error("Debió fallar");
    } catch (error) {
      expect((error as ApiError).errores.map((e) => e.campo)).toEqual([
        "fechaAtencion",
        "profesionalId",
      ]);
    }
  });
});

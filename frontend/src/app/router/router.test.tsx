import { describe, expect, it } from "vitest";
import { matchRoutes } from "react-router-dom";
import { router } from "./router";
describe("Integración del router común", () => {
  it.each([
    "/beneficiarias",
    "/beneficiarias/100",
    "/fichas/nueva",
    "/fichas/borradores",
    "/beneficiarias/100/medicina",
    "/beneficiarias/100/medicina-infantil",
    "/beneficiarias/100/psicologia",
    "/beneficiarias/100/psicologia-infantil",
    "/albergue",
    "/albergue/ingreso",
    "/albergue/movimientos",
    "/albergue/cierres",
    "/albergue/historial",
    "/beneficiarias/100/social",
    "/beneficiarias/100/social/nueva",
    "/beneficiarias/100/legal",
    "/beneficiarias/100/fichas/12",
    "/beneficiarias/100/referencias",
    "/beneficiarias/100/referencias/nueva",
    "/beneficiarias/100/referencias/12",
    "/beneficiarias/100/guarderia",
    "/beneficiarias/100/guarderia/123",
    "/beneficiarias/100/evolucion",
  ])("%s conserva su pantalla dentro del layout común", (path) => {
    const matches = matchRoutes(router.routes, path);
    expect(matches).not.toBeNull();
    expect(matches?.at(-1)?.route.path).not.toBe("*");
    expect(matches?.[0].route.path).toBe("/");
    if (path.includes("guarderia/123"))
      expect(matches?.at(-1)?.params.hijoId).toBe("123");
  });
});

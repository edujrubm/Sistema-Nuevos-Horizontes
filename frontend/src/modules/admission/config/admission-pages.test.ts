import { describe, expect, it } from "vitest";

import { admissionPages, requiredSectionKeys } from "./admission-pages";

describe("admissionPages", () => {
  it("representa las ocho páginas y las diecinueve secciones del contrato", () => {
    expect(admissionPages).toHaveLength(8);
    expect(requiredSectionKeys).toHaveLength(19);
    expect(new Set(requiredSectionKeys).size).toBe(19);
  });

  it("usa exactamente los identificadores de página aceptados por la API", () => {
    expect(admissionPages.map((page) => page.key)).toEqual([
      "identificacion",
      "residencia",
      "datos-salud",
      "familia",
      "violencia",
      "riesgo",
      "referencias",
      "entrevista-cierre",
    ]);
  });
});

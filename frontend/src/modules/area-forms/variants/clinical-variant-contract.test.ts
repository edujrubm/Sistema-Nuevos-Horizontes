import { describe, expect, it } from "vitest";

import {
  clinicalVariantCodes,
  clinicalVariantContracts,
  isClinicalVariantCode,
  validateClinicalVariantCatalog,
} from "./clinical-variant-contract";
import type { AreaFormType } from "../api/area-forms-api";

function publishedType(
  code: (typeof clinicalVariantCodes)[number],
): AreaFormType {
  const contract = clinicalVariantContracts[code];
  return {
    codigo: code,
    descripcion: code,
    areaId: contract.area === "PSICOLOGIA" ? "2" : "3",
    area: contract.area,
    detalle: code.toLowerCase(),
    requiereNino: contract.subject === "NINO",
    admiteExamenMental: contract.supportsMentalExam,
    campos: [],
  };
}

describe("contrato de variantes clínicas", () => {
  it("reconoce únicamente los cinco códigos clínicos soportados", () => {
    expect(isClinicalVariantCode("PSICOLOGIA_MUJER")).toBe(true);
    expect(isClinicalVariantCode("MEDICINA_NINEZ")).toBe(true);
    expect(isClinicalVariantCode("LEGAL")).toBe(false);
  });

  it("acepta un catálogo completo y coherente", () => {
    const result = validateClinicalVariantCatalog(
      clinicalVariantCodes.map(publishedType),
    );

    expect(result).toEqual({ ready: true, missing: [], mismatches: [] });
  });

  it("detecta variantes ausentes y metadatos incompatibles", () => {
    const catalog = clinicalVariantCodes.slice(0, -1).map(publishedType);
    catalog[0] = { ...catalog[0], admiteExamenMental: false };

    const result = validateClinicalVariantCatalog(catalog);

    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(["MEDICINA_NINEZ"]);
    expect(result.mismatches).toContainEqual({
      code: "PSICOLOGIA_MUJER",
      field: "admiteExamenMental",
      expected: true,
      received: false,
    });
  });
});

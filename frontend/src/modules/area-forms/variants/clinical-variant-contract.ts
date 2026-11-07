import type { AreaFormType } from "../api/area-forms-api";

export const clinicalVariantCodes = [
  "PSICOLOGIA_MUJER",
  "PSICOLOGIA_NINEZ",
  "MEDICINA_MUJER",
  "MEDICINA_ADOLESCENTE",
  "MEDICINA_NINEZ",
] as const;

export type ClinicalVariantCode = (typeof clinicalVariantCodes)[number];
export type ClinicalArea = "PSICOLOGIA" | "MEDICINA";
export type ClinicalSubject = "BENEFICIARIA" | "NINO";

export interface ClinicalVariantContract {
  code: ClinicalVariantCode;
  area: ClinicalArea;
  subject: ClinicalSubject;
  supportsMentalExam: boolean;
}

export const clinicalVariantContracts: Readonly<
  Record<ClinicalVariantCode, ClinicalVariantContract>
> = Object.freeze({
  PSICOLOGIA_MUJER: {
    code: "PSICOLOGIA_MUJER",
    area: "PSICOLOGIA",
    subject: "BENEFICIARIA",
    supportsMentalExam: true,
  },
  PSICOLOGIA_NINEZ: {
    code: "PSICOLOGIA_NINEZ",
    area: "PSICOLOGIA",
    subject: "NINO",
    supportsMentalExam: true,
  },
  MEDICINA_MUJER: {
    code: "MEDICINA_MUJER",
    area: "MEDICINA",
    subject: "BENEFICIARIA",
    supportsMentalExam: false,
  },
  MEDICINA_ADOLESCENTE: {
    code: "MEDICINA_ADOLESCENTE",
    area: "MEDICINA",
    subject: "BENEFICIARIA",
    supportsMentalExam: false,
  },
  MEDICINA_NINEZ: {
    code: "MEDICINA_NINEZ",
    area: "MEDICINA",
    subject: "NINO",
    supportsMentalExam: false,
  },
});

export function isClinicalVariantCode(
  value: string,
): value is ClinicalVariantCode {
  return Object.hasOwn(clinicalVariantContracts, value);
}

export interface CatalogMismatch {
  code: ClinicalVariantCode;
  field: "requiereNino" | "admiteExamenMental";
  expected: boolean;
  received: boolean | null;
}

export interface ClinicalCatalogValidation {
  ready: boolean;
  missing: ClinicalVariantCode[];
  mismatches: CatalogMismatch[];
}

export function validateClinicalVariantCatalog(
  catalog: readonly AreaFormType[],
): ClinicalCatalogValidation {
  const byCode = new Map(catalog.map((item) => [item.codigo, item]));
  const missing: ClinicalVariantCode[] = [];
  const mismatches: CatalogMismatch[] = [];

  for (const code of clinicalVariantCodes) {
    const published = byCode.get(code);
    if (!published) {
      missing.push(code);
      continue;
    }

    const contract = clinicalVariantContracts[code];
    const requiresChild = contract.subject === "NINO";
    if (published.requiereNino !== requiresChild) {
      mismatches.push({
        code,
        field: "requiereNino",
        expected: requiresChild,
        received: published.requiereNino,
      });
    }
    if (published.admiteExamenMental !== contract.supportsMentalExam) {
      mismatches.push({
        code,
        field: "admiteExamenMental",
        expected: contract.supportsMentalExam,
        received: published.admiteExamenMental,
      });
    }
  }

  return {
    ready: missing.length === 0 && mismatches.length === 0,
    missing,
    mismatches,
  };
}

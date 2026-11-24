import { describe, expect, it } from "vitest";

import { admissionPages, requiredSectionKeys } from "./admission-pages";

describe("admissionPages", () => {
  it("representa las ocho páginas y las dieciocho secciones del contrato", () => {
    expect(admissionPages).toHaveLength(8);
    expect(requiredSectionKeys).toHaveLength(18);
    expect(new Set(requiredSectionKeys).size).toBe(18);
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

  it("modela el horario de la persona agresora con horas separadas", () => {
    const aggressors = admissionPages
      .find((page) => page.key === "familia")
      ?.sections.find((section) => section.key === "agresores");

    expect(aggressors?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "horarioInicio", type: "time" }),
        expect.objectContaining({ name: "horarioFin", type: "time" }),
      ]),
    );
    expect(aggressors?.fields.some((field) => field.name === "horario")).toBe(
      false,
    );
  });

  it("usa las opciones declaradas del formulario para datos generales", () => {
    const fields = admissionPages
      .find((page) => page.key === "datos-salud")
      ?.sections.find((section) => section.key === "datos-generales")?.fields;

    expect(
      fields
        ?.find((field) => field.name === "estadoCivilDeclarado")
        ?.options?.map((item) => item.value),
    ).toEqual([
      "Casada",
      "Soltera",
      "Unida",
      "Separada",
      "Divorciada",
      "Noviazgo",
      "Otra",
    ]);
    expect(
      fields?.find((field) => field.name === "ocupacionDeclarada")?.type,
    ).toBeUndefined();
    expect(
      fields?.find((field) => field.name === "nivelEscolaridadDeclarado")
        ?.options,
    ).toHaveLength(10);
  });
});

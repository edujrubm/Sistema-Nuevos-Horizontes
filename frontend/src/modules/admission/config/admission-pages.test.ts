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
      "Divorciada",
      "Separada",
      "Soltera",
      "Unida",
      "Viuda",
    ]);
    expect(
      fields?.find((field) => field.name === "ocupacionDeclarada")?.type,
    ).toBe("select");
    expect(
      fields?.find((field) => field.name === "situacionSocioeconomica")?.type,
    ).toBe("checkboxGroup");
    expect(
      fields?.find((field) => field.name === "nivelEscolaridadDeclarado")
        ?.options,
    ).toHaveLength(10);
  });

  it("incluye los nuevos datos de atención, salud y referencia interna", () => {
    const identification = admissionPages
      .find((page) => page.key === "identificacion")
      ?.sections.find((section) => section.key === "identificacion")?.fields;
    const health = admissionPages
      .find((page) => page.key === "datos-salud")
      ?.sections.find((section) => section.key === "salud")?.fields;
    const references = admissionPages
      .find((page) => page.key === "referencias")
      ?.sections.find((section) => section.key === "referencias")?.fields;

    expect(identification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "idiomaAtencion", type: "select" }),
        expect.objectContaining({ name: "estadoMigratorio" }),
      ]),
    );
    expect(
      identification?.find((field) => field.name === "idiomaAtencion")?.options,
    ).toHaveLength(22);
    expect(health).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "enGestacion" }),
        expect.objectContaining({ name: "tiempoGestacionSemanas" }),
        expect.objectContaining({
          name: "tiposDiscapacidad",
          type: "checkboxGroup",
        }),
      ]),
    );
    expect(
      references
        ?.find((field) => field.name === "referenciasInternas")
        ?.options?.map((option) => option.value),
    ).toContain("Guardería");
  });

  it("incorpora los catálogos entregados por la institución", () => {
    const violence = admissionPages.find((page) => page.key === "violencia");
    const risk = admissionPages.find((page) => page.key === "riesgo");
    const references = admissionPages.find(
      (page) => page.key === "referencias",
    );

    expect(
      violence?.sections
        .find((section) => section.key === "motivo-consulta")
        ?.fields.find((field) => field.name === "seleccion")?.options,
    ).toHaveLength(13);
    expect(
      violence?.sections
        .find((section) => section.key === "tipos-violencia")
        ?.fields.find((field) => field.name === "seleccion")
        ?.options?.map((option) => option.value),
    ).toContain("Laboral");
    expect(
      risk?.sections[0].fields
        .find((field) => field.name === "vinculosAgresores")
        ?.options?.map((option) => option.value),
    ).toEqual(expect.arrayContaining(["Ex compañero", "Concuño", "Yerno"]));
    expect(
      references?.sections
        .find((section) => section.key === "apoyo-recibido")
        ?.fields.find((field) => field.name === "externas")
        ?.options?.map((option) => option.value),
    ).toContain("INACIF");
  });

  it("marca como obligatorios los datos fuente de la reportería", () => {
    const required = admissionPages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.fields
          .filter((field) => field.required)
          .map((field) => `${section.key}.${field.name}`),
      ),
    );

    expect(required).toEqual(
      expect.arrayContaining([
        "identificacion.sexoDeclarado",
        "identificacion.nacionalidadDeclarada",
        "residencia.paisResidenciaId",
        "residencia.departamentoResidenciaId",
        "residencia.municipioResidenciaId",
        "residencia.direccionActual",
        "residencia.areaResidencial",
        "datos-generales.estadoCivilDeclarado",
        "datos-generales.etniaDeclarada",
        "datos-generales.ocupacionDeclarada",
        "datos-generales.nivelEscolaridadDeclarado",
        "agresores.relacionParentesco",
        "motivo-consulta.seleccion",
        "tipos-violencia.seleccion",
        "referencias.origen",
      ]),
    );
  });
});

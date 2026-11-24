import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFormVariantRegistry,
  FormVariantRenderer,
  type FormVariantComponentProps,
} from "./form-variant-registry";

afterEach(cleanup);

function PsychologyVariant({ readOnly }: FormVariantComponentProps) {
  return <p>Psicología {readOnly ? "solo lectura" : "editable"}</p>;
}

function MedicineVariant() {
  return <p>Medicina mujer</p>;
}

const value = { detail: {}, mentalExam: null };

describe("createFormVariantRegistry", () => {
  it("resuelve más de una variante por su código", () => {
    const registry = createFormVariantRegistry([
      { code: "PSICOLOGIA_MUJER", component: PsychologyVariant },
      { code: "MEDICINA_MUJER", component: MedicineVariant },
    ]);

    const { rerender } = render(
      <FormVariantRenderer
        type="PSICOLOGIA_MUJER"
        registry={registry}
        value={value}
        errors={[]}
        readOnly={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Psicología editable")).toBeInTheDocument();

    rerender(
      <FormVariantRenderer
        type="MEDICINA_MUJER"
        registry={registry}
        value={value}
        errors={[]}
        readOnly
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Medicina mujer")).toBeInTheDocument();
    expect(registry.codes()).toEqual(["PSICOLOGIA_MUJER", "MEDICINA_MUJER"]);
  });

  it("rechaza registros duplicados al construir el mapa", () => {
    expect(() =>
      createFormVariantRegistry([
        { code: "PSICOLOGIA_MUJER", component: PsychologyVariant },
        { code: "PSICOLOGIA_MUJER", component: PsychologyVariant },
      ]),
    ).toThrow("PSICOLOGIA_MUJER está registrada más de una vez");
  });

  it("usa un fallback seguro para variantes no registradas", () => {
    const onUnsupported = vi.fn();
    render(
      <FormVariantRenderer
        type="TIPO_DESCONOCIDO"
        registry={createFormVariantRegistry([])}
        value={value}
        errors={[]}
        readOnly={false}
        onChange={vi.fn()}
        onUnsupported={onUnsupported}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tipo de formulario no disponible",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver al listado" }));
    expect(onUnsupported).toHaveBeenCalledOnce();
  });
});

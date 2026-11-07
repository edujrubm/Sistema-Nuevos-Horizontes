import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";

import { PsychologyWomanVariant } from "./PsychologyWomanVariant";
import type { FormVariantValue } from "@/modules/area-forms/variants";

afterEach(cleanup);

function Harness({ readOnly = false }: { readOnly?: boolean }) {
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  return (
    <PsychologyWomanVariant
      value={value}
      errors={[]}
      readOnly={readOnly}
      onChange={setValue}
    />
  );
}

describe("PsychologyWomanVariant", () => {
  it("captura datos en las cuatro páginas del mockup", () => {
    render(<Harness />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Persona o institución referente" }),
      { target: { value: "Trabajo Social" } },
    );
    expect(screen.getByDisplayValue("Trabajo Social")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /motivo e historia/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Motivo de consulta" }),
      {
        target: { value: "Atención inicial" },
      },
    );
    expect(screen.getByDisplayValue("Atención inicial")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /examen y evaluación/i }),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Apariencia" }), {
      target: { value: "Adecuada" },
    });
    expect(screen.getByDisplayValue("Adecuada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /plan y cierre/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Plan terapéutico" }),
      {
        target: { value: "Seguimiento semanal" },
      },
    );
    expect(screen.getByDisplayValue("Seguimiento semanal")).toBeInTheDocument();
  });

  it("presenta errores asociados al contrato", () => {
    render(
      <PsychologyWomanVariant
        value={{ detail: {}, mentalExam: null }}
        errors={[
          {
            field: "detalle.fechaReferencia",
            message: "La fecha no es válida.",
          },
        ]}
        readOnly={false}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText("La fecha no es válida.")).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("bloquea los campos en modo de consulta", () => {
    render(<Harness readOnly />);

    expect(
      screen.getByRole("textbox", {
        name: "Persona o institución referente",
      }),
    ).toBeDisabled();
  });
});

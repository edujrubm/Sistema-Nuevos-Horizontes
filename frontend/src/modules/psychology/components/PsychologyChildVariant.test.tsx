import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { FormVariantValue } from "@/modules/area-forms/variants";
import { PsychologyChildVariant } from "./PsychologyChildVariant";

afterEach(cleanup);

function Harness({ readOnly = false }: { readOnly?: boolean }) {
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  return (
    <PsychologyChildVariant
      value={value}
      errors={[]}
      readOnly={readOnly}
      onChange={setValue}
    />
  );
}

describe("PsychologyChildVariant", () => {
  it("monta solo la página activa y conserva los valores al navegar", () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/fecha de referencia/i), {
      target: { value: "2026-11-08" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /referencia y antecedentes/i }),
    );
    expect(
      screen.queryByLabelText(/fecha de referencia/i),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/motivo de consulta/i), {
      target: { value: "Evaluación inicial" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /identificación y familia/i }),
    );
    expect(screen.getByDisplayValue("2026-11-08")).toBeInTheDocument();
  });

  it("no muestra Siguiente página en el cierre", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: /^plan$/i }));
    expect(
      screen.queryByRole("button", { name: "Siguiente página" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/plan terapéutico/i)).toBeInTheDocument();
  });

  it("bloquea los campos durante la consulta confirmada", () => {
    render(<Harness readOnly />);

    expect(screen.getByLabelText(/fecha de referencia/i)).toBeDisabled();
  });
});

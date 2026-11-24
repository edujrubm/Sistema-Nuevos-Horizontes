import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { FormVariantValue } from "@/modules/area-forms/variants";
import {
  MedicineAdolescentVariant,
  MedicineChildVariantWithMother,
  MedicineWomanVariant,
} from "./MedicineBeneficiaryVariant";

afterEach(cleanup);

function WomanHarness() {
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  return (
    <MedicineWomanVariant
      value={value}
      errors={[]}
      readOnly={false}
      onChange={setValue}
    />
  );
}

function AdolescentHarness() {
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  return (
    <MedicineAdolescentVariant
      value={value}
      errors={[]}
      readOnly={false}
      onChange={setValue}
    />
  );
}

function ChildHarness() {
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  return (
    <MedicineChildVariantWithMother
      motherName="Beneficiaria de prueba"
      value={value}
      errors={[]}
      readOnly={false}
      onChange={setValue}
    />
  );
}

describe("MedicineBeneficiaryVariant", () => {
  it("muestra únicamente los bloques aplicables a la variante mujer", () => {
    render(<WomanHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Antecedentes" }));
    expect(
      screen.getByRole("textbox", { name: "Antecedentes de importancia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Esquema de vacunación" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Examen" }));
    expect(
      screen.getByRole("textbox", { name: "Examen ginecológico" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Genitales" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /plan y cierre/i }));
    expect(
      screen.queryByRole("button", { name: "Siguiente página" }),
    ).not.toBeInTheDocument();
  });

  it("muestra vacunación, nacimiento y antecedentes de adolescente", () => {
    render(<AdolescentHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Antecedentes" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Esquema de vacunación" }),
      { target: { value: "Esquema referido" } },
    );
    expect(screen.getByDisplayValue("Esquema referido")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Condiciones al nacer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Antecedentes patológicos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Antecedentes de importancia" }),
    ).not.toBeInTheDocument();
  });

  it("muestra los campos infantiles sin bloques ginecológicos", () => {
    render(<ChildHarness />);

    expect(
      screen.getByRole("combobox", { name: "Persona responsable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "Beneficiaria madre: Beneficiaria de prueba",
      }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Persona responsable" }),
      { target: { value: "other" } },
    );
    expect(
      screen.getByRole("textbox", {
        name: "Nombre de la persona responsable",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Antecedentes" }));
    expect(
      screen.getByRole("textbox", { name: "Esquema de vacunación" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Condiciones al nacer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Antecedentes patológicos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Antecedentes ginecológicos" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Examen" }));
    expect(
      screen.queryByRole("textbox", { name: "Examen ginecológico" }),
    ).not.toBeInTheDocument();
  });

  it("asocia los errores del backend con el campo médico", () => {
    render(
      <MedicineWomanVariant
        value={{ detail: {}, mentalExam: null }}
        errors={[
          {
            field: "detalle.motivoConsulta",
            message: "El motivo es obligatorio.",
          },
        ]}
        readOnly={false}
        onChange={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /motivo y HEA/i }));
    expect(screen.getByText("El motivo es obligatorio.")).toHaveAttribute(
      "role",
      "alert",
    );
  });
});

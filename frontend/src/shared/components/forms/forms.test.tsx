import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  FormActions,
  FormErrorSummary,
  FormProgressSummary,
  FormSection,
  FormStepNavigation,
  SelectField,
  TextAreaField,
  TextField,
  type FormStep,
} from ".";

const steps: FormStep[] = [
  { id: "identification", label: "Identificación", status: "complete" },
  { id: "history", label: "Motivo e historia", status: "current" },
  { id: "evaluation", label: "Evaluación", status: "pending" },
];

describe("componentes compartidos de formulario", () => {
  it("asocia etiquetas, ayudas y errores con sus controles", () => {
    render(
      <FormSection title="Datos clínicos" badge="Sección 1">
        <TextField
          id="reason"
          label="Motivo de consulta"
          hint="Describe el motivo principal."
          error="Este campo es obligatorio."
          required
        />
        <SelectField id="attitude" label="Actitud">
          <option value="">Seleccionar</option>
          <option value="collaborative">Colaboradora</option>
        </SelectField>
        <TextAreaField id="notes" label="Observaciones" fullWidth />
      </FormSection>,
    );

    const input = screen.getByRole("textbox", { name: /motivo de consulta/i });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "reason-hint reason-error",
    );
    expect(screen.getByText("Este campo es obligatorio.")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(
      screen.getByRole("combobox", { name: "Actitud" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Observaciones" }),
    ).toBeInTheDocument();
  });

  it("expone el paso actual y permite solicitar otro paso", () => {
    const onStepChange = vi.fn();
    render(<FormStepNavigation steps={steps} onStepChange={onStepChange} />);

    expect(
      screen.getByRole("button", { name: /motivo e historia/i }),
    ).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByRole("button", { name: /evaluación/i }));
    expect(onStepChange).toHaveBeenCalledWith("evaluation");
  });

  it("muestra el progreso y el estado de cada paso", () => {
    render(<FormProgressSummary steps={steps} />);

    expect(screen.getByRole("progressbar")).toHaveValue(67);
    expect(screen.getByText("Paso 2 de 3")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Revisada")).toBeInTheDocument();
  });

  it("resume errores con enlaces a los campos", () => {
    render(
      <FormErrorSummary
        errors={[
          { fieldId: "reason", label: "Motivo", message: "Es obligatorio" },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Motivo: Es obligatorio" }),
    ).toHaveAttribute("href", "#reason");
  });

  it("ejecuta acciones y comunica el estado de guardado", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const { rerender } = render(
      <FormActions
        onPrevious={onPrevious}
        onNext={onNext}
        statusMessage="Borrador guardado"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente página" }));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(screen.getByText("Borrador guardado")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    rerender(<FormActions onNext={onNext} busy />);
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });
});

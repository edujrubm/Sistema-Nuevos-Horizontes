import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AreaFormList } from "./AreaFormList";
import { AreaFormShell } from "./AreaFormShell";
import { NewAreaFormPanel } from "./NewAreaFormPanel";
import type { AreaForm } from "../api/area-forms-api";
import { TextField } from "@/shared/components/forms";

afterEach(cleanup);

function form(overrides: Partial<AreaForm> = {}): AreaForm {
  return {
    id: "15",
    expedienteId: "10",
    ninoId: null,
    areaId: "2",
    area: "Psicología",
    tipo: "PSICOLOGIA_MUJER",
    estado: "BORRADOR",
    fechaAtencion: "2026-11-06T12:00:00.000Z",
    profesionalId: "3",
    capturadoPor: "4",
    creadoEn: "2026-11-06T12:00:00.000Z",
    actualizadoEn: "2026-11-06T12:00:00.000Z",
    version: 2,
    detalle: {},
    examenMental: null,
    ...overrides,
  };
}

describe("AreaFormList", () => {
  it("distingue borradores y fichas confirmadas", () => {
    const onOpen = vi.fn();
    render(
      <AreaFormList
        forms={[form(), form({ id: "16", estado: "CONFIRMADO" })]}
        onOpen={onOpen}
        onCreate={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "15" }));
  });

  it("presenta estados de carga, error y vacío", () => {
    const props = {
      forms: [],
      onOpen: vi.fn(),
      onCreate: vi.fn(),
      onRetry: vi.fn(),
    };
    const { rerender } = render(<AreaFormList {...props} loading />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando formularios",
    );

    rerender(<AreaFormList {...props} error="Error de red" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error de red");

    rerender(<AreaFormList {...props} />);
    expect(screen.getByText("No hay fichas registradas")).toBeInTheDocument();
  });
});

describe("AreaFormShell", () => {
  it("exige un motivo para guardar y solo confirma cambios guardados", () => {
    const onSave = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <AreaFormShell
        form={form()}
        state="dirty"
        onSave={onSave}
        onConfirm={onConfirm}
        onReload={vi.fn()}
        onCancel={vi.fn()}
      >
        <TextField label="Motivo de consulta" defaultValue="Prueba" />
      </AreaFormShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(
      screen.getByText("Explica el motivo con al menos 3 caracteres."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByRole("textbox", { name: /motivo de la actualización/i }),
      { target: { value: "Actualización clínica" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(onSave).toHaveBeenCalledWith("Actualización clínica");

    expect(
      screen.getByRole("button", { name: "Revisar y confirmar" }),
    ).toBeDisabled();
    rerender(
      <AreaFormShell
        form={form()}
        state="saved"
        onSave={onSave}
        onConfirm={onConfirm}
        onReload={vi.fn()}
        onCancel={vi.fn()}
      >
        <TextField label="Motivo de consulta" defaultValue="Prueba" />
      </AreaFormShell>,
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /motivo de la actualización/i }),
      { target: { value: "Actualización clínica" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Revisar y confirmar" }),
    );
    expect(screen.getByText(/después de confirmar/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar definitivamente" }),
    );
    expect(onConfirm).toHaveBeenCalledWith("Actualización clínica");
  });

  it("bloquea la edición de una ficha confirmada", () => {
    render(
      <AreaFormShell
        form={form({ estado: "CONFIRMADO" })}
        state="idle"
        onSave={vi.fn()}
        onConfirm={vi.fn()}
        onReload={vi.fn()}
        onCancel={vi.fn()}
      >
        <TextField label="Motivo de consulta" defaultValue="Prueba" />
      </AreaFormShell>,
    );

    expect(
      screen.getByRole("textbox", { name: "Motivo de consulta" }),
    ).toBeDisabled();
    expect(
      screen.getByText("La información se muestra en modo de solo lectura."),
    ).toBeInTheDocument();
  });

  it("ofrece recargar cuando existe un conflicto", () => {
    const onReload = vi.fn();
    render(
      <AreaFormShell
        form={form()}
        state="conflict"
        onSave={vi.fn()}
        onConfirm={vi.fn()}
        onReload={onReload}
        onCancel={vi.fn()}
      >
        <TextField label="Motivo de consulta" />
      </AreaFormShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Recargar versión" }));
    expect(onReload).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("textbox", { name: "Motivo de consulta" }),
    ).toBeDisabled();
  });
});

describe("NewAreaFormPanel", () => {
  const types = [
    {
      codigo: "PSICOLOGIA_MUJER",
      descripcion: "Psicología para beneficiaria",
      areaId: "2",
      area: "Psicología",
      detalle: "psicologia_mujer",
      requiereNino: false,
      admiteExamenMental: true,
      campos: [],
    },
    {
      codigo: "PSICOLOGIA_NINEZ",
      descripcion: "Psicología infantil",
      areaId: "2",
      area: "Psicología",
      detalle: "psicologia_ninez",
      requiereNino: true,
      admiteExamenMental: true,
      campos: [],
    },
  ];

  it("crea una ficha de beneficiaria con el profesional de la sesión", () => {
    const onCreate = vi.fn();
    render(
      <NewAreaFormPanel
        types={types}
        professionalId="3"
        onCreate={onCreate}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: /tipo de ficha/i }), {
      target: { value: "PSICOLOGIA_MUJER" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "PSICOLOGIA_MUJER",
        profesionalId: "3",
        detalle: {},
      }),
    );
  });

  it("solicita una hija o hijo para las variantes infantiles", () => {
    const onCreate = vi.fn();
    render(
      <NewAreaFormPanel
        types={types}
        professionalId="3"
        childrenOptions={[{ id: "8", name: "Persona infantil" }]}
        onCreate={onCreate}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: /tipo de ficha/i }), {
      target: { value: "PSICOLOGIA_NINEZ" },
    });
    const childSelect = screen.getByRole("combobox", {
      name: /niña o niño vinculado/i,
    });
    expect(childSelect).toBeRequired();
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(childSelect, { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ ninoId: "8" }),
    );
  });

  it("bloquea la creación cuando falta el contexto profesional", () => {
    render(
      <NewAreaFormPanel types={types} onCreate={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(
      screen.getByText("Falta el contexto profesional."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear borrador" }),
    ).toBeDisabled();
  });
});

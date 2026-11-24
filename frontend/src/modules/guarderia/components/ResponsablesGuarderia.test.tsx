import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { ApiError } from "@/shared/api/api-error";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResponsablesGuarderia } from "./ResponsablesGuarderia";
import { responsablesApi } from "../api/responsables-api";
const registro = {
  id: "1",
  formularioId: "20",
  nombre: "Gabriela ficticia",
  cui: "0000000000067",
  relacion: "Abuela",
  telefono: "55550067",
  creadoEn: "2026-11-13",
  actualizadoEn: "2026-11-13",
};
const props = () => ({
  beneficiariaId: "100",
  fichaId: "20",
  version: 3,
  editable: true,
  visible: true,
  onSaved: vi.fn(),
  onDirty: vi.fn(),
});
beforeEach(() => {
  vi.spyOn(responsablesApi, "listar").mockResolvedValue({
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
    version: 3,
  });
  vi.spyOn(responsablesApi, "guardar").mockResolvedValue({
    responsable: registro,
    version: 4,
  });
});
async function llenar() {
  for (const [label, value] of [
    ["Nombre completo", registro.nombre],
    ["DPI/CUI", registro.cui],
    ["Relación o parentesco", registro.relacion],
    ["Teléfono", registro.telefono],
  ])
    await userEvent.type(screen.getByRole("textbox", { name: label }), value);
}
describe("Responsables autorizados de Guardería", () => {
  it("guarda en la ficha correcta, conserva CUI con ceros y comunica la nueva versión", async () => {
    const p = props();
    render(<ResponsablesGuarderia {...p} />);
    await screen.findByText("No hay responsables registrados en esta ficha.");
    await llenar();
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar responsable" }),
    );
    await waitFor(() => expect(p.onSaved).toHaveBeenCalledWith(4));
    expect(responsablesApi.guardar).toHaveBeenCalledWith(
      "100",
      "20",
      expect.objectContaining({
        cui: registro.cui,
        nombre: registro.nombre,
        relacion: registro.relacion,
        telefono: registro.telefono,
        version: 3,
      }),
      undefined,
    );
    expect(
      screen.getByRole("textbox", { name: "Nombre completo" }),
    ).toHaveValue("");
  });
  it("mantiene datos y muestra el campo rechazado sin reintentar automáticamente", async () => {
    vi.mocked(responsablesApi.guardar).mockRejectedValue(
      new ApiError({
        estado: 400,
        codigo: "DATOS_INVALIDOS",
        mensaje: "Revisa los datos.",
        errores: [{ campo: "telefono", mensaje: "Revisa el teléfono." }],
        idSolicitud: "no-disponible",
      }),
    );
    render(<ResponsablesGuarderia {...props()} />);
    await llenar();
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar responsable" }),
    );
    await screen.findByText("telefono: Revisa el teléfono.");
    expect(screen.getByRole("textbox", { name: "Teléfono" })).toHaveValue(
      registro.telefono,
    );
    expect(responsablesApi.guardar).toHaveBeenCalledTimes(1);
  });
  it("conflicto de versión bloquea otro guardado y conserva la captura", async () => {
    vi.mocked(responsablesApi.guardar).mockRejectedValue(
      new ApiError({
        estado: 409,
        codigo: "VERSION_DESACTUALIZADA",
        mensaje: "Recarga la ficha.",
        errores: [],
        idSolicitud: "no-disponible",
      }),
    );
    render(<ResponsablesGuarderia {...props()} />);
    await llenar();
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar responsable" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar responsable" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole("textbox", { name: "Nombre completo" }),
    ).toHaveValue(registro.nombre);
  });
  it("consulta sin controles de captura y carga registros existentes", async () => {
    vi.mocked(responsablesApi.listar).mockResolvedValue({
      datos: [registro],
      total: 1,
      pagina: 1,
      limite: 20,
      version: 3,
    });
    render(<ResponsablesGuarderia {...props()} editable={false} />);
    await screen.findByText(registro.nombre);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar responsable" }),
    ).not.toBeInTheDocument();
  });
  it("cambiar de sección conserva lo escrito", async () => {
    const p = props();
    const view = render(<ResponsablesGuarderia {...p} />);
    await llenar();
    view.rerender(<ResponsablesGuarderia {...p} visible={false} />);
    view.rerender(<ResponsablesGuarderia {...p} />);
    expect(
      screen.getByRole("textbox", { name: "Nombre completo" }),
    ).toHaveValue(registro.nombre);
  });
  it("una corrección exige motivo y usa la versión de la ficha", async () => {
    vi.mocked(responsablesApi.listar).mockResolvedValue({
      datos: [registro],
      total: 1,
      pagina: 1,
      limite: 20,
      version: 3,
    });
    render(<ResponsablesGuarderia {...props()} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Editar " + registro.nombre }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Motivo de la corrección" }),
      "Corrección de contacto",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Teléfono" }),
      "1",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar responsable" }),
    );
    await waitFor(() =>
      expect(responsablesApi.guardar).toHaveBeenCalledWith(
        "100",
        "20",
        expect.objectContaining({
          motivo: "Corrección de contacto",
          version: 3,
        }),
        "1",
      ),
    );
  });
});

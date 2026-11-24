import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { ApiError } from "@/shared/api/api-error";
import { beforeEach, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PadresGuarderia } from "./PadresGuarderia";
import { padresApi } from "../api/padres-api";

const padre = {
  id: "11",
  ninoId: "100",
  tipoVinculo: "BIOLOGICO" as const,
  nombre: "Carlos ficticio",
  cui: "0000000000067",
  telefono: null,
  direccion: null,
  version: 2,
  creadoEn: "2026-11-13",
  actualizadoEn: "2026-11-13",
};
const props = () => ({
  beneficiariaId: "100",
  ninoId: "100",
  visible: true,
  editable: true,
  onDirty: vi.fn(),
});
beforeEach(() => {
  vi.spyOn(padresApi, "listar").mockResolvedValue({
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
  });
  vi.spyOn(padresApi, "crear").mockResolvedValue(padre);
  vi.spyOn(padresApi, "editar").mockResolvedValue({ ...padre, version: 3 });
});
it("captura al padre desde Guardería y conserva ceros del CUI", async () => {
  render(<PadresGuarderia {...props()} />);
  await screen.findByText("No hay datos del padre registrados para este niño.");
  await userEvent.type(
    screen.getByRole("textbox", { name: "Nombre del padre" }),
    padre.nombre,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "DPI/CUI del padre" }),
    padre.cui,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar datos del padre" }),
  );
  await screen.findByText("Datos del padre guardados.");
  expect(padresApi.crear).toHaveBeenCalledWith(
    "100",
    "100",
    expect.objectContaining({
      nombre: padre.nombre,
      cui: padre.cui,
      tipoVinculo: "BIOLOGICO",
      telefono: null,
    }),
  );
});
it("admite vínculo legal con datos incompletos sin obligar a inventarlos", async () => {
  render(<PadresGuarderia {...props()} />);
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Vínculo con el niño" }),
    "LEGAL",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar datos del padre" }),
  );
  await waitFor(() =>
    expect(padresApi.crear).toHaveBeenCalledWith("100", "100", {
      tipoVinculo: "LEGAL",
      nombre: null,
      cui: null,
      telefono: null,
      direccion: null,
    }),
  );
});
it("corrige con versión del padre y motivo obligatorio", async () => {
  vi.mocked(padresApi.listar).mockResolvedValue({
    datos: [padre],
    total: 1,
    pagina: 1,
    limite: 20,
  });
  render(<PadresGuarderia {...props()} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Editar Carlos ficticio" }),
  );
  expect(
    screen.getByRole("textbox", { name: "Motivo de la corrección" }),
  ).toBeRequired();
  await userEvent.type(
    screen.getByRole("textbox", { name: "Teléfono del padre" }),
    "55550067",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Motivo de la corrección" }),
    "Corrección ficticia",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar datos del padre" }),
  );
  await waitFor(() =>
    expect(padresApi.editar).toHaveBeenCalledWith(
      "100",
      "100",
      "11",
      expect.objectContaining({ telefono: "55550067" }),
      2,
      "Corrección ficticia",
    ),
  );
});
it("señala el campo rechazado conservando lo escrito", async () => {
  vi.mocked(padresApi.crear).mockRejectedValue(
    new ApiError({
      estado: 400,
      codigo: "DATOS_INVALIDOS",
      mensaje: "Revisa los datos.",
      errores: [{ campo: "telefono", mensaje: "Revisa el teléfono." }],
      idSolicitud: "no-disponible",
    }),
  );
  render(<PadresGuarderia {...props()} />);
  await userEvent.type(
    screen.getByRole("textbox", { name: "Teléfono del padre" }),
    "dato ficticio",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar datos del padre" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Teléfono del padre" }),
    ).toHaveAttribute("aria-invalid", "true"),
  );
  expect(
    screen.getByRole("textbox", { name: "Teléfono del padre" }),
  ).toHaveValue("dato ficticio");
});
it.each(["VERSION_DESACTUALIZADA", "RESULTADO_OPERACION_INCIERTO"])(
  "no reintenta automáticamente: %s",
  async (codigo) => {
    vi.mocked(padresApi.crear).mockRejectedValue(
      new ApiError({
        estado: 409,
        codigo: codigo,
        mensaje: "Revisar operación.",
        errores: [],
        idSolicitud: "no-disponible",
      }),
    );
    render(<PadresGuarderia {...props()} />);
    await userEvent.type(
      screen.getByRole("textbox", { name: "Nombre del padre" }),
      padre.nombre,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar datos del padre" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar datos del padre" }),
      ).toBeDisabled(),
    );
    expect(padresApi.crear).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("textbox", { name: "Nombre del padre" }),
    ).toHaveValue(padre.nombre);
  },
);
it("solo lectura no ofrece captura y muestra biológico o legal", async () => {
  vi.mocked(padresApi.listar).mockResolvedValue({
    datos: [padre],
    total: 1,
    pagina: 1,
    limite: 20,
  });
  render(<PadresGuarderia {...props()} editable={false} />);
  await screen.findByText("Padre biológico");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Guardar datos del padre" }),
  ).not.toBeInTheDocument();
});
it("conserva la captura al cambiar de sección", async () => {
  const p = props();
  const view = render(<PadresGuarderia {...p} />);
  await userEvent.type(
    screen.getByRole("textbox", { name: "Nombre del padre" }),
    padre.nombre,
  );
  view.rerender(<PadresGuarderia {...p} visible={false} />);
  view.rerender(<PadresGuarderia {...p} />);
  expect(screen.getByRole("textbox", { name: "Nombre del padre" })).toHaveValue(
    padre.nombre,
  );
});

import { describe, it, expect, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CapacidadesContext } from "@/app/capacidades";
import { BeneficiariaContext } from "@/shared/context/area-record-context";
import { ApiError } from "@/shared/api/http";
import { api as records } from "@/shared/api/area-records";
import { soloLectura, type Capacidades, type Ficha } from "@/shared/types/api";
import { legalApi } from "./api/legal-api";
import { LegalEditorPage } from "./pages/LegalEditorPage";
import { LegalListPage } from "./pages/LegalListPage";
import { AppLayout } from "@/app/layouts/AppLayout";

const caps: Capacidades = Object.fromEntries(
  Object.keys(soloLectura).map((key) => [key, true]),
) as unknown as Capacidades;
const record: Ficha = {
  id: "12",
  tipo: "LEGAL",
  estado: "BORRADOR",
  version: 1,
  profesionalId: "1",
  fechaAtencion: "2026-11-12T16:00:00Z",
  creadoEn: "2026-11-12T17:00:00Z",
  detalle: { demandadoNombreDeclarado: "Parte sintética" },
};
function mount(
  path: string,
  reference = false,
  list = false,
  capabilities = caps,
) {
  const element = (
    <CapacidadesContext.Provider value={capabilities}>
      <BeneficiariaContext.Provider
        value={{
          id: "100",
          nombre: "Actora sintética",
          cuiEnmascarado: null,
          fechaNacimiento: null,
          ocupacionId: null,
          estadoCivilId: null,
          residencia: null,
          fichaInicial: null,
        }}
      >
        {list ? (
          <LegalListPage reference={reference} />
        ) : (
          <LegalEditorPage reference={reference} />
        )}
      </BeneficiariaContext.Provider>
    </CapacidadesContext.Provider>
  );
  const router = createMemoryRouter(
    [
      { path: "/beneficiarias/:beneficiariaId/legal/nueva", element },
      { path: "/beneficiarias/:beneficiariaId/legal/:fichaId", element },
      { path: "/beneficiarias/:beneficiariaId/legal", element },
      { path: "/beneficiarias/:beneficiariaId/referencias/:fichaId", element },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
describe("Legal: formularios y rutas propias", () => {
  it("presenta navegación de Legal sin opciones de admisión", () => {
    const router = createMemoryRouter([{ element: <AppLayout />, children: [
      { path: "/beneficiarias/:id/legal", element: <p>Vista de prueba</p> },
    ] }], { initialEntries: ["/beneficiarias/100/legal"] });
    render(<RouterProvider router={router} />);
    const sidebar = within(screen.getByLabelText("Navegación principal"));
    expect(sidebar.getByRole("link", { name: "Ficha Legal" })).toHaveAttribute("href", "/beneficiarias/100/legal");
    expect(sidebar.getByRole("link", { name: "Referencias legales" })).toHaveAttribute("href", "/beneficiarias/100/referencias");
    expect(sidebar.queryByRole("link", { name: "Nueva ficha inicial" })).not.toBeInTheDocument();
  });
  it("crea LEGAL mediante el motor común, nunca SOCIAL", async () => {
    const create = vi.spyOn(records, "crearFicha").mockResolvedValue(record);
    await legalApi.create("100", false, {
      fechaAtencion: record.fechaAtencion,
      profesionalId: "1",
      detalle: {},
    });
    expect(create).toHaveBeenCalledWith(
      "100",
      expect.objectContaining({ tipo: "LEGAL" }),
    );
  });
  it("permite crear una ficha desde la ruta nueva y reabrirla", async () => {
    const create = vi.spyOn(legalApi, "create").mockResolvedValue(record);
    vi.spyOn(legalApi, "get").mockResolvedValue(record);
    const router = mount("/beneficiarias/100/legal/nueva");
    await screen.findByLabelText("Fecha de atención");
    fireEvent.change(screen.getByLabelText("Fecha de atención"), {
      target: { value: "2026-11-12T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Demandado"), {
      target: { value: "Parte sintética" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        "100",
        false,
        expect.objectContaining({ fechaAtencion: "2026-11-12T16:00:00.000Z" }),
      ),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/beneficiarias/100/legal/12",
      ),
    );
  });
  it("conserva los cambios si falla el guardado", async () => {
    vi.spyOn(legalApi, "get").mockResolvedValue(record);
    vi.spyOn(legalApi, "save").mockRejectedValue(
      new ApiError(
        503,
        "BASE_DATOS_NO_DISPONIBLE",
        "El servicio no está disponible.",
      ),
    );
    mount("/beneficiarias/100/legal/12");
    const input = await screen.findByLabelText("Demandado");
    fireEvent.change(input, {
      target: { value: "Cambio que debe conservarse" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await screen.findByRole("alert");
    expect(input).toHaveValue("Cambio que debe conservarse");
  });
  it("muestra cuatro secciones y confirma solo después de guardar y revisar", async () => {
    vi.spyOn(legalApi, "get").mockResolvedValue(record);
    const confirm = vi
      .spyOn(legalApi, "confirm")
      .mockResolvedValue({ ...record, estado: "CONFIRMADO", version: 2 });
    mount("/beneficiarias/100/legal/12");
    await screen.findByLabelText("Demandado");
    await userEvent.click(
      screen.getByRole("button", { name: "4 Diligenciamiento" }),
    );
    expect(
      screen.queryByRole("button", { name: "Siguiente página" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    );
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("12", false, 1));
    await screen.findByText("Registro en modo de consulta.");
  });
  it("no ofrece escrituras sin capacidades", async () => {
    vi.spyOn(legalApi, "get").mockResolvedValue(record);
    mount("/beneficiarias/100/legal/12", false, false, soloLectura);
    await screen.findByText("Parte sintética");
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar ficha" }),
    ).not.toBeInTheDocument();
  });
  it("bloquea guardar después de un conflicto y conserva el texto", async () => {
    vi.spyOn(legalApi, "get").mockResolvedValue(record);
    vi.spyOn(legalApi, "save").mockRejectedValue(
      new ApiError(
        409,
        "VERSION_DESACTUALIZADA",
        "Otra persona modificó este registro.",
      ),
    );
    mount("/beneficiarias/100/legal/12");
    fireEvent.change(await screen.findByLabelText("Demandado"), {
      target: { value: "Texto local" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await screen.findByRole("alert");
    expect(screen.getByText("Texto local")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeDisabled();
  });
  it("permite corregir referencias confirmadas con motivo", async () => {
    vi.spyOn(legalApi, "get").mockResolvedValue({
      ...record,
      tipo: "REFERENCIA_LEGAL",
      estado: "CONFIRMADO",
      detalle: { destino: "Entidad sintética", motivoReferencia: "Prueba" },
    });
    const save = vi.spyOn(legalApi, "save").mockResolvedValue(record);
    mount("/beneficiarias/100/referencias/12", true);
    await userEvent.click(
      await screen.findByRole("button", { name: "Iniciar corrección" }),
    );
    fireEvent.change(screen.getByLabelText("Origen"), {
      target: { value: "Origen sintético" },
    });
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo de la corrección"), {
      target: { value: "Corrección documentada" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        "12",
        true,
        1,
        "Corrección documentada",
        expect.objectContaining({ origen: "Origen sintético" }),
      ),
    );
  });
  it("conserva el motivo cuando falla el descarte desde el listado", async () => {
    vi.spyOn(legalApi, "list").mockResolvedValue({
      datos: [record],
      pagina: 1,
      limite: 20,
      total: 1,
    });
    vi.spyOn(legalApi, "discard").mockRejectedValue(
      new ApiError(503, "BASE_DATOS_NO_DISPONIBLE", "No disponible."),
    );
    mount("/beneficiarias/100/legal", false, true);
    await userEvent.click(
      await screen.findByRole("button", { name: "Descartar borrador" }),
    );
    fireEvent.change(screen.getByLabelText("Motivo del descarte"), {
      target: { value: "Borrador duplicado" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar descarte" }),
    );
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Motivo del descarte")).toHaveValue(
      "Borrador duplicado",
    );
  });
  it("impide presentar una ficha de otra área como Legal", async () => {
    vi.spyOn(records, "ficha").mockResolvedValue({ ...record, tipo: "SOCIAL" });
    await expect(
      legalApi.get("12", false, new AbortController().signal),
    ).rejects.toMatchObject({ codigo: "REGISTRO_NO_ENCONTRADO" });
  });
});

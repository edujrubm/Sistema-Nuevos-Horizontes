import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CapacidadesContext } from "@/app/capacidades";
import { BeneficiariaContext } from "@/shared/context/area-record-context";
import { ApiError } from "@/shared/api/http";
import { api as records } from "@/shared/api/area-records";
import { soloLectura, type Capacidades, type Ficha } from "@/shared/types/api";
import { socialApi } from "./api/social-api";
import { SocialEditorPage } from "./pages/SocialEditorPage";
import { SocialListPage } from "./pages/SocialListPage";
import { AppLayout } from "@/app/layouts/AppLayout";

const caps = Object.fromEntries(
  Object.keys(soloLectura).map((key) => [key, true]),
) as unknown as Capacidades;
const draft: Ficha = {
  id: "20",
  tipo: "SOCIAL",
  estado: "BORRADOR",
  version: 3,
  profesionalId: "1",
  fechaAtencion: "2026-11-13T15:00:00Z",
  detalle: { dependenciaEconomica: null },
};
function mount(
  path = "/beneficiarias/100/social/20",
  list = false,
  capabilities = caps,
) {
  const element = (
    <CapacidadesContext.Provider value={capabilities}>
      <BeneficiariaContext.Provider
        value={{
          id: "100",
          nombre: "Beneficiaria sintética",
          cuiEnmascarado: "***0123",
          fechaNacimiento: null,
          ocupacionId: null,
          estadoCivilId: null,
          residencia: null,
          fichaInicial: null,
        }}
      >
        {list ? <SocialListPage /> : <SocialEditorPage />}
      </BeneficiariaContext.Provider>
    </CapacidadesContext.Provider>
  );
  const router = createMemoryRouter(
    [
      { path: "/beneficiarias/:beneficiariaId/social", element },
      { path: "/beneficiarias/:beneficiariaId/social/nueva", element },
      { path: "/beneficiarias/:beneficiariaId/social/:fichaId", element },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
describe("Social: páginas propias", () => {
  it("la navegación de Social no muestra acciones de ficha inicial", () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppLayout />,
          children: [
            {
              path: "/beneficiarias/:id/social",
              element: <p>Vista Social de ensayo</p>,
            },
          ],
        },
      ],
      { initialEntries: ["/beneficiarias/100/social"] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText("Trabajo Social")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Nueva ficha inicial" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ficha social" })).toHaveAttribute(
      "href",
      "/beneficiarias/100/social",
    );
  });
  it("conserva cinco secciones, identidad protegida y textos al navegar", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    mount();
    const composition = await screen.findByLabelText("Composición familiar");
    fireEvent.change(composition, { target: { value: "Texto sintético" } });
    await userEvent.click(
      screen.getByRole("button", { name: "2 Historia de violencia" }),
    );
    expect(
      screen.getByLabelText("Historia de vida de la problemática de violencia"),
    ).toBeVisible();
    expect(
      screen.queryByLabelText("Composición familiar"),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "1 Identificación" }),
    );
    expect(screen.getByLabelText("Composición familiar")).toHaveValue(
      "Texto sintético",
    );
    expect(screen.getAllByText("***0123").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "5 Cierre" })).toBeVisible();
  });
  it("guarda con versión y conserva null en el booleano opcional", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    const save = vi
      .spyOn(socialApi, "save")
      .mockResolvedValue({ ...draft, version: 4 });
    mount();
    await screen.findByLabelText("Composición familiar");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        "20",
        3,
        { dependenciaEconomica: null },
        "2026-11-13T15:00:00.000Z",
        "1",
      ),
    );
  });
  it("crea Social, normaliza 0067 y usa la fecha de Guatemala", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    const create = vi.spyOn(socialApi, "create").mockResolvedValue(draft);
    const router = mount("/beneficiarias/100/social/nueva");
    fireEvent.change(await screen.findByLabelText("Fecha de atención"), {
      target: { value: "2026-11-13T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "0067" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith("100", {
        fechaAtencion: "2026-11-13T15:30:00.000Z",
        profesionalId: "67",
        detalle: {},
      }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/beneficiarias/100/social/20",
      ),
    );
  });
  it("confirmación exige revisión y cambios previamente guardados", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    const confirm = vi
      .spyOn(socialApi, "confirm")
      .mockResolvedValue({ ...draft, estado: "CONFIRMADO", version: 4 });
    mount();
    await screen.findByLabelText("Composición familiar");
    await userEvent.click(screen.getByRole("button", { name: "5 Cierre" }));
    expect(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    );
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("20", 3));
    expect(
      await screen.findByText("Registro en modo de consulta."),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Adjuntar PDF firmado" }),
    ).toHaveAttribute(
      "href",
      "/beneficiarias/100/documentos?tipo=SOCIAL&formularioId=20",
    );
    expect(
      screen.queryByRole("button", { name: "Guardar borrador" }),
    ).not.toBeInTheDocument();
  });
  it("los errores por campo abren su sección y mantienen los valores", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    vi.spyOn(socialApi, "save").mockRejectedValue(
      new ApiError(400, "DATOS_INVALIDOS", "Revisa los datos", [
        { campo: "detalle.observaciones", mensaje: "Revisa este campo." },
      ]),
    );
    mount();
    fireEvent.change(await screen.findByLabelText("Composición familiar"), {
      target: { value: "Conservar este texto" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await userEvent.click(
      await screen.findByRole("link", {
        name: "Observaciones: Revisa este campo.",
      }),
    );
    expect(screen.getByLabelText("Observaciones")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "1 Identificación" }),
    );
    expect(screen.getByLabelText("Composición familiar")).toHaveValue(
      "Conservar este texto",
    );
  });
  it("un conflicto bloquea otro guardado y conserva el borrador local", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    const save = vi
      .spyOn(socialApi, "save")
      .mockRejectedValue(
        new ApiError(409, "VERSION_DESACTUALIZADA", "Conflicto"),
      );
    mount();
    fireEvent.change(await screen.findByLabelText("Composición familiar"), {
      target: { value: "Texto sin perder" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await screen.findByRole("button", { name: "Volver a intentar" });
    expect(
      screen.getByRole("button", { name: "Guardar borrador" }),
    ).toBeDisabled();
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("solo lectura no permite guardar", async () => {
    vi.spyOn(socialApi, "get").mockResolvedValue(draft);
    mount(undefined, false, soloLectura);
    await screen.findByText("Identificación y contexto familiar");
    expect(
      screen.queryByRole("button", { name: "Guardar borrador" }),
    ).not.toBeInTheDocument();
  });
  it("listado conserva enlaces propios y el riesgo sin catálogo", async () => {
    vi.spyOn(socialApi, "list").mockResolvedValue({
      datos: [draft],
      pagina: 1,
      limite: 20,
      total: 1,
    });
    vi.spyOn(socialApi, "summary").mockResolvedValue({
      totalFichas: 1,
      totalRiesgos: null,
    });
    mount("/beneficiarias/100/social", true);
    expect(
      await screen.findByRole("link", { name: "Continuar" }),
    ).toHaveAttribute("href", "/beneficiarias/100/social/20");
    expect(await screen.findByText("Pendiente de catálogo")).toBeVisible();
  });
  it("descarte exige motivo y envía la versión vigente", async () => {
    vi.spyOn(socialApi, "list").mockResolvedValue({
      datos: [draft],
      pagina: 1,
      limite: 20,
      total: 1,
    });
    vi.spyOn(socialApi, "summary").mockResolvedValue({
      totalFichas: 1,
      totalRiesgos: null,
    });
    const discard = vi
      .spyOn(socialApi, "discard")
      .mockResolvedValue({ data: { ...draft, estado: "DESCARTADO" } });
    mount("/beneficiarias/100/social", true);
    await userEvent.click(
      await screen.findByRole("button", { name: "Descartar borrador" }),
    );
    expect(
      screen.getByRole("button", { name: "Confirmar descarte" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo del descarte"), {
      target: { value: " Ensayo de descarte " },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar descarte" }),
    );
    await waitFor(() =>
      expect(discard).toHaveBeenCalledWith("20", 3, "Ensayo de descarte"),
    );
  });
  it("la API del área rechaza una ficha de otro tipo", async () => {
    vi.spyOn(records, "ficha").mockResolvedValue({ ...draft, tipo: "LEGAL" });
    await expect(
      socialApi.get("20", new AbortController().signal),
    ).rejects.toMatchObject({ estado: 404 });
  });
});

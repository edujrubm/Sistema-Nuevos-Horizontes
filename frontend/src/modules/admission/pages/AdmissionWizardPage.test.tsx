import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getAdmission: vi.fn(),
  saveAdmissionPage: vi.fn(),
  confirmAdmission: vi.fn(),
}));

vi.mock("../api/admission-api", () => apiMocks);

import { AdmissionWizardPage } from "./AdmissionWizardPage";

function admission(
  secciones: Array<{
    seccion: string;
    contenido: Record<string, unknown>;
  }> = [],
) {
  return {
    data: {
      id: "1",
      expedienteId: "10",
      correlativo: "TEST-FI-001",
      lugar: "Centro de ensayo",
      fecha: "2026-11-05",
      estado: "BORRADOR" as const,
      version: 1,
      actualizadoEn: "2026-11-05T12:00:00.000Z",
      hijos: [],
      secciones: secciones.map((section, index) => ({
        id: String(index + 1),
        version: 1,
        actualizadoEn: "2026-11-05T12:00:00.000Z",
        ...section,
      })),
    },
  };
}

function renderWizard(startAtFirstPage = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/fichas/1",
            state: startAtFirstPage ? { startAtFirstPage: true } : undefined,
          },
        ]}
      >
        <Routes>
          <Route path="/fichas/:id" element={<AdmissionWizardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdmissionWizardPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    apiMocks.getAdmission.mockResolvedValue(admission());
    apiMocks.saveAdmissionPage.mockResolvedValue({
      data: {
        id: "1",
        estado: "BORRADOR",
        version: 2,
        pagina: "identificacion",
        seccionesGuardadas: ["identificacion"],
        hijos: [],
      },
    });
  });

  it("guarda la primera visita al presionar Siguiente y después avanza", async () => {
    renderWizard();
    expect(
      await screen.findByRole("heading", { name: "Datos de identificación" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Lugar de nacimiento"), {
      target: { value: "Guatemala" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(apiMocks.saveAdmissionPage).toHaveBeenCalledWith(
        "1",
        "identificacion",
        expect.objectContaining({
          secciones: {
            identificacion: expect.objectContaining({
              lugarNacimiento: "Guatemala",
            }),
          },
        }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Contacto y ubicación" }),
    ).toBeInTheDocument();
  });

  it("impide avanzar si una sección de la página está vacía", async () => {
    renderWizard();
    expect(
      await screen.findByRole("heading", { name: "Datos de identificación" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByText("Completa la página antes de continuar."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ingresa al menos un dato en esta sección."),
    ).toBeInTheDocument();
    expect(apiMocks.saveAdmissionPage).not.toHaveBeenCalled();
  });

  it("advierte si una página guardada cambió y se intenta avanzar sin Actualizar", async () => {
    apiMocks.getAdmission.mockResolvedValue(
      admission([
        {
          seccion: "identificacion",
          contenido: { lugarNacimiento: "Guatemala" },
        },
      ]),
    );
    renderWizard();
    expect(
      await screen.findByRole("heading", { name: "Contacto y ubicación" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Identificación/ }));
    expect(await screen.findByDisplayValue("Guatemala")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Lugar de nacimiento"), {
      target: { value: "Quetzaltenango" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByText(
        "Los cambios de esta página todavía no están actualizados.",
      ),
    ).toBeInTheDocument();
    expect(apiMocks.saveAdmissionPage).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled();
  });

  it("abre el paso uno inmediatamente después de crear el borrador", async () => {
    apiMocks.getAdmission.mockResolvedValue(
      admission([
        {
          seccion: "identificacion",
          contenido: { tipoDocumento: "DPI_CUI" },
        },
      ]),
    );

    renderWizard(true);

    expect(
      await screen.findByRole("heading", { name: "Datos de identificación" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 8")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actualizar" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Lugar de nacimiento"), {
      target: { value: "Quetzaltenango" },
    });
    expect(
      screen.queryByRole("button", { name: "Actualizar" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(apiMocks.saveAdmissionPage).toHaveBeenCalledWith(
        "1",
        "identificacion",
        expect.objectContaining({
          secciones: {
            identificacion: expect.objectContaining({
              lugarNacimiento: "Quetzaltenango",
            }),
          },
        }),
      ),
    );
    expect(
      screen.queryByText(
        "Los cambios de esta página todavía no están actualizados.",
      ),
    ).not.toBeInTheDocument();
  });

  it("impide combinar Ninguna con una discapacidad declarada", async () => {
    apiMocks.getAdmission.mockResolvedValue(
      admission([
        {
          seccion: "identificacion",
          contenido: { lugarNacimiento: "Guatemala" },
        },
        {
          seccion: "residencia",
          contenido: { direccionActual: "Dirección de prueba" },
        },
      ]),
    );

    renderWizard();

    const visual = await screen.findByLabelText("Discapacidad visual");
    const ninguna = screen.getByLabelText("Ninguna");
    const auditiva = screen.getByLabelText("Discapacidad auditiva");

    fireEvent.click(visual);
    expect(visual).toBeChecked();
    fireEvent.click(ninguna);
    expect(ninguna).toBeChecked();
    expect(visual).not.toBeChecked();
    fireEvent.click(auditiva);
    expect(auditiva).toBeChecked();
    expect(ninguna).not.toBeChecked();
  });
});

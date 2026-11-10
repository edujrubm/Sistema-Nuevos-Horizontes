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
  getBeneficiary: vi.fn(),
  listAreaForms: vi.fn(),
  listAreaFormTypes: vi.fn(),
  getAreaForm: vi.fn(),
  createAreaForm: vi.fn(),
  updateAreaForm: vi.fn(),
  confirmAreaForm: vi.fn(),
  discardAreaForm: vi.fn(),
}));

vi.mock("@/modules/beneficiaries/api/beneficiaries-api", () => ({
  getBeneficiary: apiMocks.getBeneficiary,
}));
vi.mock("@/modules/area-forms/api/area-forms-api", () => ({
  listAreaForms: apiMocks.listAreaForms,
  listAreaFormTypes: apiMocks.listAreaFormTypes,
  getAreaForm: apiMocks.getAreaForm,
  createAreaForm: apiMocks.createAreaForm,
  updateAreaForm: apiMocks.updateAreaForm,
  confirmAreaForm: apiMocks.confirmAreaForm,
  discardAreaForm: apiMocks.discardAreaForm,
}));

import { MedicineBeneficiaryPage } from "./MedicineBeneficiaryPage";

const areaForm = {
  id: "25",
  expedienteId: "10",
  ninoId: null,
  areaId: "5",
  area: "Medicina",
  tipo: "MEDICINA_MUJER",
  estado: "BORRADOR",
  fechaAtencion: "2026-11-08T12:00:00.000Z",
  profesionalId: "3",
  capturadoPor: "4",
  creadoEn: "2026-11-08T12:00:00.000Z",
  actualizadoEn: "2026-11-08T12:00:00.000Z",
  version: 2,
  detalle: {},
  examenMental: null,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/beneficiarias/7/medicina"]}>
        <Routes>
          <Route
            path="/beneficiarias/:beneficiaryId/medicina"
            element={<MedicineBeneficiaryPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MedicineBeneficiaryPage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_DEV_PROFESSIONAL_ID", "3");
    apiMocks.getBeneficiary.mockResolvedValue({
      id: "7",
      nombre: "Beneficiaria de prueba",
      version: 1,
      expediente: { id: "10", activo: true, version: 1 },
      fichaInicial: null,
    });
    apiMocks.listAreaForms.mockResolvedValue({
      data: [areaForm],
      page: { nextCursor: null, hasMore: false },
    });
    apiMocks.listAreaFormTypes.mockResolvedValue({
      data: [
        {
          codigo: "MEDICINA_MUJER",
          descripcion: "Consulta médica para mujer",
          areaId: "5",
          area: "Medicina",
          detalle: "consulta_medica_adulta",
          requiereNino: false,
          admiteExamenMental: false,
          campos: [],
        },
        {
          codigo: "MEDICINA_ADOLESCENTE",
          descripcion: "Consulta médica para mujer adolescente",
          areaId: "5",
          area: "Medicina",
          detalle: "consulta_medica_adolescente",
          requiereNino: false,
          admiteExamenMental: false,
          campos: [],
        },
      ],
      estados: {
        codigos: {
          borrador: "BORRADOR",
          confirmado: "CONFIRMADO",
          descartado: "DESCARTADO",
        },
        catalogo: [],
        listo: true,
      },
    });
    apiMocks.getAreaForm.mockResolvedValue({ data: areaForm });
    apiMocks.updateAreaForm.mockResolvedValue({
      data: {
        ...areaForm,
        version: 3,
        detalle: { motivoConsulta: "Control médico" },
      },
    });
    apiMocks.confirmAreaForm.mockResolvedValue({
      data: { ...areaForm, estado: "CONFIRMADO", version: 4 },
    });
    apiMocks.createAreaForm.mockResolvedValue({
      data: { ...areaForm, id: "26", tipo: "MEDICINA_ADOLESCENTE" },
    });
    apiMocks.discardAreaForm.mockResolvedValue({
      data: { ...areaForm, estado: "DESCARTADO", version: 3 },
    });
  });

  it("lista por el área médica, abre y guarda un borrador", async () => {
    renderPage();

    expect(
      await screen.findByText("Beneficiaria de prueba", { exact: false }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(apiMocks.listAreaForms).toHaveBeenCalledWith(
        "7",
        { areaId: "5", limit: 25 },
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: /motivo y HEA/i }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /motivo de consulta/i }),
      { target: { value: "Control médico" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() =>
      expect(apiMocks.updateAreaForm).toHaveBeenCalledWith(
        "25",
        expect.objectContaining({
          version: 2,
          motivo: "Guardado de borrador",
          detalle: expect.objectContaining({ motivoConsulta: "Control médico" }),
        }),
      ),
    );

    const reviewButton = screen.getByRole("button", {
      name: "Revisar y confirmar",
    });
    await waitFor(() => expect(reviewButton).toBeEnabled());
    fireEvent.click(reviewButton);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar definitivamente" }),
    );
    await waitFor(() =>
      expect(apiMocks.confirmAreaForm).toHaveBeenCalledWith(
        "25",
        3,
        "Confirmación inicial de ficha",
      ),
    );
  });

  it("permite elegir explícitamente la variante adolescente al crear", async () => {
    apiMocks.listAreaForms.mockResolvedValue({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Nueva ficha" }));
    expect(
      screen.getByRole("option", { name: "Consulta médica para mujer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "Consulta médica para mujer adolescente",
      }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("combobox", { name: /tipo de ficha/i }),
      {
        target: { value: "MEDICINA_ADOLESCENTE" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));

    await waitFor(() =>
      expect(apiMocks.createAreaForm).toHaveBeenCalledWith(
        "7",
        expect.objectContaining({
          tipo: "MEDICINA_ADOLESCENTE",
          profesionalId: "3",
          detalle: {},
        }),
      ),
    );
  });
});

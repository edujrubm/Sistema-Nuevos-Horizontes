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
}));

import { PsychologyBeneficiaryPage } from "./PsychologyBeneficiaryPage";

const areaForm = {
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
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/beneficiarias/7/psicologia"]}>
        <Routes>
          <Route
            path="/beneficiarias/:beneficiaryId/psicologia"
            element={<PsychologyBeneficiaryPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PsychologyBeneficiaryPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
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
          codigo: "PSICOLOGIA_MUJER",
          descripcion: "Psicología para beneficiaria",
          areaId: "2",
          area: "Psicología",
          detalle: "psicologia_mujer",
          requiereNino: false,
          admiteExamenMental: true,
          campos: [],
        },
      ],
      estados: {
        codigos: { borrador: "BORRADOR", confirmado: "CONFIRMADO" },
        catalogo: [],
        listo: true,
      },
    });
    apiMocks.getAreaForm.mockResolvedValue({ data: areaForm });
    apiMocks.updateAreaForm.mockResolvedValue({
      data: {
        ...areaForm,
        version: 3,
        detalle: { motivoConsulta: "Atención inicial" },
      },
    });
  });

  it("lista, abre y guarda un borrador psicológico", async () => {
    renderPage();

    expect(
      await screen.findByText("Beneficiaria de prueba", { exact: false }),
    ).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByRole("heading", { name: "PSICOLOGIA_MUJER" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /motivo e historia/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Motivo de consulta" }),
      {
        target: { value: "Atención inicial" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /motivo de la actualización o confirmación/i,
      }),
      { target: { value: "Actualización de prueba" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() =>
      expect(apiMocks.updateAreaForm).toHaveBeenCalledWith(
        "15",
        expect.objectContaining({
          version: 2,
          motivo: "Actualización de prueba",
          detalle: expect.objectContaining({
            motivoConsulta: "Atención inicial",
          }),
        }),
      ),
    );
  });
});

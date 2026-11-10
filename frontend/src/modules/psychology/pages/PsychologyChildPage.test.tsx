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
  listBeneficiaryChildren: vi.fn(),
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
  listBeneficiaryChildren: apiMocks.listBeneficiaryChildren,
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

import { PsychologyChildPage } from "./PsychologyChildPage";

const childForm = {
  id: "21",
  expedienteId: "10",
  ninoId: "8",
  areaId: "2",
  area: "Psicología",
  tipo: "PSICOLOGIA_NINEZ",
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
      <MemoryRouter initialEntries={["/beneficiarias/7/psicologia-infantil"]}>
        <Routes>
          <Route
            path="/beneficiarias/:beneficiaryId/psicologia-infantil"
            element={<PsychologyChildPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PsychologyChildPage", () => {
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
    apiMocks.listBeneficiaryChildren.mockResolvedValue({
      data: [
        {
          id: "8",
          nombre: "Niño de prueba",
          activo: true,
          version: 1,
        },
        {
          id: "9",
          nombre: "Registro inactivo",
          activo: false,
          version: 2,
        },
      ],
    });
    apiMocks.listAreaForms.mockResolvedValue({
      data: [childForm],
      page: { nextCursor: null, hasMore: false },
    });
    apiMocks.listAreaFormTypes.mockResolvedValue({
      data: [
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
    apiMocks.getAreaForm.mockResolvedValue({ data: childForm });
    apiMocks.createAreaForm.mockResolvedValue({
      data: { ...childForm, id: "22", version: 1 },
    });
    apiMocks.confirmAreaForm.mockResolvedValue({
      data: { ...childForm, estado: "CONFIRMADO", version: 3 },
    });
  });

  it("identifica el sujeto infantil en el resumen", async () => {
    renderPage();

    expect(await screen.findByText("Niño de prueba")).toBeInTheDocument();
    expect(screen.getByText("PSICOLOGIA_NINEZ")).toBeInTheDocument();
  });

  it("impide crear si no existe una niña o niño activo vinculado", async () => {
    apiMocks.listBeneficiaryChildren.mockResolvedValue({ data: [] });
    renderPage();

    expect(
      await screen.findByText("No hay niñas o niños activos para seleccionar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva ficha" })).toBeDisabled();
  });

  it("crea la ficha solo con una niña o niño activo vinculado", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Nueva ficha" }));
    fireEvent.change(screen.getByRole("combobox", { name: /tipo de ficha/i }), {
      target: { value: "PSICOLOGIA_NINEZ" },
    });
    const childSelect = screen.getByRole("combobox", {
      name: /niña o niño vinculado/i,
    });
    expect(childSelect).toHaveTextContent("Niño de prueba");
    expect(childSelect).not.toHaveTextContent("Registro inactivo");
    fireEvent.change(childSelect, { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));

    await waitFor(() =>
      expect(apiMocks.createAreaForm).toHaveBeenCalledWith(
        "7",
        expect.objectContaining({
          tipo: "PSICOLOGIA_NINEZ",
          ninoId: "8",
          profesionalId: "3",
        }),
      ),
    );
  });

  it("abre el formulario con el contexto del niño", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    expect(
      await screen.findByRole("heading", { name: "PSICOLOGIA_NINEZ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Niño de prueba · Formulario #21/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revisar y confirmar" }),
    ).toBeDisabled();
  });

  it("confirma una ficha infantil guardada con los mínimos completos", async () => {
    apiMocks.getAreaForm.mockResolvedValue({
      data: {
        ...childForm,
        detalle: {
          fechaReferencia: "2026-11-08",
          motivoConsulta: "Evaluación inicial",
          planTerapeutico: "Seguimiento semanal",
        },
      },
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    const reviewButton = await screen.findByRole("button", {
      name: "Revisar y confirmar",
    });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar definitivamente" }),
    );

    await waitFor(() =>
      expect(apiMocks.confirmAreaForm).toHaveBeenCalledWith(
        "21",
        2,
        "Confirmación inicial de ficha",
      ),
    );
  });
});

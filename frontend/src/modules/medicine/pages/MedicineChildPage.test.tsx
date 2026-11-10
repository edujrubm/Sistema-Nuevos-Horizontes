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

import { MedicineChildPage } from "./MedicineChildPage";

const childForm = {
  id: "31",
  expedienteId: "10",
  ninoId: "8",
  areaId: "5",
  area: "Medicina",
  tipo: "MEDICINA_NINEZ",
  estado: "BORRADOR",
  fechaAtencion: "2026-11-09T12:00:00.000Z",
  profesionalId: "3",
  capturadoPor: "4",
  creadoEn: "2026-11-09T12:00:00.000Z",
  actualizadoEn: "2026-11-09T12:00:00.000Z",
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
      <MemoryRouter initialEntries={["/beneficiarias/7/medicina-infantil"]}>
        <Routes>
          <Route
            path="/beneficiarias/:beneficiaryId/medicina-infantil"
            element={<MedicineChildPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MedicineChildPage", () => {
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
        { id: "8", nombre: "Niña de prueba", activo: true, version: 1 },
        { id: "9", nombre: "Registro inactivo", activo: false, version: 2 },
      ],
    });
    apiMocks.listAreaForms.mockResolvedValue({
      data: [childForm],
      page: { nextCursor: null, hasMore: false },
    });
    apiMocks.listAreaFormTypes.mockResolvedValue({
      data: [
        {
          codigo: "MEDICINA_NINEZ",
          descripcion: "Consulta médica para niña o niño",
          areaId: "5",
          area: "Medicina",
          detalle: "consulta_medica",
          requiereNino: true,
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
    apiMocks.getAreaForm.mockResolvedValue({ data: childForm });
    apiMocks.createAreaForm.mockResolvedValue({
      data: { ...childForm, id: "32", version: 1 },
    });
    apiMocks.updateAreaForm.mockResolvedValue({
      data: {
        ...childForm,
        version: 3,
        detalle: { motivoConsulta: "Control infantil" },
      },
    });
    apiMocks.confirmAreaForm.mockResolvedValue({
      data: { ...childForm, estado: "CONFIRMADO", version: 4 },
    });
    apiMocks.discardAreaForm.mockResolvedValue({
      data: { ...childForm, estado: "DESCARTADO", version: 3 },
    });
  });

  it("lista únicamente medicina infantil e identifica al sujeto", async () => {
    renderPage();

    expect(await screen.findByText("Niña de prueba")).toBeInTheDocument();
    expect(screen.getByText("MEDICINA_NINEZ")).toBeInTheDocument();
    expect(apiMocks.listAreaForms).toHaveBeenCalledWith(
      "7",
      { tipo: "MEDICINA_NINEZ", limit: 25 },
      expect.any(AbortSignal),
    );
  });

  it("impide crear si no existe una niña o niño activo vinculado", async () => {
    apiMocks.listBeneficiaryChildren.mockResolvedValue({ data: [] });
    renderPage();

    expect(
      await screen.findByText("No hay niñas o niños activos para seleccionar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva ficha" })).toBeDisabled();
  });

  it("crea la ficha con una niña o niño activo seleccionado", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Nueva ficha" }));
    fireEvent.change(screen.getByRole("combobox", { name: /tipo de ficha/i }), {
      target: { value: "MEDICINA_NINEZ" },
    });
    const childSelect = screen.getByRole("combobox", {
      name: /niña o niño vinculado/i,
    });
    expect(childSelect).toHaveTextContent("Niña de prueba");
    expect(childSelect).not.toHaveTextContent("Registro inactivo");
    fireEvent.change(childSelect, { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear borrador" }));

    await waitFor(() =>
      expect(apiMocks.createAreaForm).toHaveBeenCalledWith(
        "7",
        expect.objectContaining({
          tipo: "MEDICINA_NINEZ",
          ninoId: "8",
          profesionalId: "3",
        }),
      ),
    );
  });

  it("guarda y confirma la ficha infantil con el motivo completo", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Continuar" }));
    expect(
      await screen.findByText(/Niña de prueba · Formulario #31/),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Persona responsable" }),
      { target: { value: "mother" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /motivo y HEA/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /motivo de consulta/i }),
      { target: { value: "Control infantil" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() =>
      expect(apiMocks.updateAreaForm).toHaveBeenCalledWith(
        "31",
        expect.objectContaining({
          version: 2,
          motivo: "Guardado de borrador",
          detalle: expect.objectContaining({
            nombreResponsableDeclarado: "Beneficiaria de prueba",
            motivoConsulta: "Control infantil",
          }),
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
        "31",
        3,
        "Confirmación inicial de ficha",
      ),
    );
  });
});

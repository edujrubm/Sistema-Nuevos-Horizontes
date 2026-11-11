import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  createShelterStay: vi.fn(),
  listBeneficiaryChildren: vi.fn(),
  searchBeneficiaryMatches: vi.fn(),
}));

vi.mock("../api/albergue-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/albergue-api")>()),
  createShelterStay: apiMocks.createShelterStay,
}));
vi.mock("@/modules/beneficiaries/api/beneficiaries-api", () => ({
  listBeneficiaryChildren: apiMocks.listBeneficiaryChildren,
  searchBeneficiaryMatches: apiMocks.searchBeneficiaryMatches,
}));

import { ShelterEntryPage } from "./ShelterEntryPage";

function renderPage() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <MemoryRouter>
        <ShelterEntryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ShelterEntryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listBeneficiaryChildren.mockResolvedValue({ data: [] });
    apiMocks.searchBeneficiaryMatches.mockResolvedValue({
      data: [
        {
          id: "16",
          nombre: "Beneficiaria sintética",
          cuiEnmascarado: "•••••••••••••",
        },
      ],
    });
    apiMocks.createShelterStay.mockResolvedValue({
      id: "8",
      beneficiariaId: "16",
      fechaIngreso: "2026-11-09",
      fechaEgreso: null,
      estadoAlbergueId: "1",
    });
  });

  afterEach(cleanup);

  it("busca por DPI/CUI y exige confirmar el ingreso de la beneficiaria seleccionada", async () => {
    renderPage();

    fireEvent.change(screen.getByRole("textbox", { name: /DPI\/CUI/ }), {
      target: { value: "1234567890123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Buscar beneficiaria" }),
    );
    expect(
      await screen.findByText("Beneficiaria sintética"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Confirmar ingreso" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));

    await waitFor(() =>
      expect(apiMocks.createShelterStay).toHaveBeenCalledWith({
        beneficiariaId: "16",
        ninoIds: [],
      }),
    );
    expect(
      await screen.findByText("Ingreso registrado correctamente."),
    ).toBeInTheDocument();
  });

  it("no permite buscar un DPI/CUI incompleto", () => {
    renderPage();
    fireEvent.change(screen.getByRole("textbox", { name: /DPI\/CUI/ }), {
      target: { value: "123" },
    });

    expect(
      screen.getByText("Ingresa un DPI/CUI de 13 dígitos."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buscar beneficiaria" }),
    ).toBeDisabled();
  });
});

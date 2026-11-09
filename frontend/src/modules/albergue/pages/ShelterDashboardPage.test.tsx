import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getShelterSummary: vi.fn(),
  listShelterStays: vi.fn(),
}));

vi.mock("../api/albergue-api", () => apiMocks);

import { ShelterDashboardPage } from "./ShelterDashboardPage";

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ShelterDashboardPage />
    </QueryClientProvider>,
  );
}

describe("ShelterDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getShelterSummary.mockResolvedValue({
      estanciasActivas: 5,
      beneficiariasPresentes: 4,
      salidasTemporalesPendientes: 1,
      egresosRegistrados: 12,
    });
    apiMocks.listShelterStays.mockResolvedValue({
      datos: [{ id: "8", beneficiariaId: "16", fechaIngreso: "2026-11-09", fechaEgreso: null, estadoAlbergueId: "1" }],
      paginacion: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 },
    });
  });

  afterEach(cleanup);

  it("presenta el resumen y las estancias sin exponer DPI/CUI", async () => {
    renderPage();

    expect(await screen.findByText("Estancias activas")).toBeInTheDocument();
    expect(screen.getByText("#8")).toBeInTheDocument();
    expect(screen.getByText("Expediente vinculado #16")).toBeInTheDocument();
    expect(screen.queryByText(/DPI\/CUI/i)).not.toBeInTheDocument();
  });

  it("permite reintentar cuando el resumen no está disponible", async () => {
    apiMocks.getShelterSummary.mockRejectedValueOnce(new Error("Sin conexión"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(apiMocks.getShelterSummary).toHaveBeenCalledTimes(2));
  });
});

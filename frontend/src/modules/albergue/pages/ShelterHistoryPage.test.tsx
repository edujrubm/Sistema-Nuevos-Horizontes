import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
const api = vi.hoisted(() => ({ listShelterHistory: vi.fn() }));
vi.mock("../api/albergue-api", () => api);
import { ShelterHistoryPage } from "./ShelterHistoryPage";
function page() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ShelterHistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  api.listShelterHistory.mockResolvedValue({
    datos: [
      {
        id: "1",
        tipo: "INGRESO",
        fecha: "2026-11-11T10:00:00Z",
        beneficiariaNombre: "Beneficiaria sintética",
        responsable: "Profesional sintético",
        motivo: "Ingreso",
      },
    ],
    paginacion: { pagina: 1, limite: 20, total: 21, totalPaginas: 2 },
  });
});
describe("Historial completo de Albergue", () => {
  it("consulta filtros en el servidor, no solo la página descargada", async () => {
    page();
    await screen.findByText("Beneficiaria sintética");
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), {
      target: { value: "EGRESO" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(api.listShelterHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: "EGRESO", pagina: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("permite consultar páginas posteriores", async () => {
    page();
    await screen.findByText("Beneficiaria sintética");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(api.listShelterHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ pagina: 2 }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("rechaza rangos invertidos antes de consultar", async () => {
    page();
    await screen.findByText("Beneficiaria sintética");
    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-11-01" },
    });
    expect(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("posterior");
  });
});

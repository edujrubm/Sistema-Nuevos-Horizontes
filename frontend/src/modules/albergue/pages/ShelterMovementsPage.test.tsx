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
  createTemporaryExit: vi.fn(),
  listPendingTemporaryExits: vi.fn(),
  listAllActiveStays: vi.fn(),
  registerShelterReturn: vi.fn(),
}));

vi.mock("../api/albergue-api", () => apiMocks);

import { ShelterMovementsPage } from "./ShelterMovementsPage";

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
        <ShelterMovementsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ShelterMovementsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listAllActiveStays.mockResolvedValue({
      datos: [
        {
          id: "8",
          beneficiariaId: "16",
          fechaIngreso: "2026-11-09",
          fechaEgreso: null,
          estadoAlbergueId: "1",
        },
      ],
    });
    apiMocks.listPendingTemporaryExits.mockResolvedValue([
      {
        movimientoId: "15",
        estanciaId: "8",
        beneficiariaId: "16",
        beneficiariaNombre: "Beneficiaria sintética",
        fechaSalida: "2026-11-09T16:00:00.000Z",
        destino: "Centro de salud",
        trabajadorAsignado: null,
      },
    ]);
    apiMocks.createTemporaryExit.mockResolvedValue({ id: "15" });
    apiMocks.registerShelterReturn.mockResolvedValue({ id: "15" });
  });

  afterEach(cleanup);

  it("registra una salida temporal solo cuando hay estancia y destino", async () => {
    renderPage();

    await screen.findByRole("option", { name: /Estancia #8/ });
    fireEvent.change(
      screen.getByRole("combobox", { name: /estancia activa/i }),
      { target: { value: "8" } },
    );
    fireEvent.change(screen.getByRole("textbox", { name: /destino/i }), {
      target: { value: "Centro de salud" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar salida temporal" }),
    );

    await waitFor(() =>
      expect(apiMocks.createTemporaryExit).toHaveBeenCalledWith("8", {
        destino: "Centro de salud",
        trabajadorAsignado: undefined,
      }),
    );
  });

  it("pide confirmación antes de registrar un retorno", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar retorno" }),
    );
    expect(screen.getByText(/confirmarás el retorno/i)).toBeInTheDocument();
    expect(apiMocks.registerShelterReturn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar retorno" }));

    await waitFor(() =>
      expect(apiMocks.registerShelterReturn).toHaveBeenCalledWith("8"),
    );
  });
});

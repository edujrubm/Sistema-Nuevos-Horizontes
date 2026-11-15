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
  closeShelterStay: vi.fn(),
  listAllActiveStays: vi.fn(),
  registerShelterBirth: vi.fn(),
}));
vi.mock("../api/albergue-api", () => apiMocks);
import { ShelterClosurePage } from "./ShelterClosurePage";

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
        <ShelterClosurePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ShelterClosurePage", () => {
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
    apiMocks.closeShelterStay.mockResolvedValue({ id: "8" });
    apiMocks.registerShelterBirth.mockResolvedValue({ id: "24" });
  });
  afterEach(cleanup);

  it("exige una confirmación explícita antes del egreso", async () => {
    renderPage();
    await screen.findByRole("option", { name: /Estancia #8/ });
    fireEvent.change(
      screen.getByRole("combobox", { name: /estancia activa/i }),
      { target: { value: "8" } },
    );
    expect(
      screen.getByRole("button", { name: "Confirmar egreso definitivo" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Motivo del egreso/), {
      target: { value: "Fin de atención" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /confirmo que deseo/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar egreso definitivo" }),
    );
    await waitFor(() =>
      expect(apiMocks.closeShelterStay).toHaveBeenCalledWith(
        "8",
        "Fin de atención",
      ),
    );
  });

  it("no muestra el registro de nacimiento mientras se revisa su alcance", async () => {
    renderPage();
    expect(
      screen.queryByRole("tab", { name: "Registrar nacimiento" }),
    ).not.toBeInTheDocument();
    expect(apiMocks.registerShelterBirth).not.toHaveBeenCalled();
  });
});

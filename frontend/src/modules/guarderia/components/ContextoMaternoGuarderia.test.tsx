import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { beforeEach, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextoMaternoGuarderia } from "./ContextoMaternoGuarderia";
import { guarderiaApi } from "../api/guarderia-api";
import type { BeneficiariaContexto } from "@/shared/context/area-record-context";
const persona: BeneficiariaContexto = {
  id: "100",
  nombre: "Madre ficticia",
  estadoCivilId: "2",
  ocupacionId: "3",
  cuiEnmascarado: null,
  fechaNacimiento: null,
  residencia: null,
  fichaInicial: { id: "1", correlativo: null },
};
beforeEach(() =>
  vi
    .spyOn(guarderiaApi, "maternalCatalog")
    .mockImplementation(async (tipo) =>
      tipo === "estados-civiles"
        ? [{ id: "2", nombre: "Estado civil ficticio" }]
        : [{ id: "3", nombre: "Ocupación ficticia" }],
    ),
);
it("muestra nombres de catálogos en consulta, no IDs ni campos editables", async () => {
  render(<ContextoMaternoGuarderia persona={persona} />);
  await screen.findByText("Estado civil ficticio");
  await screen.findByText("Ocupación ficticia");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
it("si no hay datos no inventa valores ni hace consultas de catálogo", async () => {
  render(
    <ContextoMaternoGuarderia
      persona={{ ...persona, estadoCivilId: null, ocupacionId: null }}
    />,
  );
  expect(screen.getAllByText("Sin registrar")).toHaveLength(2);
  await waitFor(() =>
    expect(guarderiaApi.maternalCatalog).not.toHaveBeenCalled(),
  );
});
it("sin ficha inicial no asigna datos del perfil como datos maternos", () => {
  render(
    <ContextoMaternoGuarderia persona={{ ...persona, fichaInicial: null }} />,
  );
  expect(screen.getAllByText("Sin registrar")).toHaveLength(2);
  expect(guarderiaApi.maternalCatalog).not.toHaveBeenCalled();
});
it("diferencia una referencia no encontrada de un dato sin registrar", async () => {
  vi.mocked(guarderiaApi.maternalCatalog).mockResolvedValue([]);
  render(<ContextoMaternoGuarderia persona={persona} />);
  await waitFor(() =>
    expect(
      screen.getAllByText("Dato registrado no disponible en el catálogo"),
    ).toHaveLength(2),
  );
});
it("un fallo permite consultar el otro dato y reintentar solo el catálogo fallido", async () => {
  let fallo = true;
  vi.mocked(guarderiaApi.maternalCatalog).mockImplementation(async (tipo) => {
    if (tipo === "estados-civiles" && fallo) throw Error("Fallo ficticio");
    return tipo === "estados-civiles"
      ? [{ id: "2", nombre: "Estado recuperado" }]
      : [{ id: "3", nombre: "Ocupación ficticia" }];
  });
  render(<ContextoMaternoGuarderia persona={persona} />);
  await screen.findByText("Ocupación ficticia");
  await screen.findByText("No se pudo consultar");
  fallo = false;
  await userEvent.click(
    screen.getByRole("button", { name: "Volver a intentar" }),
  );
  await screen.findByText("Estado recuperado");
  expect(
    vi
      .mocked(guarderiaApi.maternalCatalog)
      .mock.calls.filter(([tipo]) => tipo === "ocupaciones"),
  ).toHaveLength(1);
});

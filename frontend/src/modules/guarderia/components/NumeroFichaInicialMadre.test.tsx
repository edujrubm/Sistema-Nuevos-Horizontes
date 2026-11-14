import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { NumeroFichaInicialMadre } from "./NumeroFichaInicialMadre";
import type { BeneficiariaContexto } from "@/shared/context/area-record-context";
const persona: BeneficiariaContexto = {
  id: "100",
  nombre: "Madre ficticia",
  cuiEnmascarado: null,
  fechaNacimiento: null,
  estadoCivilId: null,
  ocupacionId: null,
  residencia: null,
  fichaInicial: { id: "99", correlativo: "FI-2026-001" },
};
it("muestra el correlativo materno, sin reemplazarlo por el ID ni por un proceso legal", () => {
  render(<NumeroFichaInicialMadre persona={persona} />);
  expect(screen.getByText("FI-2026-001")).toBeVisible();
  expect(screen.getByText("Número de ficha inicial de la madre")).toBeVisible();
  expect(screen.queryByText(/proceso/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
it("distingue ID interno de correlativo faltante y ausencia de ficha", () => {
  const view = render(
    <NumeroFichaInicialMadre
      persona={{ ...persona, fichaInicial: { id: "99", correlativo: null } }}
    />,
  );
  expect(screen.getByText("Ficha #99")).toBeVisible();
  view.rerender(
    <NumeroFichaInicialMadre persona={{ ...persona, fichaInicial: null }} />,
  );
  expect(screen.getByText("Sin registrar")).toBeVisible();
});

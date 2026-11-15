import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatosMadreGuarderia } from "./DatosMadreGuarderia";
import type { BeneficiariaContexto } from "@/shared/context/area-record-context";
const persona: BeneficiariaContexto = {
  id: "100",
  nombre: "Mariana ficticia",
  cuiEnmascarado: "*********0123",
  fechaNacimiento: null,
  ocupacionId: null,
  estadoCivilId: null,
  residencia: {
    direccionActual: "Dirección ficticia",
    telefonoCelular: "55550000",
  },
  fichaInicial: { id: "1", correlativo: "FI-1" },
};
describe("Madre desde el expediente de ficha inicial", () => {
  it("presenta datos de la fuente existente en solo lectura y conserva CUI protegido", () => {
    render(<DatosMadreGuarderia persona={persona} />);
    const section = screen.getByRole("region", { name: "Datos de la madre" });
    for (const value of [
      persona.nombre,
      persona.cuiEnmascarado!,
      "Dirección ficticia",
      "55550000",
    ])
      expect(within(section).getByText(value)).toBeInTheDocument();
    expect(within(section).queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("no asigna una madre si no existe ficha inicial", () => {
    render(
      <DatosMadreGuarderia persona={{ ...persona, fichaInicial: null }} />,
    );
    expect(screen.queryByText(persona.nombre)).not.toBeInTheDocument();
    expect(
      screen.getByText(/No hay una ficha inicial disponible/),
    ).toBeInTheDocument();
  });
});

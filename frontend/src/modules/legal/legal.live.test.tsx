import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { it, expect } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { CapacidadesContext } from "@/app/capacidades";
import { BeneficiariaContext } from "@/shared/context/area-record-context";
import { soloLectura, type Capacidades } from "@/shared/types/api";
import { LegalEditorPage } from "./pages/LegalEditorPage";
it.skipIf(!process.env.LEGAL_LIVE_API)(
  "Legal funciona desde React hasta PostgreSQL",
  async () => {
    expect(process.env.LEGAL_LIVE_API).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/api\/v1$/,
    );
    const router = createMemoryRouter(
      [
        {
          path: "/beneficiarias/:beneficiariaId/legal/nueva",
          element: <LegalEditorPage />,
        },
        {
          path: "/beneficiarias/:beneficiariaId/legal/:fichaId",
          element: <LegalEditorPage />,
        },
      ],
      { initialEntries: ["/beneficiarias/100/legal/nueva"] },
    );
    const caps = Object.fromEntries(
      Object.keys(soloLectura).map((k) => [k, true]),
    ) as unknown as Capacidades;
    render(
      <CapacidadesContext.Provider value={caps}>
        <BeneficiariaContext.Provider
          value={{
            id: "100",
            nombre: "Beneficiaria ficticia",
            cuiEnmascarado: null,
            fechaNacimiento: null,
            ocupacionId: null,
            estadoCivilId: null,
            residencia: null,
            fichaInicial: null,
          }}
        >
          <RouterProvider router={router} />
        </BeneficiariaContext.Provider>
      </CapacidadesContext.Provider>,
    );
    fireEvent.change(await screen.findByLabelText("Fecha de atención"), {
      target: { value: "2026-11-13T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "0067" },
    });
    fireEvent.change(screen.getByLabelText("Demandado"), {
      target: { value: "Persona ficticia QA" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(
      () => expect(router.state.location.pathname).toMatch(/legal\/\d+$/),
      { timeout: 15000 },
    );
    await screen.findByText("Profesional responsable");
    const id = router.state.location.pathname.split("/").at(-1);
    const url = process.env.LEGAL_LIVE_API + "/formularios-area/" + id;
    const initial = await fetch(url).then((r) => r.json());
    expect(initial.data.profesionalId).toBe("67");
    fireEvent.change(await screen.findByLabelText("Demandado"), {
      target: { value: "Persona ficticia corregida" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );
    await waitFor(async () =>
      expect(
        (await fetch(url).then((r) => r.json())).data.detalle
          .demandadoNombreDeclarado,
      ).toBe("Persona ficticia corregida"),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "4 Diligenciamiento" }),
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    );
    await screen.findByText("Registro en modo de consulta.");
    expect((await fetch(url).then((r) => r.json())).data.estado).toBe(
      "CONFIRMADO",
    );
  },
  30000,
);

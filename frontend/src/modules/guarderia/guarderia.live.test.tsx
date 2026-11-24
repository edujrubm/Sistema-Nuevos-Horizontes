import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { CapacidadesContext } from "@/app/capacidades";
import { BeneficiariaContext } from "@/shared/context/area-record-context";
import { soloLectura, type Capacidades } from "@/shared/types/api";
import { GuarderiaEditorPage } from "./index";

// Solo el ejecutor de PostgreSQL desechable proporciona este destino.
it.skipIf(!process.env.GUARDERIA_LIVE_API)(
  "React guarda y recupera la ficha mediante HTTP y PostgreSQL reales",
  async () => {
    expect(process.env.GUARDERIA_LIVE_API).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/api\/v1$/,
    );
    const persona = await fetch(
      process.env.GUARDERIA_LIVE_API + "/beneficiarias/100",
    ).then((r) => r.json());
    const capabilities = Object.fromEntries(
      Object.keys(soloLectura).map((k) => [k, true]),
    ) as unknown as Capacidades;
    const router = createMemoryRouter(
      [
        {
          path: "/beneficiarias/:beneficiariaId/guarderia/nueva",
          element: <GuarderiaEditorPage />,
        },
        {
          path: "/beneficiarias/:beneficiariaId/guarderia/fichas/:fichaId",
          element: <GuarderiaEditorPage />,
        },
      ],
      { initialEntries: ["/beneficiarias/100/guarderia/nueva?ninoId=101"] },
    );
    render(
      <CapacidadesContext.Provider value={capabilities}>
        <BeneficiariaContext.Provider value={persona}>
          <RouterProvider router={router} />
        </BeneficiariaContext.Provider>
      </CapacidadesContext.Provider>,
    );
    const save = await screen.findByRole("button", {
      name: "Guardar borrador",
    });
    await waitFor(() => expect(save).toBeEnabled(), { timeout: 15000 });
    fireEvent.change(screen.getByLabelText("Fecha de atención"), {
      target: { value: "2026-11-13T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "0001" },
    });
    fireEvent.change(screen.getByLabelText("Número de ficha"), {
      target: { value: "Ensayo React y PostgreSQL" },
    });
    await userEvent.click(save);
    await waitFor(
      () =>
        expect(router.state.location.pathname).toMatch(
          /\/guarderia\/fichas\/\d+$/,
        ),
      { timeout: 15000 },
    );
    expect(
      await screen.findByDisplayValue("Ensayo React y PostgreSQL"),
    ).toBeVisible();
    const id = router.state.location.pathname.split("/").at(-1);
    const response = await fetch(
      process.env.GUARDERIA_LIVE_API + "/formularios-area/" + id,
    );
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data).toMatchObject({
      tipo: "GUARDERIA",
      ninoId: "101",
      profesionalId: "1",
      detalle: { numeroFicha: "Ensayo React y PostgreSQL" },
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Siguiente página" }),
    );
    await screen.findByText("No hay responsables registrados en esta ficha.");
    for (const [label, value] of [
      ["Nombre completo", "Elena ficticia de QA"],
      ["DPI/CUI", "0000000000012"],
      ["Relación o parentesco", "Tía"],
      ["Teléfono", "55550012"],
    ])
      await userEvent.type(screen.getByRole("textbox", { name: label }), value);
    expect(
      screen.getByRole("button", { name: "Guardar borrador" }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar responsable" }),
    );
    await screen.findByText(
      "Responsable guardado. Está autorizado para recoger y trasladar al niño.",
    );
    const lista = await fetch(
      process.env.GUARDERIA_LIVE_API +
        `/guarderia/beneficiarias/100/fichas/${id}/responsables`,
    ).then((r) => r.json());
    expect(lista.datos).toEqual([
      expect.objectContaining({
        nombre: "Elena ficticia de QA",
        cui: "0000000000012",
        formularioId: id,
      }),
    ]);
    // La página principal debe consumir la versión nueva, sin falso conflicto.
    await userEvent.click(
      screen
        .getAllByRole("button", { name: "Anterior" })
        .find((button) => !button.hasAttribute("disabled"))!,
    );
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "1" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(
      async () => {
        const actual = await fetch(
          process.env.GUARDERIA_LIVE_API + "/formularios-area/" + id,
        ).then((r) => r.json());
        expect(actual.data.version).toBeGreaterThan(lista.version);
      },
      { timeout: 15000 },
    );
    await screen.findByText("Cambios guardados.");
    await userEvent.click(
      screen.getByRole("button", { name: "4 Madre y padre" }),
    );
    await screen.findByText(
      "No hay datos del padre registrados para este niño.",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Nombre del padre" }),
      "Carlos ficticio de QA",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "DPI/CUI del padre" }),
      "0000000000088",
    );
    expect(
      screen.getByRole("button", { name: "Guardar borrador" }),
    ).toBeDisabled();
    const beforeFather = await fetch(
      process.env.GUARDERIA_LIVE_API + "/formularios-area/" + id,
    ).then((r) => r.json());
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar datos del padre" }),
    );
    await screen.findByText("Datos del padre guardados.");
    const parentUrl =
      process.env.GUARDERIA_LIVE_API +
      "/guarderia/beneficiarias/100/hijos/101/padres";
    const parents = await fetch(parentUrl).then((r) => r.json());
    expect(parents.datos).toEqual([
      expect.objectContaining({
        nombre: "Carlos ficticio de QA",
        tipoVinculo: "BIOLOGICO",
        cui: "0000000000088",
        ninoId: "101",
      }),
    ]);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Editar Carlos ficticio de QA",
      }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Teléfono del padre" }),
      "55550088",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Motivo de la corrección" }),
      "Corrección ficticia de contacto",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar datos del padre" }),
    );
    await waitFor(async () =>
      expect(
        (await fetch(parentUrl).then((r) => r.json())).datos[0].telefono,
      ).toBe("55550088"),
    );
    const afterFather = await fetch(
      process.env.GUARDERIA_LIVE_API + "/formularios-area/" + id,
    ).then((r) => r.json());
    expect(afterFather.data.version).toBe(beforeFather.data.version);
    await userEvent.click(
      screen.getByRole("button", { name: "3 Situación familiar" }),
    );
    await screen.findByText("Ocupación ficticia QA");
    await screen.findByText("Estado civil ficticio QA");
    expect(
      screen.queryByRole("textbox", { name: "Estado civil" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Ocupación" }),
    ).not.toBeInTheDocument();
  },
  30000,
);

import { renderWithQueryClient as render } from "@/test-utils/render-query";
import { ApiError } from "@/shared/api/api-error";
import { padresApi } from "./api/padres-api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { CapacidadesContext } from "@/app/capacidades";
import { BeneficiariaContext } from "@/shared/context/area-record-context";
import { soloLectura, type Capacidades, type Ficha } from "@/shared/types/api";

import { guarderiaApi } from "./api/guarderia-api";
import { AppLayout } from "@/app/layouts/AppLayout";
import {
  GuarderiaChildrenPage,
  GuarderiaEditorPage,
  GuarderiaListPage,
} from "./index";

const caps = Object.fromEntries(
  Object.keys(soloLectura).map((k) => [k, true]),
) as unknown as Capacidades;
const draft: Ficha = {
  id: "20",
  tipo: "GUARDERIA",
  ninoId: "101",
  estado: "BORRADOR",
  version: 3,
  profesionalId: "67",
  fechaAtencion: "2026-11-13T16:00:00Z",
  detalle: { padeceEnfermedad: false },
};
const children = [
  {
    ninoId: "100",
    nombre: "Mateo sintético",
    fechaNac: "2019-03-10",
    expedienteId: "1",
    inscrito: true,
  },
  {
    ninoId: "101",
    nombre: "Sofía sintética",
    fechaNac: "2020-09-22",
    expedienteId: "1",
    inscrito: false,
  },
];
function mount(
  path = "/beneficiarias/100/guarderia/fichas/20",
  capabilities = caps,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/beneficiarias/:beneficiariaId/guarderia",
        element: <GuarderiaChildrenPage />,
      },
      {
        path: "/beneficiarias/:beneficiariaId/guarderia/nueva",
        element: <GuarderiaEditorPage />,
      },
      {
        path: "/beneficiarias/:beneficiariaId/guarderia/fichas/:fichaId",
        element: <GuarderiaEditorPage />,
      },
      {
        path: "/beneficiarias/:beneficiariaId/guarderia/:hijoId",
        element: <GuarderiaListPage />,
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <CapacidadesContext.Provider value={capabilities}>
      <BeneficiariaContext.Provider
        value={{
          id: "100",
          nombre: "Beneficiaria sintética",
          cuiEnmascarado: "***0123",
          fechaNacimiento: null,
          ocupacionId: null,
          estadoCivilId: null,
          residencia: { direccionActual: "Dirección ficticia del expediente" },
          fichaInicial: null,
        }}
      >
        <RouterProvider router={router} />
      </BeneficiariaContext.Provider>
    </CapacidadesContext.Provider>,
  );
  return router;
}
beforeEach(() => {
  vi.spyOn(guarderiaApi, "children").mockResolvedValue({
    datos: children,
    total: 2,
    pagina: 1,
    limite: 25,
  });
  vi.spyOn(guarderiaApi, "catalogs").mockResolvedValue({
    etnias: [{ id: "1", nombre: "Etnia del catálogo" }],
    escolaridades: [{ id: "2", nombre: "Escolaridad del catálogo" }],
  });
  vi.spyOn(guarderiaApi, "get").mockResolvedValue(
    draft as Awaited<ReturnType<typeof guarderiaApi.get>>,
  );
});
describe("Guardería: vistas propias", () => {
  it("mantiene navegación de Guardería sin ofrecer acciones de admisión", () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppLayout />,
          children: [
            {
              path: "/beneficiarias/:id/guarderia",
              element: <p>Vista Guardería</p>,
            },
          ],
        },
      ],
      { initialEntries: ["/beneficiarias/100/guarderia"] },
    );
    render(<RouterProvider router={router} />);
    expect(
      screen.getByRole("link", { name: "Fichas de Guardería" }),
    ).toHaveAttribute("href", "/beneficiarias/100/guarderia");
    expect(
      screen.queryByRole("link", { name: "Nueva ficha inicial" }),
    ).not.toBeInTheDocument();
  });
  it("descarta desde el listado únicamente con un motivo explícito", async () => {
    vi.spyOn(guarderiaApi, "list").mockResolvedValue({
      datos: [{ ...draft, ninoId: "100" }],
      pagina: 1,
      limite: 25,
      total: 1,
      child: children[0],
    });
    const discard = vi
      .spyOn(guarderiaApi, "discard")
      .mockResolvedValue({ data: { ...draft, estado: "DESCARTADO" } });
    mount("/beneficiarias/100/guarderia/100");
    const discardButton = await screen.findByRole("button", {
      name: "Descartar borrador",
    });
    expect(screen.getByText("GUARDERÍA · 20")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ficha del área" }),
    ).toHaveAttribute("href", "/beneficiarias/100/guarderia");
    expect(
      screen.queryByRole("link", { name: "Ficha social" }),
    ).not.toBeInTheDocument();
    await userEvent.click(discardButton);
    expect(
      screen.getByRole("button", { name: "Confirmar descarte" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo del descarte"), {
      target: { value: "Duplicado sintético" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar descarte" }),
    );
    await waitFor(() =>
      expect(discard).toHaveBeenCalledWith("20", 3, "Duplicado sintético"),
    );
  });
  it("permite seleccionar todos y abrir fichas solo de inscritos", async () => {
    mount("/beneficiarias/100/guarderia");
    expect(await screen.findByText("Sofía sintética")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Ver fichas" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Crear ficha" })).toHaveLength(
      2,
    );
    expect(screen.getByRole("link", { name: "Ver fichas" })).toHaveAttribute(
      "href",
      "/beneficiarias/100/guarderia/100?paginaHijos=1",
    );
  });
  it("no muestra creación sin la capacidad correspondiente", async () => {
    mount("/beneficiarias/100/guarderia", soloLectura);
    await screen.findByText("Sofía sintética");
    expect(
      screen.queryByRole("link", { name: "Crear ficha" }),
    ).not.toBeInTheDocument();
  });
  it("crea para el niño elegido y normaliza el profesional sin cambiar la zona horaria", async () => {
    const create = vi.spyOn(guarderiaApi, "create").mockResolvedValue(draft);
    mount("/beneficiarias/100/guarderia/nueva?ninoId=101");
    const date = await screen.findByLabelText("Fecha de atención");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar borrador" }),
      ).toBeEnabled(),
    );
    fireEvent.change(date, { target: { value: "2026-11-13T10:00" } });
    fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
      target: { value: "0067" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        "100",
        expect.objectContaining({
          ninoId: "101",
          profesionalId: "67",
          fechaAtencion: "2026-11-13T16:00:00.000Z",
        }),
      ),
    );
  });
  it("reutiliza la fecha del niño y las opciones reales del catálogo", async () => {
    mount();
    expect(await screen.findByText("2020-09-22")).toBeVisible();
    expect(
      await screen.findByRole("option", { name: "Etnia del catálogo" }),
    ).toHaveValue("1");
    await userEvent.click(
      screen.getByRole("button", { name: "5 Escolaridad y salud" }),
    );
    expect(
      await screen.findByRole("option", { name: "Escolaridad del catálogo" }),
    ).toHaveValue("2");
    expect(screen.getByLabelText("Padece enfermedad")).toHaveValue("false");
  });
  it("mantiene texto ante errores y abre la sección del campo señalado", async () => {
    vi.spyOn(guarderiaApi, "save").mockRejectedValue(
      new ApiError({
        estado: 400,
        codigo: "DATOS_INVALIDOS",
        mensaje: "Revisa los datos",
        errores: [
          { campo: "detalle.observaciones", mensaje: "Revisa este campo." },
        ],
        idSolicitud: "no-disponible",
      }),
    );
    mount();
    fireEvent.change(await screen.findByLabelText("Número de ficha"), {
      target: { value: "Conservar" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await userEvent.click(
      await screen.findByRole("link", {
        name: "Observaciones: Revisa este campo.",
      }),
    );
    expect(screen.getByLabelText("Observaciones")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "1 Ingreso" }));
    expect(screen.getByLabelText("Número de ficha")).toHaveValue("Conservar");
  });
  it("conserva false al guardar datos de salud", async () => {
    const save = vi.spyOn(guarderiaApi, "save").mockResolvedValue(draft);
    mount();
    await screen.findByLabelText("Número de ficha");
    await userEvent.click(
      screen.getByRole("button", { name: "5 Escolaridad y salud" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        "20",
        3,
        expect.objectContaining({ padeceEnfermedad: false }),
        expect.any(String),
        "67",
      ),
    );
  });
  it("exige revisión explícita para confirmar y deja la ficha en consulta", async () => {
    const confirm = vi
      .spyOn(guarderiaApi, "confirm")
      .mockResolvedValue({ ...draft, estado: "CONFIRMADO", version: 4 });
    mount();
    await screen.findByLabelText("Número de ficha");
    await userEvent.click(
      screen.getByRole("button", { name: "5 Escolaridad y salud" }),
    );
    expect(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    );
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("20", 3));
    expect(
      await screen.findByText("Registro en modo de consulta."),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Guardar borrador" }),
    ).not.toBeInTheDocument();
  });
  it("bloquea otro guardado tras un conflicto sin perder el borrador", async () => {
    vi.spyOn(guarderiaApi, "save").mockRejectedValue(
      new ApiError({
        estado: 409,
        codigo: "VERSION_DESACTUALIZADA",
        mensaje: "Conflicto",
        errores: [],
        idSolicitud: "no-disponible",
      }),
    );
    mount();
    fireEvent.change(await screen.findByLabelText("Número de ficha"), {
      target: { value: "Sin perder" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar borrador" }),
      ).toBeDisabled(),
    );
    expect(screen.getByText("Sin perder")).toBeVisible();
  });
});

it("Ingreso utiliza la dirección real del contrato de beneficiarias", async () => {
  mount();
  expect(
    await screen.findByText("Dirección ficticia del expediente"),
  ).toBeVisible();
});
it("marca los campos de cabecera inválidos y conserva el texto sin enviar la petición", async () => {
  const save = vi.spyOn(guarderiaApi, "save");
  mount();
  fireEvent.change(await screen.findByLabelText("Número de ficha"), {
    target: { value: "Mantener texto" },
  });
  fireEvent.change(screen.getByLabelText("Fecha de atención"), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText("Identificador del profesional"), {
    target: { value: "0" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Guardar borrador" }).closest("form")!,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Fecha de atención")).toHaveAttribute(
      "aria-invalid",
      "true",
    ),
  );
  expect(
    screen.getByLabelText("Identificador del profesional"),
  ).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Número de ficha")).toHaveValue(
    "Mantener texto",
  );
  expect(save).not.toHaveBeenCalled();
});

it("Escolaridad y salud conserva las tarjetas separadas del mockup", async () => {
  mount();
  await screen.findByLabelText("Número de ficha");
  await userEvent.click(
    screen.getByRole("button", { name: "5 Escolaridad y salud" }),
  );
  expect(screen.getByRole("heading", { name: "Escolaridad" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Salud" })).toBeVisible();
});

it("avisa de captura paterna pendiente al cambiar de sección y permite volver sin perderla", async () => {
  vi.spyOn(padresApi, "listar").mockResolvedValue({
    datos: [],
    total: 0,
    pagina: 1,
    limite: 20,
  });
  mount();
  await screen.findByLabelText("Número de ficha");
  await userEvent.click(
    screen.getByRole("button", { name: "4 Madre y padre" }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Nombre del padre" }),
    "Conservar padre ficticio",
  );
  await userEvent.click(screen.getByRole("button", { name: "1 Ingreso" }));
  expect(
    await screen.findByText(/Hay una captura pendiente en Madre y padre/),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Guardar borrador" }),
  ).toBeDisabled();
  await userEvent.click(
    screen.getByRole("button", { name: "Volver a la captura pendiente" }),
  );
  expect(screen.getByRole("textbox", { name: "Nombre del padre" })).toHaveValue(
    "Conservar padre ficticio",
  );
});

it("Situación familiar solicita la ficha inicial materna y no un proceso legal", async () => {
  mount();
  await screen.findByLabelText("Número de ficha");
  await userEvent.click(
    screen.getByRole("button", { name: "3 Situación familiar" }),
  );
  expect(screen.getByText("Número de ficha inicial de la madre")).toBeVisible();
  expect(
    screen.queryByText("Número de proceso de la madre"),
  ).not.toBeInTheDocument();
});

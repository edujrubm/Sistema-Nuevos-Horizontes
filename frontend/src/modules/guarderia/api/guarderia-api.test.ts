import { expect, it, vi } from "vitest";
import { guarderiaApi } from "./guarderia-api";

it("no presenta una ficha de otro expediente aunque su tipo sea Guardería", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
    Response.json(
      String(input).includes("formularios-area")
        ? {
            data: {
              id: "1",
              tipo: "GUARDERIA",
              ninoId: "101",
              expedienteId: "2",
            },
          }
        : { expediente: { id: "1" } },
    ),
  );
  await expect(guarderiaApi.get("1", "100")).rejects.toMatchObject({
    estado: 404,
    codigo: "REGISTRO_NO_ENCONTRADO",
  });
});
it("consulta los catálogos publicados sin fabricar opciones", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () =>
      Response.json({ data: [{ id: "1", nombre: "Opción sintética" }] }),
    );
  const result = await guarderiaApi.catalogs();
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    "/api/v1/catalogos/etnias",
    "/api/v1/catalogos/niveles-estudio",
  ]);
  expect(result.etnias).toEqual([{ id: "1", nombre: "Opción sintética" }]);
});
it("envía el tipo y el niño en la creación usando la ruta compartida existente", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ data: { id: "20" } }));
  await guarderiaApi.create("100", {
    ninoId: "101",
    profesionalId: "67",
    fechaAtencion: "2026-11-13T16:00:00Z",
    detalle: { padeceEnfermedad: false },
  });
  expect(fetch.mock.calls[0][0]).toBe(
    "/api/v1/beneficiarias/100/formularios-area",
  );
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({
    tipo: "GUARDERIA",
    ninoId: "101",
    detalle: { padeceEnfermedad: false },
  });
});
it("no consulta fichas si el niño no está inscrito en la página autorizada del expediente", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      datos: [{ ninoId: "101", inscrito: false }],
      total: 1,
      pagina: 1,
      limite: 25,
    }),
  );
  await expect(guarderiaApi.list("100", "101", 1, 1)).rejects.toMatchObject({
    estado: 404,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("consulta las rutas de catálogo existentes y no escribe datos", async () => {
  const requests = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () =>
      Response.json({ data: [{ id: "1", nombre: "Etiqueta ficticia" }] }),
    );
  expect(await guarderiaApi.maternalCatalog("estados-civiles")).toEqual([
    { id: "1", nombre: "Etiqueta ficticia" },
  ]);
  await guarderiaApi.maternalCatalog("ocupaciones");
  expect(requests.mock.calls.map(([url]) => String(url))).toEqual([
    expect.stringContaining("/catalogos/estados-civiles"),
    expect.stringContaining("/catalogos/ocupaciones"),
  ]);
  expect(
    requests.mock.calls.every(([, opciones]) => opciones?.method === "GET"),
  ).toBe(true);
});

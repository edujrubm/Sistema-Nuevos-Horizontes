import { it, expect, vi, afterEach } from "vitest";
import {
  listAllActiveStays,
  closeShelterStay,
  listShelterStays,
} from "./albergue-api";
afterEach(() => vi.unstubAllGlobals());
it("selecciona estancias de todas las páginas sin truncar a veinte", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [{ id: "1" }],
        paginacion: { totalPaginas: 2 },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [{ id: "9007199254740993" }],
        paginacion: { totalPaginas: 2 },
      }),
    });
  vi.stubGlobal("fetch", fetch);
  const r = await listAllActiveStays();
  expect(r.datos.map((x) => x.id)).toEqual(["1", "9007199254740993"]);
  expect(fetch.mock.calls[1][0]).toContain("pagina=2");
});
it("el egreso transmite el motivo sin inventar campos del cliente", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetch);
  await closeShelterStay("8", "Fin de atención");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    motivo: "Fin de atención",
  });
});

it("la búsqueda de CUI viaja en el cuerpo y no en la URL", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ datos: [] }) });
  vi.stubGlobal("fetch", fetch);
  await listShelterStays(undefined, { buscar: "9999999999999" });
  expect(fetch.mock.calls[0][0]).not.toContain("9999999999999");
  expect(JSON.parse(fetch.mock.calls[0][1].body).buscar).toBe("9999999999999");
});

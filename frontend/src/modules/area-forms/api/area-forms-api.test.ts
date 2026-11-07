import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmAreaForm,
  createAreaForm,
  listAreaForms,
  updateAreaForm,
} from "./area-forms-api";

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("area-forms-api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lista formularios con filtros y paginación", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) =>
      jsonResponse({ data: [], page: { nextCursor: null, hasMore: false } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listAreaForms("7", {
      areaId: "2",
      tipo: "PSICOLOGIA_MUJER",
      cursor: "40",
      limit: 10,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/beneficiarias/7/formularios-area?");
    expect(String(url)).toContain("areaId=2");
    expect(String(url)).toContain("tipo=PSICOLOGIA_MUJER");
    expect(String(url)).toContain("cursor=40");
    expect(String(url)).toContain("limite=10");
  });

  it("crea, actualiza y confirma respetando el control de versión", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) =>
      jsonResponse({ data: { id: "15" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createAreaForm("7", {
      tipo: "PSICOLOGIA_MUJER",
      fechaAtencion: "2026-11-06",
      profesionalId: "3",
      detalle: {},
    });
    await updateAreaForm("15", {
      version: 2,
      motivo: "Actualizar motivo de consulta",
      detalle: { motivoConsulta: "Seguimiento" },
    });
    await confirmAreaForm("15", 3, "Confirmación revisada");

    expect(fetchMock.mock.calls[0]).toEqual([
      "/api/v1/beneficiarias/7/formularios-area",
      expect.objectContaining({ method: "POST" }),
    ]);
    expect(fetchMock.mock.calls[1]).toEqual([
      "/api/v1/formularios-area/15",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"version":2'),
      }),
    ]);
    expect(fetchMock.mock.calls[2]).toEqual([
      "/api/v1/formularios-area/15/confirmar",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ version: 3, motivo: "Confirmación revisada" }),
      }),
    ]);
  });
});

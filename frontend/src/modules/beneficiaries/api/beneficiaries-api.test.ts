import { afterEach, describe, expect, it, vi } from "vitest";

import { getBeneficiary, listBeneficiaries, listBeneficiaryChildren } from "./beneficiaries-api";

function jsonResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("beneficiaries-api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("construye la paginación por cursor sin exponer un CUI", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) =>
      jsonResponse({ data: [], page: { nextCursor: null, hasMore: false } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listBeneficiaries("Ana López", "42");

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/beneficiarias?");
    expect(String(url)).toContain("nombre=Ana+L%C3%B3pez");
    expect(String(url)).toContain("cursor=42");
    expect(String(url)).not.toContain("cui");
  });

  it("consulta el perfil y los hijos por identificador", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) => jsonResponse({}))
      .mockImplementationOnce(() => jsonResponse({ id: "7", nombre: "Persona de prueba", version: 1, expediente: null, fichaInicial: null }))
      .mockImplementationOnce(() => jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await getBeneficiary("7");
    await listBeneficiaryChildren("7");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/beneficiarias/7");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/beneficiarias/7/hijos");
  });
});

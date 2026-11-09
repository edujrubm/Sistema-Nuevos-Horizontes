import { afterEach, describe, expect, it, vi } from "vitest";

import { changeBeneficiaryStatus, getBeneficiary, getBeneficiaryHistory, listBeneficiaries, listBeneficiaryChildren, searchBeneficiaryMatches, updateBeneficiary } from "./beneficiaries-api";

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

  it("busca coincidencias de DPI/CUI mediante POST sin exponerlo en la URL", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) => jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await searchBeneficiaryMatches({ cui: "1234567890101" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/beneficiarias/buscar-coincidencias");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ cui: "1234567890101" }),
    });
  });

  it("envía versión y motivo en las operaciones auditadas del expediente", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) => jsonResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await updateBeneficiary("7", { nombre: "Persona sintética", version: 2, motivo: "Corrección autorizada" });
    await changeBeneficiaryStatus("7", false, 3, "Cierre administrativo");
    await getBeneficiaryHistory("7");

    expect(fetchMock.mock.calls[0]).toEqual(["/api/v1/beneficiarias/7", expect.objectContaining({ method: "PATCH", body: expect.stringContaining('"version":2') })]);
    expect(fetchMock.mock.calls[1]).toEqual(["/api/v1/beneficiarias/7/inactivar", expect.objectContaining({ method: "POST", body: JSON.stringify({ version: 3, motivo: "Cierre administrativo" }) })]);
    expect(fetchMock.mock.calls[2][0]).toBe("/api/v1/beneficiarias/7/historial");
  });
});

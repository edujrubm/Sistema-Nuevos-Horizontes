import { describe, it, expect, vi, afterEach } from "vitest";
import { cargarDocumento, validarPdf, listarDocumentos } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("Transporte documental", () => {
  it("rechaza vacío, imágenes y más de 20 MiB", () => {
    expect(
      validarPdf(new File([], "a.pdf", { type: "application/pdf" })),
    ).toMatch(/vacío/);
    expect(
      validarPdf(new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).toMatch(/PDF/);
    expect(
      validarPdf(
        new File([new Uint8Array(20 * 1024 * 1024 + 1)], "a.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toMatch(/20 MB/);
  });
  it("mantiene el límite de tamaño exacto", () =>
    expect(
      validarPdf(
        new File([new Uint8Array(20 * 1024 * 1024)], "a.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toBeUndefined());
  it("no configura un Content-Type incorrecto y procesa confirmación", async () => {
    const xhr = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {},
      status: 201,
      responseText: '{"id":"9"}',
      onload: () => {},
    };
    vi.stubGlobal(
      "XMLHttpRequest",
      vi.fn(function () {
        return xhr;
      }),
    );
    const body = new FormData();
    const promise = cargarDocumento(
      "100",
      body,
      vi.fn(),
      new AbortController().signal,
    );
    expect(xhr.setRequestHeader).toHaveBeenCalledWith(
      "Accept",
      "application/json",
    );
    expect(xhr.setRequestHeader).not.toHaveBeenCalledWith(
      "Content-Type",
      expect.anything(),
    );
    xhr.onload();
    expect(await promise).toEqual({ id: "9" });
  });
  it("una cancelación produce resultado incierto, no éxito ni reintento", async () => {
    const xhr = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {},
      onabort: () => {},
      abort: () => xhr.onabort(),
    };
    vi.stubGlobal(
      "XMLHttpRequest",
      vi.fn(function () {
        return xhr;
      }),
    );
    const control = new AbortController();
    const p = cargarDocumento("100", new FormData(), vi.fn(), control.signal);
    control.abort();
    await expect(p).rejects.toMatchObject({
      body: { codigo: "RESULTADO_OPERACION_INCIERTO" },
    });
    expect(xhr.send).toHaveBeenCalledTimes(1);
  });
  it("codifica búsquedas sin modificar la ruta ni los IDs", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ datos: [] }) });
    vi.stubGlobal("fetch", fetch);
    await listarDocumentos("9007199254740993", {
      pagina: 2,
      buscar: "A&B",
      categoria: "Plan",
      estado: "BORRADOR",
    });
    expect(fetch.mock.calls[0][0]).toContain("buscar=A%26B");
    expect(fetch.mock.calls[0][0]).toContain("9007199254740993");
  });
});

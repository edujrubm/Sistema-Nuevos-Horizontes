import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, areaRequestOptions } from "./http-client";
import { ApiError } from "./api-error";
import { ApiError as CompatibilityError, http } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("Transporte HTTP compartido", () => {
  it("no impone un tiempo de espera nuevo a los consumidores del equipo", async () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    let requestSignal!: AbortSignal;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            requestSignal = options.signal;
            requestSignal.addEventListener("abort", () =>
              reject(new DOMException("Cancelada", "AbortError")),
            );
          }),
      ),
    );
    const pending = apiRequest("/consulta-existente", {
      signal: caller.signal,
    });
    const checked = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(requestSignal.aborted).toBe(false);
    caller.abort();
    await checked;
  });

  it("comparte clase y transporte con los consumidores publicados", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "9007199254740993" })),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(CompatibilityError).toBe(ApiError);
    expect(await http("/fichas")).toEqual({ id: "9007199254740993" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/fichas");
  });

  it("usa una sola configuración y conserva las cabeceras del llamante", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:3000/api/v1");
    const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    await apiRequest("/fichas", {
      method: "POST",
      headers: { "X-Request-Id": "prueba" },
      body: JSON.stringify({ version: 1 }),
    });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:3000/api/v1/fichas");
    expect(options.headers.get("X-Request-Id")).toBe("prueba");
    expect(options.headers.get("Accept")).toBe("application/json");
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.credentials).toBe("same-origin");
  });

  it("deja que el navegador establezca el límite multipart del PDF", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    const form = new FormData();
    form.append(
      "archivo",
      new Blob(["PDF sintético"], { type: "application/pdf" }),
      "ensayo.pdf",
    );
    await apiRequest("/documentos", { method: "POST", body: form });
    expect(fetcher.mock.calls[0][1].headers.has("Content-Type")).toBe(false);
    expect(fetcher.mock.calls[0][1].body).toBe(form);
  });

  it("conserva campos e identificador con la representación body del equipo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            estado: 400,
            codigo: "DATOS_INVALIDOS",
            mensaje: "Revisa los campos.",
            errores: [{ campo: "detalle.nombre", mensaje: "Es obligatorio." }],
            idSolicitud: "SOL-prueba",
          }),
          { status: 400 },
        ),
      ),
    );
    await expect(apiRequest("/fichas")).rejects.toMatchObject({
      body: {
        estado: 400,
        codigo: "DATOS_INVALIDOS",
        errores: [{ campo: "detalle.nombre", mensaje: "Es obligatorio." }],
        idSolicitud: "SOL-prueba",
      },
    });
  });

  it("no muestra mensajes de error ajenos al contrato", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            codigo: "UNKNOWN",
            mensaje: "SELECT DATOS_PRIVADOS",
          }),
          { status: 500 },
        ),
      ),
    );
    try {
      await apiRequest("/fichas");
      throw new Error("No rechazó");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).body.codigo).toBe("RESPUESTA_NO_RECONOCIDA");
      expect(JSON.stringify((error as ApiError).body)).not.toContain(
        "DATOS_PRIVADOS",
      );
    }
  });

  it("una escritura sin respuesta queda incierta y no se reintenta", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new TypeError("Error privado de red"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("/fichas", { method: "POST", body: "{}" }),
    ).rejects.toMatchObject({ body: { codigo: "RESPUESTA_NO_RECIBIDA" } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("distingue una consulta sin conexión de una escritura incierta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Red privada")),
    );
    await expect(apiRequest("/fichas")).rejects.toMatchObject({
      body: { codigo: "CONEXION_NO_DISPONIBLE" },
    });
  });

  it("propaga la cancelación de una consulta obsoleta", async () => {
    const source = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Cancelada", "AbortError")),
            );
          }),
      ),
    );
    const pending = apiRequest("/fichas", { signal: source.signal });
    const checked = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    source.abort();
    await checked;
  });

  it("el tiempo de espera tampoco repite una mutación", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () =>
            reject(new DOMException("Tiempo agotado", "AbortError")),
          );
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    const checked = expect(
      apiRequest(
        "/fichas",
        { method: "PATCH", body: "{}" },
        areaRequestOptions,
      ),
    ).rejects.toMatchObject({ body: { codigo: "RESPUESTA_NO_RECIBIDA" } });
    await vi.advanceTimersByTimeAsync(20_000);
    await checked;
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

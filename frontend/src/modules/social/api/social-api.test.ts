import { apiRequest } from "@/shared/api/http-client";
import { beforeEach, it, expect, vi } from "vitest";
import { api as records } from "@/shared/api/area-records";

import { socialApi } from "./social-api";
vi.mock("@/shared/api/http-client", async (original) => ({
  ...(await original<typeof import("@/shared/api/http-client")>()),
  apiRequest: vi.fn(),
}));
const signal = () => new AbortController().signal;
beforeEach(() => {
  vi.mocked(apiRequest).mockResolvedValue({ expediente: { id: "10" } });
});
it("abre la ficha Social del expediente correcto", async () => {
  vi.spyOn(records, "ficha").mockResolvedValue({
    id: "1",
    tipo: "SOCIAL",
    expedienteId: "10",
  } as never);
  expect((await socialApi.get("1", signal(), "100")).id).toBe("1");
});
it.each(["20", undefined])(
  "rechaza expediente ajeno o ausente: %s",
  async (expedienteId) => {
    vi.spyOn(records, "ficha").mockResolvedValue({
      id: "1",
      tipo: "SOCIAL",
      expedienteId,
    } as never);
    await expect(socialApi.get("1", signal(), "100")).rejects.toMatchObject({
      codigo: "REGISTRO_NO_ENCONTRADO",
    });
  },
);
it("una respuesta sin expediente no equivale a propiedad autorizada", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ expediente: null });
  vi.spyOn(records, "ficha").mockResolvedValue({
    id: "1",
    tipo: "SOCIAL",
  } as never);
  await expect(socialApi.get("1", signal(), "100")).rejects.toMatchObject({
    codigo: "REGISTRO_NO_ENCONTRADO",
  });
});

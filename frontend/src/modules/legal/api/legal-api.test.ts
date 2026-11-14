import { apiRequest } from "@/shared/api/http-client";
import { beforeEach, it, expect, vi } from "vitest";
import { api as records } from "@/shared/api/area-records";

import { legalApi } from "./legal-api";
vi.mock("@/shared/api/http-client", async (original) => ({
  ...(await original<typeof import("@/shared/api/http-client")>()),
  apiRequest: vi.fn(),
}));
const signal = () => new AbortController().signal;
beforeEach(() => {
  vi.mocked(apiRequest).mockResolvedValue({ expediente: { id: "10" } });
});
it("abre la ficha Legal del expediente correcto", async () => {
  vi.spyOn(records, "ficha").mockResolvedValue({
    id: "1",
    tipo: "LEGAL",
    expedienteId: "10",
  } as never);
  expect((await legalApi.get("1", false, signal(), "100")).id).toBe("1");
});
it.each(["20", undefined])(
  "rechaza expediente ajeno o ausente: %s",
  async (expedienteId) => {
    vi.spyOn(records, "ficha").mockResolvedValue({
      id: "1",
      tipo: "LEGAL",
      expedienteId,
    } as never);
    await expect(
      legalApi.get("1", false, signal(), "100"),
    ).rejects.toMatchObject({ codigo: "REGISTRO_NO_ENCONTRADO" });
  },
);
it("una respuesta sin expediente no equivale a propiedad autorizada", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ expediente: null });
  vi.spyOn(records, "ficha").mockResolvedValue({
    id: "1",
    tipo: "LEGAL",
  } as never);
  await expect(legalApi.get("1", false, signal(), "100")).rejects.toMatchObject(
    { codigo: "REGISTRO_NO_ENCONTRADO" },
  );
});
it("solo abre referencias de la beneficiaria indicada", async () => {
  vi.spyOn(records, "referencia").mockResolvedValue({
    id: "1",
    tipo: "REFERENCIA_LEGAL",
    beneficiariaId: "100",
  } as never);
  await expect(legalApi.get("1", true, signal(), "100")).resolves.toMatchObject(
    { id: "1" },
  );
  await expect(legalApi.get("1", true, signal(), "200")).rejects.toMatchObject({
    codigo: "REGISTRO_NO_ENCONTRADO",
  });
});

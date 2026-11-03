import { ConflictException } from "@nestjs/common";

import { NinosService } from "./ninos.service";
import { NinosRepository } from "./repositories/ninos.repository";

describe("NinosService", () => {
  const repository = { actualizar: jest.fn(), cambiarEstado: jest.fn() };
  const service = new NinosService(repository as unknown as NinosRepository);

  beforeEach(() => jest.clearAllMocks());

  it("traduce una edición concurrente a VERSION_CONFLICT", async () => {
    repository.actualizar.mockResolvedValue({ estado: "CONFLICTO_VERSION" });
    await expect(
      service.actualizar("1", { version: 1, motivo: "Edición concurrente" }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "VERSION_CONFLICT" }),
    });
  });

  it("impide repetir una transición de estado", async () => {
    repository.cambiarEstado.mockResolvedValue({ estado: "SIN_CAMBIO" });
    await expect(
      service.cambiarEstado("1", false, {
        version: 2,
        motivo: "Repetición sintética",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

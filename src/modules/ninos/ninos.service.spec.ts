import { ConflictException } from "@nestjs/common";

import { NinosService } from "./ninos.service";
import { NinosRepository } from "./repositories/ninos.repository";

describe("NinosService", () => {
  const repository = {
    crear: jest.fn(),
    actualizar: jest.fn(),
    cambiarEstado: jest.fn(),
  };
  const service = new NinosService(repository as unknown as NinosRepository);

  beforeEach(() => jest.clearAllMocks());

  it("crea una hija o hijo vinculado al expediente activo", async () => {
    repository.crear.mockResolvedValue({
      estado: "CREADO",
      nino: {
        id: "20",
        nombre: "Hija sintética",
        cui: "1234567890123",
        fechaNacimiento: null,
        reconocido: null,
        genero: "F",
        activo: true,
        version: 1,
      },
    });

    await expect(
      service.crear("1", { nombre: "Hija sintética", genero: "F" }),
    ).resolves.toMatchObject({ data: { id: "20", activo: true } });
    expect(repository.crear).toHaveBeenCalledWith("1", {
      nombre: "Hija sintética",
      genero: "F",
    });
  });

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

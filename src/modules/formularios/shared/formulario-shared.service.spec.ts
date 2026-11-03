import { BadRequestException, ConflictException } from "@nestjs/common";

import { FormularioSharedRepository } from "./formulario-shared.repository";
import { FormularioSharedService } from "./formulario-shared.service";

describe("FormularioSharedService", () => {
  const repository = {
    obtener: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    confirmar: jest.fn(),
  };
  const service = new FormularioSharedService(
    repository as unknown as FormularioSharedRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it("exige un hijo para una variante infantil", async () => {
    await expect(
      service.crear("1", {
        tipo: "GUARDERIA",
        fechaAtencion: "2026-10-31T15:00:00-06:00",
        profesionalId: "2",
        detalle: {},
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "INVALID_FORM_SUBJECT" }),
    });
    expect(repository.crear).not.toHaveBeenCalled();
  });

  it("rechaza campos que no pertenecen a la variante", async () => {
    await expect(
      service.crear("1", {
        tipo: "SOCIAL",
        fechaAtencion: "2026-10-31T15:00:00-06:00",
        profesionalId: "2",
        detalle: { temperaturaC: 37 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("traduce la concurrencia a VERSION_CONFLICT", async () => {
    repository.obtener.mockResolvedValue({ tipo: "SOCIAL" });
    repository.actualizar.mockResolvedValue({ estado: "CONFLICTO_VERSION" });
    await expect(
      service.actualizar("10", {
        version: 1,
        motivo: "Corrección sintética",
        detalle: { diagnosticoSocial: "Contenido sintético" },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

import { BadRequestException, ConflictException } from "@nestjs/common";

import { SECCIONES_FICHA } from "./ficha-inicial.constants";
import { FichaInicialService } from "./ficha-inicial.service";
import { FichaInicialRepository } from "./repositories/ficha-inicial.repository";

describe("FichaInicialService", () => {
  const repository = {
    guardarSeccion: jest.fn(),
    confirmar: jest.fn(),
  };
  const service = new FichaInicialService(
    repository as unknown as FichaInicialRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it("rechaza una sección ajena a las 19 institucionales", async () => {
    await expect(
      service.guardarSeccion("1", "seccion-inventada", {
        contenido: { valor: true },
        versionFicha: 1,
        motivo: "Prueba sintética",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.guardarSeccion).not.toHaveBeenCalled();
  });

  it("informa exactamente las secciones faltantes al confirmar", async () => {
    repository.confirmar.mockResolvedValue({
      estado: "INCOMPLETA",
      faltantes: ["salud", "seguimiento"],
    });
    await expect(
      service.confirmar("1", { version: 2, motivo: "Validar completitud" }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "INCOMPLETE_INITIAL_INTAKE" }),
    });
    expect(repository.confirmar).toHaveBeenCalledWith(
      "1",
      2,
      "Validar completitud",
      SECCIONES_FICHA,
    );
  });

  it("impide editar una ficha confirmada", async () => {
    repository.guardarSeccion.mockResolvedValue({ estado: "CONFIRMADA" });
    await expect(
      service.guardarSeccion("1", "salud", {
        contenido: { nota: "Sintético" },
        versionFicha: 3,
        motivo: "Intento controlado",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

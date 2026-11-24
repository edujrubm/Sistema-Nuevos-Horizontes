import { ErrorPublicoException } from "../../common/errors/error-publico.exception";

import { BeneficiariasService } from "./beneficiarias.service";
import { BeneficiariasRepository } from "./repositories/beneficiarias.repository";

describe("BeneficiariasService - inicio de ficha", () => {
  const repository = {
    validarReferencias: jest.fn(),
    crear: jest.fn(),
  };
  const service = new BeneficiariasService(
    repository as unknown as BeneficiariasRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.validarReferencias.mockResolvedValue([]);
  });

  it("rechaza departamento de origen sin país antes de insertar", async () => {
    await expect(
      service.crear({
        nombre: "Registro sintético",
        departamentoOrigenId: "3",
        fichaInicial: {},
      }),
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      erroresPublicos: expect.arrayContaining([
        expect.objectContaining({ campo: "paisOrigenId" }),
      ]),
    });
    expect(repository.crear).not.toHaveBeenCalled();
  });

  it("rechaza referencias de catálogo inexistentes antes de insertar", async () => {
    repository.validarReferencias.mockResolvedValue(["ocupacionId"]);
    await expect(
      service.crear({
        nombre: "Registro sintético",
        ocupacionId: "999999999",
        fichaInicial: {},
      }),
    ).rejects.toMatchObject({
      codigo: "RELACION_INCOMPATIBLE",
      erroresPublicos: [expect.objectContaining({ campo: "ocupacionId" })],
    });
    expect(repository.crear).not.toHaveBeenCalled();
  });

  it("rechaza una sección inicial vacía", async () => {
    await expect(
      service.crear({
        nombre: "Registro sintético",
        fichaInicial: { seccionesIniciales: { identificacion: {} } },
      }),
    ).rejects.toBeInstanceOf(ErrorPublicoException);
    expect(repository.crear).not.toHaveBeenCalled();
  });

  it("rechaza el CUI duplicado al iniciar la primera página", async () => {
    repository.crear.mockResolvedValue({ conflictoCui: true });

    await expect(
      service.crear({
        nombre: "Registro sintético",
        cui: "1234567890101",
        fichaInicial: {},
      }),
    ).rejects.toMatchObject({
      status: 409,
      codigo: "REGISTRO_DUPLICADO",
    });
  });
});

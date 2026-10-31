import { BadRequestException, ConflictException } from "@nestjs/common";
import { BeneficiariasService } from "../beneficiarias/beneficiarias.service";

import { SECCIONES_FICHA } from "./ficha-inicial.constants";
import { FichaInicialService } from "./ficha-inicial.service";
import { FichaInicialRepository } from "./repositories/ficha-inicial.repository";

describe("FichaInicialService", () => {
  const repository = {
    guardarSeccion: jest.fn(),
    guardarPagina: jest.fn(),
    confirmar: jest.fn(),
  };
  const beneficiarias = {
    crear: jest.fn(),
  };
  const service = new FichaInicialService(
    repository as unknown as FichaInicialRepository,
    beneficiarias as unknown as BeneficiariasService,
  );

  beforeEach(() => jest.clearAllMocks());

  it("inicia la ficha y la beneficiaria como una sola admisión", async () => {
    const entrada = {
      nombre: "Beneficiaria sintética",
      fichaInicial: { lugar: "Sede de prueba" },
    };
    beneficiarias.crear.mockResolvedValue({
      data: { fichaInicial: { id: "10", estado: "BORRADOR" } },
    });

    await expect(service.iniciar(entrada)).resolves.toMatchObject({
      data: { fichaInicial: { id: "10", estado: "BORRADOR" } },
    });
    expect(beneficiarias.crear).toHaveBeenCalledWith(entrada);
  });

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

  it("guarda juntas las secciones de una página visible", async () => {
    repository.guardarPagina.mockResolvedValue({
      estado: "ACTUALIZADA",
      ficha: { id: "1", estado: "BORRADOR", version: 4 },
    });
    await expect(
      service.guardarPagina("1", "datos-salud", {
        secciones: {
          "datos-generales": { alfabetismo: true },
          salud: { enfermedadPermanente: false },
        },
        versionFicha: 3,
        motivo: "Guardar página de prueba",
      }),
    ).resolves.toMatchObject({
      data: {
        pagina: "datos-salud",
        seccionesGuardadas: ["datos-generales", "salud"],
      },
    });
  });

  it("crea hijos dentro del guardado transaccional de la página Familia", async () => {
    repository.guardarPagina.mockResolvedValue({
      estado: "ACTUALIZADA",
      ficha: { id: "1", estado: "BORRADOR", version: 5 },
      hijos: [{ id: "20", nombre: "Hija sintética", version: 1 }],
    });
    const entrada = {
      secciones: {
        "grupo-familiar": { otrasPersonasDelGrupoFamiliar: [] },
        agresores: { personasAgresoras: [] },
      },
      hijos: [{ nombre: "Hija sintética", genero: "F" }],
      versionFicha: 4,
      motivo: "Guardar familia de prueba",
    };

    await expect(
      service.guardarPagina("1", "familia", entrada),
    ).resolves.toMatchObject({
      data: { hijos: [{ id: "20", version: 1 }] },
    });
    expect(repository.guardarPagina).toHaveBeenCalledWith(
      "1",
      entrada.secciones,
      entrada.hijos,
      4,
      "Guardar familia de prueba",
    );
  });

  it("no permite crear hijos desde otra página", async () => {
    await expect(
      service.guardarPagina("1", "residencia", {
        secciones: { residencia: { urbano: true } },
        hijos: [{ nombre: "Hija sintética" }],
        versionFicha: 1,
        motivo: "Prueba controlada",
      }),
    ).rejects.toMatchObject({ codigo: "CAMPO_NO_PERMITIDO" });
  });

  it("rechaza secciones que no pertenecen a la página", async () => {
    await expect(
      service.guardarPagina("1", "residencia", {
        secciones: { salud: { valor: true } },
        versionFicha: 1,
        motivo: "Prueba de validación",
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "INVALID_PAGE_SECTIONS" }),
    });
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

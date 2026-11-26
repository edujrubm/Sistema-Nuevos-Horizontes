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
    descartar: jest.fn(),
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
      tipoDocumento: "SIN_DOCUMENTO",
      fechaNacimiento: "1990-01-01",
      paisOrigenId: "1",
      departamentoOrigenId: "1",
      municipioOrigenId: "1",
      fechaEntrevista: "2026-11-25",
      fichaInicial: { lugar: "Sede de prueba" },
    };
    beneficiarias.crear.mockResolvedValue({
      data: { fichaInicial: { id: "10", estado: "BORRADOR" } },
    });

    await expect(service.iniciar(entrada)).resolves.toMatchObject({
      data: { fichaInicial: { id: "10", estado: "BORRADOR" } },
    });
    expect(beneficiarias.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Beneficiaria sintética",
        fichaInicial: expect.any(Object),
      }),
    );
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
          "datos-generales": {
            estadoCivilDeclarado: "Soltera",
            etniaDeclarada: "Maya",
            ocupacionDeclarada: "Comerciante",
            nivelEscolaridadDeclarado: "Primaria completa",
          },
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

  it("rechaza desde la API una página sin datos fuente de reportería", async () => {
    await expect(
      service.guardarPagina("1", "identificacion", {
        secciones: { identificacion: { idiomaAtencion: "Español" } },
        versionFicha: 1,
        motivo: "Intento incompleto de prueba",
      }),
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      erroresPublicos: expect.arrayContaining([
        expect.objectContaining({ campo: "identificacion.sexoDeclarado" }),
        expect.objectContaining({
          campo: "identificacion.nacionalidadDeclarada",
        }),
      ]),
    });
    expect(repository.guardarPagina).not.toHaveBeenCalled();
  });

  it("conserva únicamente el valor Otra original en el JSON", async () => {
    repository.guardarPagina.mockResolvedValue({
      estado: "ACTUALIZADA",
      ficha: { id: "1", estado: "BORRADOR", version: 4 },
      hijos: [],
    });

    await service.guardarPagina("1", "datos-salud", {
      secciones: {
        "datos-generales": {
          estadoCivilDeclarado: "Soltera",
          etniaDeclarada: "Otra",
          otraEtnia: "  Térmo... ",
          ocupacionDeclarada: "Comerciante",
          nivelEscolaridadDeclarado: "Primaria completa",
        },
        salud: { otraDiscapacidad: "FÍSICA." },
      },
      versionFicha: 3,
      motivo: "Guardar valores normalizados",
    });

    expect(repository.guardarPagina).toHaveBeenCalledWith(
      "1",
      "datos-salud",
      {
        "datos-generales": {
          estadoCivilDeclarado: "Soltera",
          etniaDeclarada: "Otra",
          otraEtnia: "  Térmo... ",
          ocupacionDeclarada: "Comerciante",
          nivelEscolaridadDeclarado: "Primaria completa",
        },
        salud: {
          otraDiscapacidad: "FÍSICA.",
        },
      },
      [],
      3,
      "Guardar valores normalizados",
    );
  });

  it("rechaza una opción Otra formada solo por puntuación", async () => {
    await expect(
      service.guardarPagina("1", "violencia", {
        secciones: {
          "motivo-consulta": { seleccion: ["Violencia contra la mujer"] },
          "tipos-violencia": { seleccion: ["Otra"], otra: " ... " },
          "objetos-agresion": { seleccion: ["Manos"] },
        },
        versionFicha: 1,
        motivo: "Probar validación de Otra",
      }),
    ).rejects.toMatchObject({ codigo: "DATOS_INVALIDOS" });
    expect(repository.guardarPagina).not.toHaveBeenCalled();
  });

  it("crea hijos dentro del guardado transaccional de la página Familia", async () => {
    repository.guardarPagina.mockResolvedValue({
      estado: "ACTUALIZADA",
      ficha: { id: "1", estado: "BORRADOR", version: 5 },
      hijos: [{ id: "20", nombre: "Hija sintética", version: 1 }],
    });
    const entrada = {
      secciones: {
        agresores: { relacionParentesco: "Ex conviviente" },
      },
      hijos: [
        {
          nombre: "Hija sintética",
          fechaNacimiento: "2018-01-01",
          genero: "F",
        },
      ],
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
      "familia",
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
      codigo: "SOLICITUD_INCOMPLETA",
      erroresPublicos: [
        {
          campo: "salud",
          mensaje: "Completa y guarda la sección: salud.",
        },
        {
          campo: "seguimiento",
          mensaje: "Completa y guarda la sección: seguimiento.",
        },
      ],
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

  it("descarta lógicamente un borrador con motivo y versión", async () => {
    repository.descartar.mockResolvedValue({
      estado: "DESCARTADA",
      ficha: { id: "1", estado: "DESCARTADA", version: 5 },
    });

    await expect(
      service.descartar("1", {
        version: 4,
        motivo: "  Registro duplicado de prueba  ",
      }),
    ).resolves.toMatchObject({ data: { estado: "DESCARTADA" } });
    expect(repository.descartar).toHaveBeenCalledWith(
      "1",
      4,
      "Registro duplicado de prueba",
    );
  });
});

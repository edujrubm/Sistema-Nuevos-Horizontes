import { ConflictException } from "@nestjs/common";

import { FormularioSharedRepository } from "./formulario-shared.repository";
import { FormularioSharedService } from "./formulario-shared.service";

describe("FormularioSharedService", () => {
  const repository = {
    obtener: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    confirmar: jest.fn(),
    descartar: jest.fn(),
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
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      errores: [{ campo: "detalle.temperaturaC", mensaje: expect.any(String) }],
    });
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

  it("descarta un borrador con versión y motivo explícito", async () => {
    repository.descartar.mockResolvedValue({
      estado: "DESCARTADO",
      formulario: { id: "10", estado: "DESCARTADO" },
    });

    await expect(
      service.descartar("10", {
        version: 2,
        motivo: "  Se inició para la persona equivocada.  ",
      }),
    ).resolves.toEqual({
      data: expect.objectContaining({ id: "10", estado: "DESCARTADO" }),
    });
    expect(repository.descartar).toHaveBeenCalledWith(
      "10",
      2,
      "Se inició para la persona equivocada.",
    );
  });
  it("identifica el profesional inexistente al crear", async () => {
    repository.crear.mockResolvedValue({ estado: "PROFESIONAL_NO_ENCONTRADO" });
    await expect(
      service.crear("100", {
        tipo: "LEGAL",
        fechaAtencion: "2026-11-13T10:00:00-06:00",
        profesionalId: "99999",
        detalle: {},
      }),
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      errores: [{ campo: "profesionalId", mensaje: expect.any(String) }],
    });
  });

  it("identifica el profesional inexistente al editar", async () => {
    repository.obtener.mockResolvedValue({ tipo: "LEGAL" });
    repository.actualizar.mockResolvedValue({
      estado: "PROFESIONAL_NO_ENCONTRADO",
    });
    await expect(
      service.actualizar("10", {
        version: 1,
        motivo: "Prueba sintética",
        profesionalId: "99999",
      }),
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      errores: [{ campo: "profesionalId", mensaje: expect.any(String) }],
    });
  });

  it("devuelve todos los campos inválidos del detalle sin sus valores", async () => {
    await expect(
      service.crear("100", {
        tipo: "LEGAL",
        fechaAtencion: "2026-11-13T10:00:00-06:00",
        profesionalId: "1",
        detalle: { inicioProcesoFecha: "2026-02-31", juzgado: 123 },
      }),
    ).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      errores: [
        { campo: "detalle.inicioProcesoFecha", mensaje: expect.any(String) },
        { campo: "detalle.juzgado", mensaje: expect.any(String) },
      ],
    });
    expect(repository.crear).not.toHaveBeenCalled();
  });
});

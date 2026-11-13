import { ConfigService } from "@nestjs/config";
import { DataSource, EntityManager } from "typeorm";

import { FormularioSharedRepository } from "./formulario-shared.repository";
import { LegalFormRepository } from "../legal";

describe("FormularioSharedRepository", () => {
  const legal = {
    handles: jest.fn().mockResolvedValue(false),
  } as unknown as LegalFormRepository;
  const config = {
    get: jest.fn((_: string, fallback: string) => fallback),
  } as unknown as ConfigService;

  it("omite los formularios descartados del listado operativo", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new FormularioSharedRepository(
      { query } as unknown as DataSource,
      config,
      legal,
    );

    await repository.listar("7", { limite: 25 });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("f.estado_codigo <> $2"),
      ["7", "DESCARTADO", 26],
    );
  });

  it("cambia a DESCARTADO dentro de la transacción auditada", async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ usuarioId: "4", empleadoId: "3" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ existe: true }])
        .mockResolvedValueOnce([{ estado: "BORRADOR", version: 2 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "15",
            estado: "DESCARTADO",
            tipo: "PSICOLOGIA_MUJER",
            detalle: {},
            examenMental: null,
          },
        ]),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(
        (callback: (entityManager: EntityManager) => unknown) =>
          callback(manager),
      ),
    } as unknown as DataSource;
    const repository = new FormularioSharedRepository(
      dataSource,
      config,
      legal,
    );

    const resultado = await repository.descartar(
      "15",
      2,
      "Ficha iniciada por equivocación",
    );

    expect(resultado).toMatchObject({
      estado: "DESCARTADO",
      formulario: { id: "15", estado: "DESCARTADO" },
    });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining("SET estado_codigo=$2"),
      ["15", "DESCARTADO", "Ficha iniciada por equivocación"],
    );
  });
});

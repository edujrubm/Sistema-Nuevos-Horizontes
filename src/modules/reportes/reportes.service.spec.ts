import { DataSource } from "typeorm";

import { ReportesService } from "./reportes.service";

describe("ReportesService valores Otros de Ficha Inicial", () => {
  it("agrupa variantes históricas aunque todavía no tengan campo normalizado", async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            seccion: "salud",
            campo: "otraDiscapacidad",
            valorNormalizado: "termo",
            etiquetaReporteria: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "1",
            seccion: "salud",
            contenido: { otraDiscapacidad: "Termo." },
          },
          {
            id: "2",
            seccion: "salud",
            contenido: { otraDiscapacidad: "  TÉRMO... " },
          },
        ]),
    };
    const service = new ReportesService(dataSource as unknown as DataSource);

    await expect(service.listarValoresOtros()).resolves.toEqual({
      data: [
        expect.objectContaining({
          seccion: "salud",
          campo: "otraDiscapacidad",
          valorNormalizado: "termo",
          vecesObservado: 2,
          variantes: ["Termo.", "  TÉRMO... "],
        }),
      ],
    });
  });

  it("guarda una sola etiqueta oficial fuera del JSON", async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "5" }])
        .mockResolvedValueOnce([{ total: "2" }]),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };
    const service = new ReportesService(dataSource as unknown as DataSource);

    await expect(
      service.actualizarEtiqueta(
        {
          seccion: "salud",
          campo: "otraDiscapacidad",
          valorNormalizado: "TERMO.",
          etiqueta: "Térmo",
        },
        "7",
      ),
    ).resolves.toMatchObject({ data: { fichasActualizadas: 2 } });
    const actualizaciones = manager.query.mock.calls.filter(([sql]) =>
      String(sql).includes("UPDATE new_horizons.valor_otro_ficha_inicial"),
    );
    expect(actualizaciones).toHaveLength(1);
    expect(actualizaciones[0][1]).toEqual([
      "salud",
      "otraDiscapacidad",
      "termo",
      "Térmo",
      "7",
    ]);
  });
});

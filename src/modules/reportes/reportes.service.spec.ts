import { DataSource } from "typeorm";

import { ReportesService } from "./reportes.service";

describe("ReportesService valores Otros de Ficha Inicial", () => {
  it("agrupa variantes históricas aunque todavía no tengan campo normalizado", async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([
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

  it("aplica una etiqueta oficial a todas las fichas equivalentes", async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "1",
            seccion: "salud",
            contenido: { otraDiscapacidad: "Termo." },
          },
          {
            id: "2",
            seccion: "salud",
            contenido: { otraDiscapacidad: "TÉRMO..." },
          },
        ])
        .mockResolvedValue([]),
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
      String(sql).includes("UPDATE new_horizons.ficha_inicial_seccion"),
    );
    expect(actualizaciones).toHaveLength(2);
    expect(actualizaciones[0][1][1]).toContain(
      '"otraDiscapacidadNormalizado":"termo"',
    );
    expect(actualizaciones[0][1][1]).toContain(
      '"otraDiscapacidadEtiquetaReporteria":"Térmo"',
    );
  });
});

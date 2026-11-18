import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

import { BorradoresExpiradosService } from "./borradores-expirados.service";

describe("BorradoresExpiradosService", () => {
  it("descarta únicamente los formularios sin actividad por 24 horas", async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: "2" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "14" }]),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    } as unknown as DataSource;
    const config = {
      get: jest.fn((_: string, fallback: string) => fallback),
    } as unknown as ConfigService;
    const service = new BorradoresExpiradosService(dataSource, config);

    await expect(service.descartarVencidos()).resolves.toBe(1);
    expect(manager.query).toHaveBeenLastCalledWith(
      expect.stringContaining(
        "actualizado_en <= clock_timestamp() - INTERVAL '24 hours'",
      ),
      [
        "DESCARTADO",
        "Descarte automático: borrador sin actividad durante 24 horas",
        "BORRADOR",
      ],
    );
  });
});

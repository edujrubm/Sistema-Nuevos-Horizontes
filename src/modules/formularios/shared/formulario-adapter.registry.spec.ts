import type { EntityManager } from "typeorm";
import type { FormularioAdapter } from "./contracts/formulario-adapter";
import { FormularioAdapterRegistry } from "./formulario-adapter.registry";

describe("FormularioAdapterRegistry", () => {
  it("resuelve únicamente los adaptadores registrados", () => {
    const registro = new FormularioAdapterRegistry();
    const adaptador = {} as FormularioAdapter;
    registro.registrar("LEGAL", adaptador);
    expect(registro.obtener("LEGAL")).toBe(adaptador);
    expect(registro.obtener("SOCIAL")).toBeUndefined();
  });

  it("rechaza dos adaptadores para la misma variante", () => {
    const registro = new FormularioAdapterRegistry();
    registro.registrar("LEGAL", {} as FormularioAdapter);
    expect(() => registro.registrar("LEGAL", {} as FormularioAdapter)).toThrow(
      expect.objectContaining({ codigo: "CONFIGURACION_INCOMPLETA" }),
    );
  });

  it("conserva el manager al resolver un registro", async () => {
    const registro = new FormularioAdapterRegistry();
    const manager = {} as EntityManager;
    const handles = jest.fn().mockResolvedValue(true);
    const adaptador = { handles } as unknown as FormularioAdapter;
    registro.registrar("LEGAL", adaptador);
    expect(await registro.buscarParaRegistro("17", manager)).toBe(adaptador);
    expect(handles).toHaveBeenCalledWith("17", manager);
  });

  it("no omite una validación obligatoria sin registrar", () => {
    const registro = new FormularioAdapterRegistry();
    expect(() =>
      registro.validarConfirmacion("REFERENCIA_LEGAL", {}, true),
    ).toThrow(expect.objectContaining({ codigo: "CONFIGURACION_INCOMPLETA" }));
  });

  it("ejecuta la política registrada y rechaza registros duplicados", () => {
    const registro = new FormularioAdapterRegistry();
    const validar = jest.fn();
    const detalle = { destino: "Destino sintético" };
    registro.registrarValidacion("REFERENCIA_LEGAL", validar);
    registro.validarConfirmacion("REFERENCIA_LEGAL", detalle, true);
    expect(validar).toHaveBeenCalledWith(detalle);
    expect(() =>
      registro.registrarValidacion("REFERENCIA_LEGAL", validar),
    ).toThrow(expect.objectContaining({ codigo: "CONFIGURACION_INCOMPLETA" }));
  });
});

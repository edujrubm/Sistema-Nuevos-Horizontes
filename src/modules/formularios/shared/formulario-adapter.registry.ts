import { Injectable } from "@nestjs/common";
import type { EntityManager } from "typeorm";
import { ErrorApi } from "../../../common/errors/error-api";
import type { FormularioAdapter } from "./contracts/formulario-adapter";
import type { CodigoTipoFormulario } from "./formulario-tipos";

type ValidarConfirmacion = (detalle: Record<string, unknown>) => void;

/** Punto de extensión del motor: las áreas registran sus implementaciones. */
@Injectable()
export class FormularioAdapterRegistry {
  private readonly adaptadores = new Map<
    CodigoTipoFormulario,
    FormularioAdapter
  >();
  private readonly validaciones = new Map<
    CodigoTipoFormulario,
    ValidarConfirmacion
  >();

  registrar(tipo: CodigoTipoFormulario, adaptador: FormularioAdapter): void {
    if (this.adaptadores.has(tipo)) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    this.adaptadores.set(tipo, adaptador);
  }

  obtener(tipo?: string): FormularioAdapter | undefined {
    return this.adaptadores.get(tipo as CodigoTipoFormulario);
  }

  async buscarParaRegistro(id: string, manager?: EntityManager) {
    for (const adaptador of new Set(this.adaptadores.values())) {
      if (await adaptador.handles(id, manager)) return adaptador;
    }
    return undefined;
  }

  registrarValidacion(
    tipo: CodigoTipoFormulario,
    validar: ValidarConfirmacion,
  ): void {
    if (this.validaciones.has(tipo)) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    this.validaciones.set(tipo, validar);
  }

  validarConfirmacion(
    tipo: CodigoTipoFormulario,
    detalle: Record<string, unknown>,
    obligatoria: boolean,
  ): void {
    const validar = this.validaciones.get(tipo);
    // No permite confirmar sin la política de un área que requiere validación.
    if (!validar && obligatoria) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    validar?.(detalle);
  }
}

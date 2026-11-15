import type { EntityManager } from "typeorm";

import type { ActualizarFormularioDto } from "../dto/actualizar-formulario.dto";
import type { CrearFormularioDto } from "../dto/crear-formulario.dto";
import type { ListarFormulariosDto } from "../dto/listar-formularios.dto";
import type { FormularioAreaRow } from "./formulario-area-row";

/** Códigos configurados por el motor común. */
export interface EstadosFormulario {
  borrador: string;
  confirmado: string;
  descartado: string;
}

/** Establece la auditoría usando la conexión de la operación. */
export type PrepararAuditoriaFormulario = (
  manager: EntityManager,
  motivo: string,
) => Promise<{ usuarioId: string }>;

export interface ResultadoOperacionFormulario {
  estado: string;
  formulario: FormularioAreaRow | null;
}

/**
 * Persistencia específica de una variante.
 * El motor conserva el contrato HTTP y cada adaptador sus operaciones.
 */
export interface FormularioAdapter {
  handles(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  get(
    id: string,
    manager?: EntityManager,
  ): Promise<FormularioAreaRow | null>;

  list(
    beneficiariaId: string,
    filtro: ListarFormulariosDto,
    estadoDescartado: string,
  ): Promise<FormularioAreaRow[]>;

  create(
    beneficiariaId: string,
    entrada: CrearFormularioDto,
    estados: EstadosFormulario,
    prepararAuditoria: PrepararAuditoriaFormulario,
  ): Promise<ResultadoOperacionFormulario>;

  update(
    id: string,
    entrada: ActualizarFormularioDto,
    estados: EstadosFormulario,
    prepararAuditoria: PrepararAuditoriaFormulario,
  ): Promise<ResultadoOperacionFormulario>;

  transition(
    id: string,
    version: number,
    motivo: string,
    destino: "CONFIRMADO" | "DESCARTADO",
    estados: EstadosFormulario,
    prepararAuditoria: PrepararAuditoriaFormulario,
  ): Promise<ResultadoOperacionFormulario>;
}
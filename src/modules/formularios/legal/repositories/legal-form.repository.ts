import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, MoreThan, Not } from "typeorm";
import { BeneficiariaEntity, ExpedienteEntity } from "../../../beneficiarias";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import {
  AreaFormularioEntity,
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../../shared/entities/tipo-formulario.entity";
import { FichaLegal } from "../entities/ficha-legal.entity";
import { CrearFormularioDto } from "../../shared/dto/crear-formulario.dto";
import { ActualizarFormularioDto } from "../../shared/dto/actualizar-formulario.dto";
import { ListarFormulariosDto } from "../../shared/dto/listar-formularios.dto";
import type { FormularioAreaRow } from "../../shared/formulario-shared.repository";

type PrepareAudit = (
  manager: EntityManager,
  reason: string,
) => Promise<{ usuarioId: string }>;
interface FormStates {
  borrador: string;
  confirmado: string;
  descartado: string;
}
function result<T extends string>(
  estado: T,
  formulario: FormularioAreaRow | null = null,
) {
  return { estado, formulario };
}

/** Adaptador de la ficha LEGAL al motor común; conserva su contrato y sus estados. */
@Injectable()
export class LegalFormRepository {
  constructor(private readonly data: DataSource) {}

  async handles(id: string, manager = this.data.manager) {
    return manager
      .getRepository(FormularioAreaEntity)
      .exists({ where: { id, tipo: "LEGAL" } });
  }

  async get(
    id: string,
    manager = this.data.manager,
  ): Promise<FormularioAreaRow | null> {
    const header = await manager
      .getRepository(FormularioAreaEntity)
      .findOne({ where: { id, tipo: "LEGAL" } });
    if (!header) return null;
    const detail = await manager
      .getRepository(FichaLegal)
      .findOne({ where: { formularioId: id } });
    const area = await manager
      .getRepository(AreaFormularioEntity)
      .findOne({ where: { id: header.areaId } });
    if (!detail || !area) return null;
    const { formularioId: _id, ...detalle } = detail;
    return {
      id: header.id,
      expedienteId: header.expedienteId,
      ninoId: header.ninoId,
      areaId: header.areaId,
      area: area.nombre,
      tipo: "LEGAL",
      estado: header.estadoCodigo,
      fechaAtencion: header.fechaAtencion,
      profesionalId: header.profesionalId,
      capturadoPor: header.capturadoPor,
      creadoEn: header.creadoEn,
      actualizadoEn: header.actualizadoEn,
      version: header.version,
      detalle,
      examenMental: null,
    };
  }

  async list(
    beneficiaryId: string,
    filter: ListarFormulariosDto,
    discarded: string,
  ) {
    const record = await this.data
      .getRepository(ExpedienteEntity)
      .findOne({ where: { beneficiariaId: beneficiaryId } });
    if (!record) return [];
    const headers = await this.data.getRepository(FormularioAreaEntity).find({
      where: {
        expedienteId: record.id,
        tipo: "LEGAL",
        estadoCodigo: Not(discarded),
        ...(filter.cursor ? { id: MoreThan(filter.cursor) } : {}),
        ...(filter.areaId ? { areaId: filter.areaId } : {}),
      },
      order: { id: "ASC" },
      take: filter.limite + 1,
    });
    const rows = await Promise.all(
      headers.map((header) => this.get(header.id)),
    );
    return rows.filter((row): row is FormularioAreaRow => row !== null);
  }

  /** La cabecera, el detalle y los triggers de auditoría pertenecen a una sola transacción. */
  async create(
    beneficiaryId: string,
    input: CrearFormularioDto,
    states: FormStates,
    prepare: PrepareAudit,
  ) {
    return this.data.transaction(async (manager) => {
      const actor = await prepare(manager, "Creación de formulario de área");
      if (
        !(await manager
          .getRepository(EstadoFormularioEntity)
          .exists({ where: { codigo: states.borrador } }))
      )
        return result("CATALOGO_ESTADO_NO_CONFIGURADO");
      const type = await manager
        .getRepository(TipoFormularioEntity)
        .findOne({ where: { codigo: "LEGAL" } });
      if (!type) return result("TIPO_NO_ENCONTRADO");
      const record = await manager
        .getRepository(ExpedienteEntity)
        .findOne({ where: { beneficiariaId: beneficiaryId, activo: true } });
      if (!record) return result("SIN_EXPEDIENTE");
      if (
        !(await manager
          .getRepository(ProfesionalFormularioEntity)
          .exists({ where: { id: input.profesionalId } }))
      )
        return result("PROFESIONAL_NO_ENCONTRADO");
      const person = await manager
        .getRepository(BeneficiariaEntity)
        .findOneOrFail({ where: { id: beneficiaryId } });
      const header = await manager.getRepository(FormularioAreaEntity).save({
        expedienteId: record.id,
        areaId: type.areaId,
        tipo: "LEGAL",
        estadoCodigo: states.borrador,
        fechaAtencion: new Date(input.fechaAtencion),
        profesionalId: input.profesionalId,
        capturadoPor: actor.usuarioId,
        identidadAlAtender: {
          tipo: "BENEFICIARIA",
          id: beneficiaryId,
          nombre: person.nombre,
          cui: person.cui,
          fechaNacimiento: person.fechaNacimiento,
        },
      });
      await manager
        .getRepository(FichaLegal)
        .save({ ...input.detalle, formularioId: header.id });
      return result("CREADO", await this.get(header.id, manager));
    });
  }

  /** Bloquea la cabecera antes de comprobar versión; no permite sobrescribir otra edición. */
  async update(
    id: string,
    input: ActualizarFormularioDto,
    states: FormStates,
    prepare: PrepareAudit,
  ) {
    return this.data.transaction(async (manager) => {
      await prepare(manager, input.motivo);
      const header = await manager.getRepository(FormularioAreaEntity).findOne({
        where: { id, tipo: "LEGAL" },
        lock: { mode: "pessimistic_write" },
      });
      if (!header) return result("NO_ENCONTRADO");
      if (header.estadoCodigo !== states.borrador)
        return result("NO_ES_BORRADOR");
      if (header.version !== input.version) return result("CONFLICTO_VERSION");
      if (
        input.profesionalId &&
        !(await manager
          .getRepository(ProfesionalFormularioEntity)
          .exists({ where: { id: input.profesionalId } }))
      )
        return result("PROFESIONAL_NO_ENCONTRADO");
      if (input.fechaAtencion || input.profesionalId) {
        await manager.getRepository(FormularioAreaEntity).update(
          { id },
          {
            ...(input.fechaAtencion
              ? { fechaAtencion: new Date(input.fechaAtencion) }
              : {}),
            ...(input.profesionalId
              ? { profesionalId: input.profesionalId }
              : {}),
            motivoCambio: input.motivo,
          },
        );
      }
      if (input.detalle && Object.keys(input.detalle).length)
        await manager
          .getRepository(FichaLegal)
          .update({ formularioId: id }, input.detalle);
      return result("ACTUALIZADO", await this.get(id, manager));
    });
  }

  async transition(
    id: string,
    version: number,
    reason: string,
    target: "CONFIRMADO" | "DESCARTADO",
    states: FormStates,
    prepare: PrepareAudit,
  ) {
    return this.data.transaction(async (manager) => {
      await prepare(manager, reason);
      const state =
        target === "CONFIRMADO" ? states.confirmado : states.descartado;
      if (
        !(await manager
          .getRepository(EstadoFormularioEntity)
          .exists({ where: { codigo: state } }))
      )
        return result("CATALOGO_ESTADO_NO_CONFIGURADO");
      const header = await manager.getRepository(FormularioAreaEntity).findOne({
        where: { id, tipo: "LEGAL" },
        lock: { mode: "pessimistic_write" },
      });
      if (!header) return result("NO_ENCONTRADO");
      if (header.estadoCodigo !== states.borrador)
        return result(
          target === "CONFIRMADO" ? "YA_CONFIRMADO" : "NO_ES_BORRADOR",
        );
      if (header.version !== version) return result("CONFLICTO_VERSION");
      await manager
        .getRepository(FormularioAreaEntity)
        .update({ id }, { estadoCodigo: state, motivoCambio: reason });
      return result(target, await this.get(id, manager));
    });
  }
}

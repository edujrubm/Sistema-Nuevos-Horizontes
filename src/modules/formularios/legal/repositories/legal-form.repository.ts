import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { DataSource, In, MoreThan, Not } from "typeorm";

import {
  BeneficiariaEntity,
  ExpedienteEntity,
} from "../../../beneficiarias";

import { ActualizarFormularioDto } from "../../shared/dto/actualizar-formulario.dto";
import { CrearFormularioDto } from "../../shared/dto/crear-formulario.dto";
import { ListarFormulariosDto } from "../../shared/dto/listar-formularios.dto";

import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import {
  AreaFormularioEntity,
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../../shared/entities/tipo-formulario.entity";

import type { FormularioAreaRow } from "../../shared/contracts/formulario-area-row";
import { FichaLegal } from "../entities/ficha-legal.entity";
import type {
  EstadosFormulario,
  FormularioAdapter,
  PrepararAuditoriaFormulario,
} from "../../shared/contracts/formulario-adapter";

function result<T extends string>(
  estado: T,
  formulario: FormularioAreaRow | null = null,
) {
  return { estado, formulario };
}

/** Persistencia ORM de la ficha legal para el motor de formularios. */
@Injectable()
export class LegalFormRepository implements FormularioAdapter {
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

  /**
   * Recupera cabeceras, detalles y áreas por lotes.
   * Conserva un registro adicional para calcular la siguiente página.
   */
  async list(
    beneficiaryId: string,
    filter: ListarFormulariosDto,
    discarded: string,
  ): Promise<FormularioAreaRow[]> {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const record = await manager
        .getRepository(ExpedienteEntity)
        .findOne({
          where: { beneficiariaId: beneficiaryId },
        });

      if (!record) return [];

      const headers = await manager
        .getRepository(FormularioAreaEntity)
        .find({
          where: {
            expedienteId: record.id,
            tipo: "LEGAL",
            estadoCodigo: Not(discarded),
            ...(filter.cursor
              ? { id: MoreThan(filter.cursor) }
              : {}),
            ...(filter.areaId
              ? { areaId: filter.areaId }
              : {}),
          },
          order: { id: "ASC" },
          take: filter.limite + 1,
        });

      if (headers.length === 0) return [];

      const detalles = await manager.getRepository(FichaLegal).find({
        where: {
          formularioId: In(headers.map((header) => header.id)),
        },
      });

      const areaIds = [
        ...new Set(headers.map((header) => header.areaId)),
      ];

      const areas = await manager
        .getRepository(AreaFormularioEntity)
        .find({
          where: {
            id: In(areaIds),
          },
        });

      const detallesPorId = new Map(
        detalles.map((detalle) => [
          detalle.formularioId,
          detalle,
        ]),
      );

      const areasPorId = new Map(
        areas.map((area) => [area.id, area]),
      );

      return headers.map((header): FormularioAreaRow => {
        const detalle = detallesPorId.get(header.id);
        const area = areasPorId.get(header.areaId);

        if (!detalle || !area) {
          throw new InternalServerErrorException(
            "No se pudo recuperar la información completa de las fichas legales.",
          );
        }

        const {
          formularioId: _id,
          ...camposDetalle
        } = detalle;

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
          detalle: camposDetalle,
          examenMental: null,
        };
      });
    });
  }

  /** Crea cabecera y detalle dentro de la misma transacción. */
  async create(
    beneficiaryId: string,
    input: CrearFormularioDto,
    states: EstadosFormulario,
    prepare: PrepararAuditoriaFormulario,
  ) {
    return this.data.transaction(async (manager) => {
      const actor = await prepare(
        manager,
        "Creación de formulario de área",
      );

      const existeEstado = await manager
        .getRepository(EstadoFormularioEntity)
        .exists({
          where: { codigo: states.borrador },
        });

      if (!existeEstado) {
        return result("CATALOGO_ESTADO_NO_CONFIGURADO");
      }

      const type = await manager
        .getRepository(TipoFormularioEntity)
        .findOne({
          where: { codigo: "LEGAL" },
        });

      if (!type) return result("TIPO_NO_ENCONTRADO");

      const record = await manager
        .getRepository(ExpedienteEntity)
        .findOne({
          where: {
            beneficiariaId: beneficiaryId,
            activo: true,
          },
        });

      if (!record) return result("SIN_EXPEDIENTE");

      const existeProfesional = await manager
        .getRepository(ProfesionalFormularioEntity)
        .exists({
          where: { id: input.profesionalId },
        });

      if (!existeProfesional) {
        return result("PROFESIONAL_NO_ENCONTRADO");
      }

      const person = await manager
        .getRepository(BeneficiariaEntity)
        .findOneOrFail({
          where: { id: beneficiaryId },
        });

      const header = await manager
        .getRepository(FormularioAreaEntity)
        .save({
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

      await manager.getRepository(FichaLegal).save({
        ...input.detalle,
        formularioId: header.id,
      });

      return result(
        "CREADO",
        await this.get(header.id, manager),
      );
    });
  }

  /** Bloquea la cabecera antes de comprobar estado y versión. */
  async update(
    id: string,
    input: ActualizarFormularioDto,
    states: EstadosFormulario,
    prepare: PrepararAuditoriaFormulario,
  ) {
    return this.data.transaction(async (manager) => {
      await prepare(manager, input.motivo);

      const header = await manager
        .getRepository(FormularioAreaEntity)
        .findOne({
          where: { id, tipo: "LEGAL" },
          lock: { mode: "pessimistic_write" },
        });

      if (!header) return result("NO_ENCONTRADO");

      if (header.estadoCodigo !== states.borrador) {
        return result("NO_ES_BORRADOR");
      }

      if (header.version !== input.version) {
        return result("CONFLICTO_VERSION");
      }

      if (input.profesionalId) {
        const existeProfesional = await manager
          .getRepository(ProfesionalFormularioEntity)
          .exists({
            where: { id: input.profesionalId },
          });

        if (!existeProfesional) {
          return result("PROFESIONAL_NO_ENCONTRADO");
        }
      }

      if (input.fechaAtencion || input.profesionalId) {
        await manager
          .getRepository(FormularioAreaEntity)
          .update(
            { id },
            {
              ...(input.fechaAtencion
                ? {
                    fechaAtencion: new Date(
                      input.fechaAtencion,
                    ),
                  }
                : {}),
              ...(input.profesionalId
                ? {
                    profesionalId: input.profesionalId,
                  }
                : {}),
              motivoCambio: input.motivo,
            },
          );
      }

      if (
        input.detalle &&
        Object.keys(input.detalle).length > 0
      ) {
        await manager.getRepository(FichaLegal).update(
          { formularioId: id },
          input.detalle,
        );
      }

      return result(
        "ACTUALIZADO",
        await this.get(id, manager),
      );
    });
  }

  async transition(
    id: string,
    version: number,
    reason: string,
    target: "CONFIRMADO" | "DESCARTADO",
    states: EstadosFormulario,
    prepare: PrepararAuditoriaFormulario,
  ) {
    return this.data.transaction(async (manager) => {
      await prepare(manager, reason);

      const state =
        target === "CONFIRMADO"
          ? states.confirmado
          : states.descartado;

      const existeEstado = await manager
        .getRepository(EstadoFormularioEntity)
        .exists({
          where: { codigo: state },
        });

      if (!existeEstado) {
        return result("CATALOGO_ESTADO_NO_CONFIGURADO");
      }

      const header = await manager
        .getRepository(FormularioAreaEntity)
        .findOne({
          where: { id, tipo: "LEGAL" },
          lock: { mode: "pessimistic_write" },
        });

      if (!header) return result("NO_ENCONTRADO");

      if (header.estadoCodigo !== states.borrador) {
        return result(
          target === "CONFIRMADO"
            ? "YA_CONFIRMADO"
            : "NO_ES_BORRADOR",
        );
      }

      if (header.version !== version) {
        return result("CONFLICTO_VERSION");
      }

      await manager
        .getRepository(FormularioAreaEntity)
        .update(
          { id },
          {
            estadoCodigo: state,
            motivoCambio: reason,
          },
        );

      return result(
        target,
        await this.get(id, manager),
      );
    });
  }
}
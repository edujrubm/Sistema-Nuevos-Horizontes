import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { ExpedienteEntity } from "../../../beneficiarias";
import { NinoEntity } from "../../../ninos";
import {
  EtniaGuarderia,
  EscolaridadGuarderia,
} from "../entities/catalogos-guarderia.entity";
import type {
  EstadosFormulario,
  FormularioAdapter,
  PrepararAuditoriaFormulario,
} from "../../shared/contracts/formulario-adapter";
import type { FormularioAreaRow } from "../../shared/contracts/formulario-area-row";
import { CrearFormularioDto } from "../../shared/dto/crear-formulario.dto";
import { ActualizarFormularioDto } from "../../shared/dto/actualizar-formulario.dto";
import { ListarFormulariosDto } from "../../shared/dto/listar-formularios.dto";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import {
  AreaFormularioEntity,
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../../shared/entities/tipo-formulario.entity";
import { FichaGuarderia } from "../entities/ficha-guarderia.entity";
import { validarDetalleGuarderia } from "../validation/validar-detalle-guarderia";

type FilaGuarderia = FormularioAreaEntity & {
  detalleGuarderia: FichaGuarderia;
  areaGuarderia: AreaFormularioEntity;
};
const resultado = (
  estado: string,
  formulario: FormularioAreaRow | null = null,
) => ({ estado, formulario });

/** Adaptador específico: el motor común conserva HTTP y Guarderia su persistencia. */
@Injectable()
export class GuarderiaFormRepository implements FormularioAdapter {
  constructor(private readonly data: DataSource) {}

  handles(id: string, manager = this.data.manager) {
    return manager
      .getRepository(FormularioAreaEntity)
      .exists({ where: { id, tipo: "GUARDERIA" } });
  }

  private consulta(manager: EntityManager) {
    return manager
      .getRepository(FormularioAreaEntity)
      .createQueryBuilder("formulario")
      .innerJoinAndMapOne(
        "formulario.detalleGuarderia",
        FichaGuarderia,
        "detalle",
        "detalle.formularioId = formulario.id",
      )
      .innerJoinAndMapOne(
        "formulario.areaGuarderia",
        AreaFormularioEntity,
        "area",
        "area.id = formulario.areaId",
      )
      .where("formulario.tipo = :tipo", { tipo: "GUARDERIA" });
  }

  private presentar(fila: FilaGuarderia): FormularioAreaRow {
    const { formularioId: _id, ...detalle } = fila.detalleGuarderia;
    return {
      id: fila.id,
      expedienteId: fila.expedienteId,
      ninoId: fila.ninoId,
      areaId: fila.areaId,
      area: fila.areaGuarderia.nombre,
      tipo: "GUARDERIA",
      estado: fila.estadoCodigo,
      fechaAtencion: fila.fechaAtencion,
      profesionalId: fila.profesionalId,
      capturadoPor: fila.capturadoPor,
      creadoEn: fila.creadoEn,
      actualizadoEn: fila.actualizadoEn,
      version: fila.version,
      detalle,
      examenMental: null,
    };
  }

  async get(id: string, manager = this.data.manager) {
    const fila = (await this.consulta(manager)
      .andWhere("formulario.id = :id", { id })
      .getOne()) as FilaGuarderia | null;
    return fila ? this.presentar(fila) : null;
  }

  /** Conserva el cursor ascendente y la fila adicional del motor compartido. */
  list(
    beneficiariaId: string,
    filtro: ListarFormulariosDto,
    descartado: string,
  ) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const expediente = await manager
        .getRepository(ExpedienteEntity)
        .findOne({ where: { beneficiariaId } });
      if (!expediente) return [];
      const consulta = this.consulta(manager)
        .andWhere("formulario.expedienteId = :expedienteId", {
          expedienteId: expediente.id,
        })
        .andWhere("formulario.estadoCodigo <> :descartado", { descartado });
      if (filtro.cursor)
        consulta.andWhere("formulario.id > :cursor", { cursor: filtro.cursor });
      if (filtro.areaId)
        consulta.andWhere("formulario.areaId = :areaId", {
          areaId: filtro.areaId,
        });
      const filas = (await consulta
        .orderBy("formulario.id", "ASC")
        .take(filtro.limite + 1)
        .getMany()) as FilaGuarderia[];
      return filas.map((fila) => this.presentar(fila));
    });
  }

  /** Cabecera, detalle y auditoría se confirman o revierten juntos. */
  create(
    beneficiariaId: string,
    entrada: CrearFormularioDto,
    estados: EstadosFormulario,
    preparar: PrepararAuditoriaFormulario,
  ) {
    const detalle = validarDetalleGuarderia(entrada.detalle);
    return this.data.transaction(async (manager) => {
      const actor = await preparar(manager, "Creación de formulario de área");
      if (!(await this.estadoExiste(manager, estados.borrador)))
        return resultado("CATALOGO_ESTADO_NO_CONFIGURADO");
      const tipo = await manager
        .getRepository(TipoFormularioEntity)
        .findOne({ where: { codigo: "GUARDERIA" } });
      if (!tipo) return resultado("TIPO_NO_ENCONTRADO");
      const expediente = await manager
        .getRepository(ExpedienteEntity)
        .findOne({ where: { beneficiariaId, activo: true } });
      if (!expediente) return resultado("SIN_EXPEDIENTE");
      if (!(await this.profesionalExiste(manager, entrada.profesionalId)))
        return resultado("PROFESIONAL_NO_ENCONTRADO");
      await this.validarCatalogos(manager, detalle);
      if (!entrada.ninoId) return resultado("NINO_NO_PERTENECE");
      const persona = await manager
        .getRepository(NinoEntity)
        .findOne({
          where: { id: entrada.ninoId, expedienteId: expediente.id },
        });
      if (!persona) return resultado("NINO_NO_PERTENECE");
      const cabecera = await manager.getRepository(FormularioAreaEntity).save({
        expedienteId: expediente.id,
        ninoId: persona.id,
        areaId: tipo.areaId,
        tipo: "GUARDERIA",
        estadoCodigo: estados.borrador,
        fechaAtencion: new Date(entrada.fechaAtencion),
        profesionalId: entrada.profesionalId,
        capturadoPor: actor.usuarioId,
        identidadAlAtender: {
          tipo: "NINO",
          id: persona.id,
          nombre: persona.nombre,
          cui: persona.cui,
          fechaNacimiento: persona.fechaNacimiento,
        },
      });
      await manager
        .getRepository(FichaGuarderia)
        .save({ ...detalle, formularioId: cabecera.id });
      return resultado("CREADO", await this.get(cabecera.id, manager));
    });
  }

  /** El bloqueo serializa las ediciones; la versión se revisa después de adquirirlo. */
  update(
    id: string,
    entrada: ActualizarFormularioDto,
    estados: EstadosFormulario,
    preparar: PrepararAuditoriaFormulario,
  ) {
    const detalle = validarDetalleGuarderia(entrada.detalle);
    return this.data.transaction(async (manager) => {
      await preparar(manager, entrada.motivo);
      const cabecera = await this.bloquear(manager, id);
      if (!cabecera) return resultado("NO_ENCONTRADO");
      if (cabecera.estadoCodigo !== estados.borrador)
        return resultado("NO_ES_BORRADOR");
      if (cabecera.version !== entrada.version)
        return resultado("CONFLICTO_VERSION");
      if (
        entrada.profesionalId &&
        !(await this.profesionalExiste(manager, entrada.profesionalId))
      )
        return resultado("PROFESIONAL_NO_ENCONTRADO");
      await this.validarCatalogos(manager, detalle);
      if (entrada.fechaAtencion || entrada.profesionalId) {
        await manager.getRepository(FormularioAreaEntity).update(
          { id },
          {
            ...(entrada.fechaAtencion
              ? { fechaAtencion: new Date(entrada.fechaAtencion) }
              : {}),
            ...(entrada.profesionalId
              ? { profesionalId: entrada.profesionalId }
              : {}),
            motivoCambio: entrada.motivo,
          },
        );
      }
      if (Object.keys(detalle).length) {
        await manager
          .getRepository(FichaGuarderia)
          .update({ formularioId: id }, detalle);
      }
      // Los triggers versionan la cabecera; no incrementar version manualmente.
      return resultado("ACTUALIZADO", await this.get(id, manager));
    });
  }

  transition(
    id: string,
    version: number,
    motivo: string,
    destino: "CONFIRMADO" | "DESCARTADO",
    estados: EstadosFormulario,
    preparar: PrepararAuditoriaFormulario,
  ) {
    return this.data.transaction(async (manager) => {
      await preparar(manager, motivo);
      const estado =
        destino === "CONFIRMADO" ? estados.confirmado : estados.descartado;
      if (!(await this.estadoExiste(manager, estado)))
        return resultado("CATALOGO_ESTADO_NO_CONFIGURADO");
      const cabecera = await this.bloquear(manager, id);
      if (!cabecera) return resultado("NO_ENCONTRADO");
      if (cabecera.estadoCodigo !== estados.borrador)
        return resultado(
          destino === "CONFIRMADO" ? "YA_CONFIRMADO" : "NO_ES_BORRADOR",
        );
      if (cabecera.version !== version) return resultado("CONFLICTO_VERSION");
      const detalle = await manager
        .getRepository(FichaGuarderia)
        .findOneBy({ formularioId: id });
      if (!detalle) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      const { formularioId: _id, ...campos } = detalle;
      // Comprueba formato del contenido persistido, sin imponer obligatoriedad pendiente.
      validarDetalleGuarderia(campos);
      await manager
        .getRepository(FormularioAreaEntity)
        .update({ id }, { estadoCodigo: estado, motivoCambio: motivo });
      return resultado(destino, await this.get(id, manager));
    });
  }

  private bloquear(manager: EntityManager, id: string) {
    return manager
      .getRepository(FormularioAreaEntity)
      .findOne({
        where: { id, tipo: "GUARDERIA" },
        lock: { mode: "pessimistic_write" },
      });
  }

  private estadoExiste(manager: EntityManager, codigo: string) {
    return manager
      .getRepository(EstadoFormularioEntity)
      .exists({ where: { codigo } });
  }

  private profesionalExiste(manager: EntityManager, id: string) {
    return manager
      .getRepository(ProfesionalFormularioEntity)
      .exists({ where: { id } });
  }

  private async validarCatalogos(
    manager: EntityManager,
    detalle: Record<string, unknown>,
  ) {
    for (const [campo, entidad] of [
      ["etniaId", EtniaGuarderia],
      ["escolaridadId", EscolaridadGuarderia],
    ] as const) {
      const id = detalle[campo];
      if (
        typeof id === "string" &&
        !(await manager.getRepository(entidad).exists({ where: { id } }))
      )
        throw new ErrorApi("DATOS_INVALIDOS", [
          {
            campo: `detalle.${campo}`,
            mensaje: "La opción seleccionada no existe en el catálogo.",
          },
        ]);
    }
  }
}

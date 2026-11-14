import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { BeneficiariaEntity, ExpedienteEntity } from "../../../beneficiarias";
import type {
  EstadosFormulario, FormularioAdapter, PrepararAuditoriaFormulario,
} from "../../shared/contracts/formulario-adapter";
import type { FormularioAreaRow } from "../../shared/contracts/formulario-area-row";
import { CrearFormularioDto } from "../../shared/dto/crear-formulario.dto";
import { ActualizarFormularioDto } from "../../shared/dto/actualizar-formulario.dto";
import { ListarFormulariosDto } from "../../shared/dto/listar-formularios.dto";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { AreaFormularioEntity, EstadoFormularioEntity, ProfesionalFormularioEntity } from "../../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../../shared/entities/tipo-formulario.entity";
import { FichaSocial } from "../entities/ficha-social.entity";
import { validarDetalleSocial } from "../validation/validar-detalle-social";

type FilaSocial = FormularioAreaEntity & { detalleSocial: FichaSocial; areaSocial: AreaFormularioEntity };
const resultado = (estado: string, formulario: FormularioAreaRow | null = null) => ({ estado, formulario });

/** Adaptador específico: el motor común conserva HTTP y Social su persistencia. */
@Injectable()
export class SocialFormRepository implements FormularioAdapter {
  constructor(private readonly data: DataSource) {}

  handles(id: string, manager = this.data.manager) {
    return manager.getRepository(FormularioAreaEntity).exists({ where: { id, tipo: "SOCIAL" } });
  }

  private consulta(manager: EntityManager) {
    return manager.getRepository(FormularioAreaEntity).createQueryBuilder("formulario")
      .innerJoinAndMapOne("formulario.detalleSocial", FichaSocial, "detalle", "detalle.formularioId = formulario.id")
      .innerJoinAndMapOne("formulario.areaSocial", AreaFormularioEntity, "area", "area.id = formulario.areaId")
      .where("formulario.tipo = :tipo", { tipo: "SOCIAL" });
  }

  private presentar(fila: FilaSocial): FormularioAreaRow {
    const { formularioId: _id, ...detalle } = fila.detalleSocial;
    return {
      id: fila.id, expedienteId: fila.expedienteId, ninoId: fila.ninoId,
      areaId: fila.areaId, area: fila.areaSocial.nombre, tipo: "SOCIAL",
      estado: fila.estadoCodigo, fechaAtencion: fila.fechaAtencion,
      profesionalId: fila.profesionalId, capturadoPor: fila.capturadoPor,
      creadoEn: fila.creadoEn, actualizadoEn: fila.actualizadoEn,
      version: fila.version, detalle, examenMental: null,
    };
  }

  async get(id: string, manager = this.data.manager) {
    const fila = await this.consulta(manager).andWhere("formulario.id = :id", { id }).getOne() as FilaSocial | null;
    return fila ? this.presentar(fila) : null;
  }

  /** Conserva el cursor ascendente y la fila adicional del motor compartido. */
  list(beneficiariaId: string, filtro: ListarFormulariosDto, descartado: string) {
    return this.data.transaction("REPEATABLE READ", async manager => {
      const expediente = await manager.getRepository(ExpedienteEntity).findOne({ where: { beneficiariaId } });
      if (!expediente) return [];
      const consulta = this.consulta(manager)
        .andWhere("formulario.expedienteId = :expedienteId", { expedienteId: expediente.id })
        .andWhere("formulario.estadoCodigo <> :descartado", { descartado });
      if (filtro.cursor) consulta.andWhere("formulario.id > :cursor", { cursor: filtro.cursor });
      if (filtro.areaId) consulta.andWhere("formulario.areaId = :areaId", { areaId: filtro.areaId });
      const filas = await consulta.orderBy("formulario.id", "ASC").take(filtro.limite + 1).getMany() as FilaSocial[];
      return filas.map(fila => this.presentar(fila));
    });
  }

  /** Cabecera, detalle y auditoría se confirman o revierten juntos. */
  create(beneficiariaId: string, entrada: CrearFormularioDto, estados: EstadosFormulario, preparar: PrepararAuditoriaFormulario) {
    const detalle = validarDetalleSocial(entrada.detalle);
    return this.data.transaction(async manager => {
      const actor = await preparar(manager, "Creación de formulario de área");
      if (!await this.estadoExiste(manager, estados.borrador)) return resultado("CATALOGO_ESTADO_NO_CONFIGURADO");
      const tipo = await manager.getRepository(TipoFormularioEntity).findOne({ where: { codigo: "SOCIAL" } });
      if (!tipo) return resultado("TIPO_NO_ENCONTRADO");
      const expediente = await manager.getRepository(ExpedienteEntity).findOne({ where: { beneficiariaId, activo: true } });
      if (!expediente) return resultado("SIN_EXPEDIENTE");
      if (!await this.profesionalExiste(manager, entrada.profesionalId)) return resultado("PROFESIONAL_NO_ENCONTRADO");
      await this.validarCoordinacion(manager, detalle);
      const persona = await manager.getRepository(BeneficiariaEntity).findOneOrFail({ where: { id: beneficiariaId } });
      const cabecera = await manager.getRepository(FormularioAreaEntity).save({
        expedienteId: expediente.id, areaId: tipo.areaId, tipo: "SOCIAL",
        estadoCodigo: estados.borrador, fechaAtencion: new Date(entrada.fechaAtencion),
        profesionalId: entrada.profesionalId, capturadoPor: actor.usuarioId,
        identidadAlAtender: {
          tipo: "BENEFICIARIA", id: beneficiariaId, nombre: persona.nombre,
          cui: persona.cui, fechaNacimiento: persona.fechaNacimiento,
        },
      });
      await manager.getRepository(FichaSocial).save({ ...detalle, formularioId: cabecera.id });
      return resultado("CREADO", await this.get(cabecera.id, manager));
    });
  }

  /** El bloqueo serializa las ediciones; la versión se revisa después de adquirirlo. */
  update(id: string, entrada: ActualizarFormularioDto, estados: EstadosFormulario, preparar: PrepararAuditoriaFormulario) {
    const detalle = validarDetalleSocial(entrada.detalle);
    return this.data.transaction(async manager => {
      await preparar(manager, entrada.motivo);
      const cabecera = await this.bloquear(manager, id);
      if (!cabecera) return resultado("NO_ENCONTRADO");
      if (cabecera.estadoCodigo !== estados.borrador) return resultado("NO_ES_BORRADOR");
      if (cabecera.version !== entrada.version) return resultado("CONFLICTO_VERSION");
      if (entrada.profesionalId && !await this.profesionalExiste(manager, entrada.profesionalId)) return resultado("PROFESIONAL_NO_ENCONTRADO");
      await this.validarCoordinacion(manager, detalle);
      if (entrada.fechaAtencion || entrada.profesionalId) {
        await manager.getRepository(FormularioAreaEntity).update({ id }, {
          ...(entrada.fechaAtencion ? { fechaAtencion: new Date(entrada.fechaAtencion) } : {}),
          ...(entrada.profesionalId ? { profesionalId: entrada.profesionalId } : {}),
          motivoCambio: entrada.motivo,
        });
      }
      if (Object.keys(detalle).length) {
        await manager.getRepository(FichaSocial).update({ formularioId: id }, detalle);
      }
      // Los triggers versionan la cabecera; no incrementar version manualmente.
      return resultado("ACTUALIZADO", await this.get(id, manager));
    });
  }

  transition(id: string, version: number, motivo: string, destino: "CONFIRMADO" | "DESCARTADO", estados: EstadosFormulario, preparar: PrepararAuditoriaFormulario) {
    return this.data.transaction(async manager => {
      await preparar(manager, motivo);
      const estado = destino === "CONFIRMADO" ? estados.confirmado : estados.descartado;
      if (!await this.estadoExiste(manager, estado)) return resultado("CATALOGO_ESTADO_NO_CONFIGURADO");
      const cabecera = await this.bloquear(manager, id);
      if (!cabecera) return resultado("NO_ENCONTRADO");
      if (cabecera.estadoCodigo !== estados.borrador)
        return resultado(destino === "CONFIRMADO" ? "YA_CONFIRMADO" : "NO_ES_BORRADOR");
      if (cabecera.version !== version) return resultado("CONFLICTO_VERSION");
      const detalle = await manager.getRepository(FichaSocial).findOneBy({ formularioId: id });
      if (!detalle) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      const { formularioId: _id, ...campos } = detalle;
      // Comprueba formato del contenido persistido, sin imponer obligatoriedad pendiente.
      validarDetalleSocial(campos);
      await manager.getRepository(FormularioAreaEntity).update({ id }, { estadoCodigo: estado, motivoCambio: motivo });
      return resultado(destino, await this.get(id, manager));
    });
  }

  private bloquear(manager: EntityManager, id: string) {
    return manager.getRepository(FormularioAreaEntity).findOne({ where: { id, tipo: "SOCIAL" }, lock: { mode: "pessimistic_write" } });
  }

  private estadoExiste(manager: EntityManager, codigo: string) {
    return manager.getRepository(EstadoFormularioEntity).exists({ where: { codigo } });
  }

  private profesionalExiste(manager: EntityManager, id: string) {
    return manager.getRepository(ProfesionalFormularioEntity).exists({ where: { id } });
  }

  private async validarCoordinacion(manager: EntityManager, detalle: Record<string, unknown>) {
    const id = detalle.areaCoordinacionId;
    if (typeof id === "string" && !await manager.getRepository(AreaFormularioEntity).exists({ where: { id } }))
      throw new ErrorApi("DATOS_INVALIDOS", [{ campo: "detalle.areaCoordinacionId", mensaje: "El área de coordinación seleccionada no existe." }]);
  }
}

import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { auditedTransaction } from "../../../../common/database/audited-transaction";
import { ListaDto } from "../../../../common/dto/pagina.dto";
import { ExpedienteEntity } from "../../../beneficiarias";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { AreaFormularioEntity } from "../../shared/entities/formulario-catalogos.entity";
import { GuarderiaResponsable } from "../entities/guarderia-responsable.entity";
import { GuardarResponsableGuarderiaDto } from "../dto/responsable-guarderia.dto";

@Injectable()
export class GuarderiaResponsablesRepository {
  constructor(private readonly data: DataSource) {}
  /** Resuelve área y caso en servidor. La sesión definitiva sigue pendiente. */
  private async ficha(
    manager: EntityManager,
    beneficiariaId: string,
    id: string,
    bloquear = false,
  ) {
    const expediente = await manager
      .getRepository(ExpedienteEntity)
      .findOne({
        where: { beneficiariaId },
        ...(bloquear ? { lock: { mode: "pessimistic_read" as const } } : {}),
      });
    if (!expediente) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const ficha = await manager.getRepository(FormularioAreaEntity).findOne({
      where: { id, expedienteId: expediente.id, tipo: "GUARDERIA" },
      ...(bloquear ? { lock: { mode: "pessimistic_write" as const } } : {}),
    });
    if (!ficha?.ninoId) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const area = await manager
      .getRepository(AreaFormularioEntity)
      .findOneBy({ id: ficha.areaId });
    if (area?.nombre !== process.env.AREA_TEST_NOMBRE)
      throw new ErrorApi("AREA_NO_AUTORIZADA");
    return { ficha, expediente };
  }
  listar(beneficiariaId: string, id: string, filtro: ListaDto) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const { ficha } = await this.ficha(manager, beneficiariaId, id);
      const [datos, total] = await manager
        .getRepository(GuarderiaResponsable)
        .findAndCount({
          where: { formularioId: id },
          order: { id: "ASC" },
          skip: (filtro.pagina - 1) * filtro.limite,
          take: filtro.limite,
        });
      return {
        datos,
        total,
        pagina: filtro.pagina,
        limite: filtro.limite,
        version: ficha.version,
      };
    });
  }
  /** El bloqueo y la versión impiden sobrescribir otra captura de la ficha. */
  guardar(
    beneficiariaId: string,
    id: string,
    input: GuardarResponsableGuarderiaDto,
    responsableId?: string,
  ) {
    return auditedTransaction(this.data, input.motivo, async (manager) => {
      const { ficha, expediente } = await this.ficha(
        manager,
        beneficiariaId,
        id,
        true,
      );
      const borrador = process.env.FORM_DRAFT_STATE_CODE;
      if (!borrador) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      if (!expediente.activo || ficha.estadoCodigo !== borrador)
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (ficha.version !== input.version)
        throw new ErrorApi("VERSION_DESACTUALIZADA");
      const repo = manager.getRepository(GuarderiaResponsable);
      const anterior = responsableId
        ? await repo.findOneBy({ id: responsableId, formularioId: id })
        : null;
      if (responsableId && !anterior)
        throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const campos = {
        nombre: input.nombre,
        cui: input.cui,
        relacion: input.relacion,
        telefono: input.telefono,
      };
      if (
        anterior &&
        Object.entries(campos).every(
          ([key, value]) => anterior[key as keyof typeof campos] === value,
        )
      )
        throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
      const responsable = await repo.save(
        repo.create({
          ...anterior,
          ...campos,
          formularioId: id,
          actualizadoEn: new Date(),
        }),
      );
      // El trigger existente versiona la cabecera y audita en esta misma transacción.
      const actual = await manager
        .getRepository(FormularioAreaEntity)
        .findOneByOrFail({ id });
      return {
        responsable: await repo.findOneByOrFail({
          id: responsable.id,
          formularioId: id,
        }),
        version: actual.version,
      };
    });
  }
}

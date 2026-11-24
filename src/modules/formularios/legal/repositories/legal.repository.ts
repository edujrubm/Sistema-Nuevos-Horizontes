import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { auditedTransaction } from "../../../../common/database/audited-transaction";
import { BeneficiariaEntity, ExpedienteEntity } from "../../../beneficiarias";
import { TipoFormularioEntity } from "../../shared/entities/tipo-formulario.entity";
import { ErrorApi } from "../../../../common/errors/error-api";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { FichaLegal } from "../entities/ficha-legal.entity";
import { ReferenciaLegal } from "../entities/referencia-legal.entity";
import type { CrearReferenciaDto } from "../dto/referencia-legal.dto";
import {
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../../shared/entities/formulario-catalogos.entity";

export type LegalFormType = "LEGAL" | "REFERENCIA_LEGAL";
export type CambioReferencia =
  | {
      tipo: "EDITAR";
      detalle: Partial<Omit<ReferenciaLegal, "formularioId">>;
    }
  | {
      tipo: "CONFIRMAR";
      estadoCodigo: string;
    };

@Injectable()
export class LegalRepository {
  constructor(private readonly data: DataSource) {}

  /** Mantiene actor, motivo, bloqueo y respuesta dentro de la misma conexión. */
  /** Valida sobre el registro bloqueado y escribe con la misma auditoría. */
async changeReference(
  id: string,
  reason: string,
  decidirCambio: (
    header: Readonly<FormularioAreaEntity>,
    detail: Readonly<ReferenciaLegal>,
  ) => CambioReferencia,
) {
  return auditedTransaction(this.data, reason, async (manager) => {
    const header = await manager
      .getRepository(FormularioAreaEntity)
      .findOne({
        where: { id, tipo: "REFERENCIA_LEGAL" },
        lock: { mode: "pessimistic_write" },
      });

    if (!header) {
      throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }

    const detail = await manager
      .getRepository(ReferenciaLegal)
      .findOne({
        where: { formularioId: id },
      });

    if (!detail) {
      throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }

    const cambio = decidirCambio(header, detail);

    if (cambio.tipo === "EDITAR") {
      await manager
        .getRepository(ReferenciaLegal)
        .update(
          { formularioId: id },
          cambio.detalle,
        );
    } else {
      await manager
        .getRepository(FormularioAreaEntity)
        .update(
          { id },
          {
            estadoCodigo: cambio.estadoCodigo,
            motivoCambio: reason,
          },
        );
    }

    return this.readReference(manager, id);
  });
}

  /** Cabecera y detalle se crean atómicamente; la edad mantiene el cálculo PostgreSQL histórico. */
 async createReference(
  beneficiaryId: string,
  input: CrearReferenciaDto,
  draftState: string,
) {
    return auditedTransaction(
      this.data,
      "Creación de referencia Legal",
      async (manager, actor) => {
        const record = await manager
          .getRepository(ExpedienteEntity)
          .findOne({ where: { beneficiariaId: beneficiaryId } });
        if (!record) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
        const type = await manager
          .getRepository(TipoFormularioEntity)
          .findOne({ where: { codigo: "REFERENCIA_LEGAL" } });
        if (!type) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
        const existeEstado = await manager
          .getRepository(EstadoFormularioEntity)
          .exists({
             where: { codigo: draftState },
           });

        if (!existeEstado) {
            throw new ErrorApi("CONFIGURACION_INCOMPLETA");
        }

        const existeProfesional = await manager
          .getRepository(ProfesionalFormularioEntity)
          .exists({
             where: { id: input.profesionalId },
         });

        if (!existeProfesional) {
          throw new ErrorApi("DATOS_INVALIDOS", [
        {
            campo: "profesionalId",
            mensaje: "El profesional seleccionado no existe.",
        },
  ]);
}
        // PostgreSQL define la edad civil a la fecha de atención en Guatemala.
        const identity = await manager
          .getRepository(BeneficiariaEntity)
          .createQueryBuilder("beneficiary")
          .select("beneficiary.nombre", "nombre")
          .addSelect("beneficiary.cui", "cui")
          .addSelect("beneficiary.fechaNacimiento", "fecha_nac")
          .addSelect(
            "CAST(extract(year FROM age(CAST(CAST(:attentionDate AS timestamptz) AT TIME ZONE 'America/Guatemala' AS date), beneficiary.fechaNacimiento)) AS integer)",
            "edad_a_la_atencion",
          )
          .where("beneficiary.id = :id", {
            id: beneficiaryId,
            attentionDate: input.fechaAtencion,
          })
          .getRawOne();
        const header = await manager.getRepository(FormularioAreaEntity).save({
          expedienteId: record.id,
          areaId: type.areaId,
          tipo: "REFERENCIA_LEGAL",
          estadoCodigo: draftState,
          fechaAtencion: new Date(input.fechaAtencion),
          profesionalId: input.profesionalId,
          capturadoPor: actor,
          identidadAlAtender: identity,
        });
        // Persiste únicamente los campos propios de la referencia.
        await manager.getRepository(ReferenciaLegal).save({
          formularioId: header.id,
          destino: input.detalle.destino ?? null,
          origen: input.detalle.origen ?? null,
          motivoReferencia: input.detalle.motivoReferencia ?? null,
          recomendaciones: input.detalle.recomendaciones ?? null,
          medioEntrega: input.detalle.medioEntrega ?? null,
        });

        return this.readReference(manager, header.id);
      },
    );
  }


  private async readReference(manager: EntityManager, id: string) {
    const header = await manager
      .getRepository(FormularioAreaEntity)
      .findOne({ where: { id, tipo: "REFERENCIA_LEGAL" } });
    if (!header) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const detail = await manager
      .getRepository(ReferenciaLegal)
      .findOne({ where: { formularioId: id } });
    const record = await manager
      .getRepository(ExpedienteEntity)
      .findOne({ where: { id: header.expedienteId } });
    if (!detail || !record) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const { formularioId: _id, ...detalle } = detail;
    return { ...header, beneficiariaId: record.beneficiariaId, detalle };
  }

  /** La consulta individual excluye cualquier otro tipo de ficha. */
  async reference(id: string) {
    return this.data.transaction("REPEATABLE READ", (manager) =>
      this.readReference(manager, id),
    );
  }

  /** Lista y conteo comparten instantánea; una página vacía conserva el total. */
  async list(
    beneficiaryId: string,
    type: LegalFormType,
    page: number,
    limit: number,
  ) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const record = await manager.getRepository(ExpedienteEntity).findOne({
        where: { beneficiariaId: beneficiaryId },
      });
      if (!record) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");

      // El tipo cerrado determina el detalle; nunca se recibe una tabla por HTTP.
      const detailEntity = type === "LEGAL" ? FichaLegal : ReferenciaLegal;
      const forms = manager
        .getRepository(FormularioAreaEntity)
        .createQueryBuilder("form")
        .innerJoinAndMapOne(
          "form.detalle",
          detailEntity,
          "detail",
          "detail.formularioId = form.id",
        )
        .where("form.expedienteId = :expedienteId", { expedienteId: record.id })
        .andWhere("form.tipo = :type", { type })
        .andWhere("form.estadoCodigo <> :discarded", {
          discarded: process.env.FORM_DISCARDED_STATE_CODE || "DESCARTADO",
        })
        .orderBy("form.fechaAtencion", "DESC")
        .addOrderBy("form.id", "DESC")
        .skip((page - 1) * limit)
        .take(limit);
      const [rows, total] = await forms.getManyAndCount();
      return {
        datos: rows.map((row) => {
          const { detalle, ...header } = row as FormularioAreaEntity & {
            detalle: FichaLegal | ReferenciaLegal;
          };
          const { formularioId: _id, ...detail } = detalle;
          return { ...header, detalle: detail };
        }),
        pagina: page,
        limite: limit,
        total,
      };
    });
  }
}

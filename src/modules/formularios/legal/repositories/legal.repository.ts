import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { ExpedienteEntity } from "../../../beneficiarias/entities/expediente.entity";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { FichaLegal } from "../entities/ficha-legal.entity";
import { ReferenciaLegal } from "../entities/referencia-legal.entity";

export type LegalFormType = "LEGAL" | "REFERENCIA_LEGAL";

@Injectable()
export class LegalRepository {
  constructor(private readonly data: DataSource) {}

  /** La consulta individual excluye cualquier otro tipo de ficha. */
  async reference(id: string) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const header = await manager.getRepository(FormularioAreaEntity).findOne({
        where: { id, tipo: "REFERENCIA_LEGAL" },
      });
      if (!header) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const detail = await manager.getRepository(ReferenciaLegal).findOne({
        where: { formularioId: id },
      });
      const record = await manager.getRepository(ExpedienteEntity).findOne({
        where: { id: header.expedienteId },
      });
      if (!detail || !record) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const { formularioId: _id, ...detalle } = detail;
      return { ...header, beneficiariaId: record.beneficiariaId, detalle };
    });
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

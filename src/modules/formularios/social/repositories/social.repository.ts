import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { ExpedienteEntity } from "../../../beneficiarias";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { FichaSocial } from "../entities/ficha-social.entity";

@Injectable()
export class SocialRepository {
  constructor(private readonly data: DataSource) {}

  /** Lista y total comparten instantánea; una página vacía conserva el total. */
  async listar(beneficiariaId: string, pagina: number, limite: number) {
    return this.data.transaction("REPEATABLE READ", async manager => {
      const expediente = await manager.getRepository(ExpedienteEntity).findOne({
        where: { beneficiariaId },
      });
      if (!expediente) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");

      // Conserva todos los estados del listado histórico, sin decidir nuevas reglas.
      const [filas, total] = await manager.getRepository(FormularioAreaEntity)
        .createQueryBuilder("formulario")
        .innerJoinAndMapOne(
          "formulario.detalle", FichaSocial, "detalle",
          "detalle.formularioId = formulario.id",
        )
        .where("formulario.expedienteId = :expedienteId", { expedienteId: expediente.id })
        .andWhere("formulario.tipo = :tipo", { tipo: "SOCIAL" })
        .orderBy("formulario.fechaAtencion", "DESC")
        .addOrderBy("formulario.id", "DESC")
        .skip((pagina - 1) * limite)
        .take(limite)
        .getManyAndCount();

      return {
        datos: filas.map(fila => {
          const { detalle, ...cabecera } = fila as FormularioAreaEntity & { detalle: FichaSocial };
          const { formularioId: _id, ...campos } = detalle;
          return { ...cabecera, detalle: campos };
        }),
        pagina, limite, total,
      };
    });
  }
}

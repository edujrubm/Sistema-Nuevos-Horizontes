import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { ListaDto } from "../../../../common/dto/pagina.dto";
import { ExpedienteEntity } from "../../../beneficiarias";
import { NinoEntity } from "../../../ninos";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { FichaGuarderia } from "../entities/ficha-guarderia.entity";

/** Página y total leen la misma instantánea; no se modifican datos del expediente. */
@Injectable()
export class GuarderiaRepository {
  constructor(private readonly data: DataSource) {}

  async listarHijos(
    beneficiariaId: string,
    filtro: ListaDto,
    confirmado: string,
  ) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const expediente = await manager.getRepository(ExpedienteEntity).findOne({
        where: { beneficiariaId },
        select: { id: true },
      });
      if (!expediente) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const [ninos, total] = await manager
        .getRepository(NinoEntity)
        .findAndCount({
          where: { expedienteId: expediente.id },
          select: {
            id: true,
            nombre: true,
            fechaNacimiento: true,
            expedienteId: true,
          },
          order: { id: "ASC" },
          skip: (filtro.pagina - 1) * filtro.limite,
          take: filtro.limite,
        });
      const inscripciones = ninos.length
        ? await manager
            .getRepository(FormularioAreaEntity)
            .createQueryBuilder("formulario")
            .innerJoin(
              FichaGuarderia,
              "detalle",
              "detalle.formularioId = formulario.id",
            )
            .select("formulario.ninoId", "ninoId")
            .where("formulario.expedienteId = :expedienteId", {
              expedienteId: expediente.id,
            })
            .andWhere("formulario.ninoId IN (:...ids)", {
              ids: ninos.map((n) => n.id),
            })
            .andWhere("formulario.tipo = :tipo", { tipo: "GUARDERIA" })
            .andWhere("formulario.estadoCodigo = :confirmado", { confirmado })
            .distinct(true)
            .getRawMany<{ ninoId: string }>()
        : [];
      const inscritos = new Set(inscripciones.map((f) => f.ninoId));
      return {
        datos: ninos.map((n) => ({
          ninoId: n.id,
          nombre: n.nombre,
          fechaNac: n.fechaNacimiento,
          expedienteId: n.expedienteId,
          inscrito: inscritos.has(n.id),
        })),
        pagina: filtro.pagina,
        limite: filtro.limite,
        total,
      };
    });
  }

  async listarFichas(ninoId: string, filtro: ListaDto, confirmado: string) {
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const nino = await manager.getRepository(NinoEntity).findOne({
        where: { id: ninoId },
        select: { id: true, expedienteId: true },
      });
      if (!nino) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const consulta = manager
        .getRepository(FormularioAreaEntity)
        .createQueryBuilder("formulario")
        .innerJoinAndMapOne(
          "formulario.detalle",
          FichaGuarderia,
          "detalle",
          "detalle.formularioId = formulario.id",
        )
        .where("formulario.expedienteId = :expedienteId", {
          expedienteId: nino.expedienteId,
        })
        .andWhere("formulario.ninoId = :ninoId", { ninoId })
        .andWhere("formulario.tipo = :tipo", { tipo: "GUARDERIA" });
      // La inscripción confirmada habilita consulta, conservando todos sus estados históricos.
      if (
        !(await consulta
          .clone()
          .andWhere("formulario.estadoCodigo = :confirmado", { confirmado })
          .getExists())
      )
        throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      const [filas, total] = await consulta
        .orderBy("formulario.fechaAtencion", "DESC")
        .addOrderBy("formulario.id", "DESC")
        .skip((filtro.pagina - 1) * filtro.limite)
        .take(filtro.limite)
        .getManyAndCount();
      return {
        datos: filas.map((fila) => {
          const { detalle, ...cabecera } = fila as FormularioAreaEntity & {
            detalle: FichaGuarderia;
          };
          const { formularioId: _id, ...campos } = detalle;
          return { ...cabecera, detalle: campos };
        }),
        pagina: filtro.pagina,
        limite: filtro.limite,
        total,
      };
    });
  }
}

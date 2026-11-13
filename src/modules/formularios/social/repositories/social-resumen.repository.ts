import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { BeneficiariaEntity, ExpedienteEntity } from "../../../beneficiarias";
import { EvolucionLecturaService } from "../../../evolucion/lectura";
import { FormularioAreaEntity } from "../../shared/entities/formulario-area.entity";
import { ProfesionalFormularioEntity } from "../../shared/entities/formulario-catalogos.entity";
import { FichaSocial } from "../entities/ficha-social.entity";
import type { ResumenSocialDto } from "../dto/resumen-social.dto";

@Injectable()
export class SocialResumenRepository {
  constructor(private readonly data: DataSource, private readonly evolucion: EvolucionLecturaService) {}

  /** Cabecera, métricas, identidad e historial se leen desde una única instantánea. */
  consultar(beneficiariaId: string): Promise<ResumenSocialDto> {
    return this.data.transaction("REPEATABLE READ", async manager => {
      const expediente = await manager.getRepository(ExpedienteEntity).findOne({ where: { beneficiariaId } });
      if (!expediente) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");

      // Mantiene máscara y edad civil de PostgreSQL; nunca devuelve el CUI completo.
      const beneficiaria = await manager.getRepository(BeneficiariaEntity)
        .createQueryBuilder("persona")
        .select("persona.id", "id")
        .addSelect("persona.nombre", "nombre")
        .addSelect("persona.fechaNacimiento", "fechaNac")
        .addSelect("CASE WHEN persona.cui IS NULL THEN NULL ELSE '***' || right(persona.cui,4) END", "cuiProtegido")
        .addSelect("CAST(extract(year FROM age((now() AT TIME ZONE 'America/Guatemala')::date, persona.fechaNacimiento)) AS integer)", "edadCalculada")
        .where("persona.id = :beneficiariaId", { beneficiariaId })
        .getRawOne<ResumenSocialDto["beneficiaria"]>();
      if (!beneficiaria) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");

      const metricas = await manager.getRepository(FormularioAreaEntity)
        .createQueryBuilder("formulario")
        .select("COUNT(*)", "totalFichas")
        .addSelect("MAX(formulario.fechaAtencion)", "ultimaAtencion")
        .where("formulario.expedienteId = :expedienteId", { expedienteId: expediente.id })
        .andWhere("formulario.tipo = :tipo", { tipo: "SOCIAL" })
        .getRawOne<{ totalFichas: string; ultimaAtencion: Date | null }>();

      const ultima = await manager.getRepository(FormularioAreaEntity)
        .createQueryBuilder("formulario")
        .select([
          "formulario.id", "formulario.estadoCodigo", "formulario.fechaAtencion",
          "formulario.actualizadoEn", "formulario.version", "formulario.profesionalId",
        ])
        .innerJoinAndMapOne("formulario.detalle", FichaSocial, "detalle", "detalle.formularioId = formulario.id")
        .innerJoinAndMapOne("formulario.profesional", ProfesionalFormularioEntity, "profesional", "profesional.id = formulario.profesionalId")
        .where("formulario.expedienteId = :expedienteId", { expedienteId: expediente.id })
        .andWhere("formulario.tipo = :tipo", { tipo: "SOCIAL" })
        .orderBy("formulario.fechaAtencion", "DESC")
        .addOrderBy("formulario.id", "DESC")
        .take(1)
        .getOne() as (FormularioAreaEntity & { detalle: FichaSocial; profesional: ProfesionalFormularioEntity }) | null;

      let ultimaFicha: ResumenSocialDto["ultimaFicha"] = null;
      if (ultima) {
        const { formularioId: _id, ...detalle } = ultima.detalle;
        ultimaFicha = {
          id: ultima.id, estadoCodigo: ultima.estadoCodigo,
          fechaAtencion: ultima.fechaAtencion, actualizadoEn: ultima.actualizadoEn,
          version: ultima.version, profesionalId: ultima.profesionalId,
          profesionalNombre: ultima.profesional.nombre, ...detalle, detalle,
        };
      }
      const historialReciente = await this.evolucion.recientesSocial(manager, expediente.id);
      return {
        beneficiariaId, expedienteId: expediente.id,
        totalFichas: Number(metricas?.totalFichas ?? 0),
        ultimaAtencion: metricas?.ultimaAtencion ?? null,
        beneficiaria, ultimaFicha, historialReciente,
        // Riesgos es texto en el esquema aprobado: cero sería un indicador inventado.
        camposSinSoporte: ["totalRiesgos"], totalRiesgos: null,
      };
    });
  }
}

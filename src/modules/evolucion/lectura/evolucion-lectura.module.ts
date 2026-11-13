import { Injectable, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { FormularioAreaEntity } from "../../formularios/shared/entities/formulario-area.entity";
import { ProfesionalFormularioEntity } from "../../formularios/shared/entities/formulario-catalogos.entity";
import { EntradaEvolutivaLectura } from "./entrada-evolutiva-lectura.entity";

export interface EntradaReciente {
  id: string;
  accion: string;
  contenido: string;
  fechaAtencion: Date;
  planSeguimiento: string | null;
  resultado: string | null;
  profesionalId: string;
  profesionalNombre: string;
}

@Injectable()
export class EvolucionLecturaService {
  /** Consulta acotada del resumen Social usando la instantánea de su llamador. */
  recientesSocial(manager: EntityManager, expedienteId: string): Promise<EntradaReciente[]> {
    return manager.getRepository(EntradaEvolutivaLectura)
      .createQueryBuilder("entrada")
      .innerJoin(FormularioAreaEntity, "formulario", "formulario.id = entrada.formularioId")
      .innerJoin(ProfesionalFormularioEntity, "profesional", "profesional.id = entrada.profesionalId")
      .select("entrada.id", "id")
      .addSelect("entrada.accion", "accion")
      .addSelect("entrada.contenido", "contenido")
      .addSelect("entrada.fechaAtencion", "fechaAtencion")
      .addSelect("entrada.planSeguimiento", "planSeguimiento")
      .addSelect("entrada.resultado", "resultado")
      .addSelect("entrada.profesionalId", "profesionalId")
      .addSelect("profesional.nombre", "profesionalNombre")
      .where("formulario.expedienteId = :expedienteId", { expedienteId })
      .andWhere("formulario.tipo = :tipo", { tipo: "SOCIAL" })
      .orderBy("entrada.fechaAtencion", "DESC")
      .addOrderBy("entrada.id", "DESC")
      .limit(5)
      .getRawMany<EntradaReciente>();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([
    EntradaEvolutivaLectura, FormularioAreaEntity, ProfesionalFormularioEntity,
  ])],
  providers: [EvolucionLecturaService],
  exports: [EvolucionLecturaService],
})
export class EvolucionLecturaModule {}

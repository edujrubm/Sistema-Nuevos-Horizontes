import { EstanciaNino } from "./entities/estancia-nino.entity";
import { MovimientoNino } from "./entities/movimiento-nino.entity";
import { EventoAlbergue } from "./entities/evento-albergue.entity";
import { EstadoAlbergue } from "./entities/estado-albergue.entity";
import { BeneficiariaEntity, ExpedienteEntity } from "../beneficiarias";
import { NinoEntity } from "../ninos";
import { AlbergueRepository } from "./repositories/albergue.repository";
import { AlbergueConsultasRepository } from "./repositories/albergue-consultas.repository";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ActivoAlbergue } from "./entities/activo-albergue.entity";
import { AlbergueService } from "./albergue.service";
import { AlbergueController } from "./albergue.controller";
import { MovimientoAlbergue } from "./entities/movimiento-albergue.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstanciaNino,
      MovimientoNino,
      EventoAlbergue,
      ActivoAlbergue,
      MovimientoAlbergue,
      EstadoAlbergue,
      BeneficiariaEntity,
      ExpedienteEntity,
      NinoEntity,
    ]),
  ],
  controllers: [AlbergueController],
  providers: [AlbergueService, AlbergueRepository, AlbergueConsultasRepository],
})
export class AlbergueModule {}

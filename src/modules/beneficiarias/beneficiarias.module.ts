import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BeneficiariasController } from "./beneficiarias.controller";
import { BeneficiariasService } from "./beneficiarias.service";
import { BeneficiariaEntity } from "./entities/beneficiaria.entity";
import { BeneficiariasRepository } from "./repositories/beneficiarias.repository";

/** Identidad maestra; no contiene historia clínica ni formularios. */
@Module({
  imports: [TypeOrmModule.forFeature([BeneficiariaEntity])],
  controllers: [BeneficiariasController],
  providers: [BeneficiariasService, BeneficiariasRepository],
  exports: [BeneficiariasService],
})
export class BeneficiariasModule {}

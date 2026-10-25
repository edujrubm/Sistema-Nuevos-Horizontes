import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Beneficiaria } from '../../database/entities/beneficiaria.entity';
import { BeneficiariasController } from './beneficiarias.controller';
import { BeneficiariasService } from './beneficiarias.service';

/** Identidad maestra; no contiene historia clínica ni formularios. */
@Module({
  imports: [TypeOrmModule.forFeature([Beneficiaria])],
  controllers: [BeneficiariasController],
  providers: [BeneficiariasService],
  exports: [BeneficiariasService],
})
export class BeneficiariasModule {}

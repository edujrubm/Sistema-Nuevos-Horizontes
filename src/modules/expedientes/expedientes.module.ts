import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expediente } from '../../database/entities/expediente.entity';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';

/** Acceso y reglas del expediente institucional permanente. */
@Module({
  imports: [TypeOrmModule.forFeature([Expediente])],
  controllers: [ExpedientesController],
  providers: [ExpedientesService],
  exports: [ExpedientesService],
})
export class ExpedientesModule {}

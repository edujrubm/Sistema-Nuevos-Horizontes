import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivoAlbergue } from './entities/activo-albergue.entity';
import { AlbergueService } from './albergue.service';
import { AlbergueController } from './albergue.controller';
import { MovimientoAlbergue } from './entities/movimiento-albergue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivoAlbergue, MovimientoAlbergue])],
  controllers: [AlbergueController],
  providers: [AlbergueService],
})
export class AlbergueModule {}

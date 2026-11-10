import { Module } from '@nestjs/common';

import { MedicinaController } from './medicina.controller';
import { MedicinaRepository } from './repositories/medicina.repository';
import { MedicinaService } from './medicina.service';

/** Reúne la capa HTTP, los casos de uso y la persistencia del área de Medicina. */
@Module({
  controllers: [MedicinaController],
  providers: [MedicinaService, MedicinaRepository],
})
export class MedicinaModule {}

import { Module } from '@nestjs/common';

import { PsicologiaController } from './psicologia.controller';
import { PsicologiaRepository } from './repositories/psicologia.repository';
import { PsicologiaService } from './psicologia.service';

/** Reúne la capa HTTP, los casos de uso y la persistencia del área de Psicología. */
@Module({
  controllers: [PsicologiaController],
  providers: [PsicologiaService, PsicologiaRepository],
})
export class PsicologiaModule {}

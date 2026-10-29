import { Module } from '@nestjs/common';

import { PsicologiaController } from './psicologia.controller';
import { PsicologiaRepository } from './repositories/psicologia.repository';
import { PsicologiaService } from './psicologia.service';

@Module({
  controllers: [PsicologiaController],
  providers: [PsicologiaService, PsicologiaRepository],
})
export class PsicologiaModule {}

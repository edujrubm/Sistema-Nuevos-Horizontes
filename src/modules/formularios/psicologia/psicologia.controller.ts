import { Controller, Get, Param, Query } from '@nestjs/common';

import { ParseBigIntIdPipe } from '../../../common/pipes/parse-bigint-id.pipe';
import { ListarFichasPsicologiaDto } from './dto/listar-fichas-psicologia.dto';
import { PsicologiaService } from './psicologia.service';

@Controller('psicologia')
export class PsicologiaController {
  constructor(private readonly psicologiaService: PsicologiaService) {}

  @Get('beneficiarias/:id/resumen')
  obtenerResumenBeneficiaria(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.psicologiaService.obtenerResumenBeneficiaria(id);
  }

  @Get('beneficiarias/:id/fichas')
  obtenerFichasBeneficiaria(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasPsicologiaDto,
  ) {
    return this.psicologiaService.obtenerFichasBeneficiaria(id, query);
  }

  @Get('hijos/:id/resumen')
  obtenerResumenHijo(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.psicologiaService.obtenerResumenHijo(id);
  }

  @Get('hijos/:id/fichas')
  obtenerFichasHijo(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasPsicologiaDto,
  ) {
    return this.psicologiaService.obtenerFichasHijo(id, query);
  }
}

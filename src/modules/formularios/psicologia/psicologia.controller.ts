import { Controller, Get, Param, Query } from '@nestjs/common';

import { ParseBigIntIdPipe } from '../../../common/pipes/parse-bigint-id.pipe';
import { ListarFichasPsicologiaDto } from './dto/listar-fichas-psicologia.dto';
import { PsicologiaService } from './psicologia.service';

/** Expone las consultas psicológicas de beneficiarias y población infantil. */
@Controller('psicologia')
export class PsicologiaController {
  constructor(private readonly psicologiaService: PsicologiaService) {}

  /** Devuelve la identificación básica de una beneficiaria. */
  @Get('beneficiarias/:id/resumen')
  obtenerResumenBeneficiaria(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.psicologiaService.obtenerResumenBeneficiaria(id);
  }

  /** Lista las fichas psicológicas completas de una beneficiaria. */
  @Get('beneficiarias/:id/fichas')
  obtenerFichasBeneficiaria(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasPsicologiaDto,
  ) {
    return this.psicologiaService.obtenerFichasBeneficiaria(id, query);
  }

  /** Devuelve la identificación del niño y su beneficiaria responsable. */
  @Get('hijos/:id/resumen')
  obtenerResumenHijo(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.psicologiaService.obtenerResumenHijo(id);
  }

  /** Lista las fichas psicológicas infantiles completas. */
  @Get('hijos/:id/fichas')
  obtenerFichasHijo(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasPsicologiaDto,
  ) {
    return this.psicologiaService.obtenerFichasHijo(id, query);
  }
}

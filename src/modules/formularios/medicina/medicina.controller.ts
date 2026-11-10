import { Controller, Get, Param, Query } from '@nestjs/common';

import { ParseBigIntIdPipe } from '../../../common/pipes/parse-bigint-id.pipe';
import { ListarFichasMedicinaDto } from './dto/listar-fichas-medicina.dto';
import { MedicinaService } from './medicina.service';

/** Expone consultas de fichas médicas para beneficiarias e hijos. */
@Controller('v1/medicina')
export class MedicinaController {
  constructor(private readonly medicinaService: MedicinaService) {}

  /** Lista el historial adolescente y adulto según el tipo registrado en cada ficha. */
  @Get('beneficiarias/:id/fichas')
  obtenerFichasBeneficiaria(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasMedicinaDto,
  ) {
    return this.medicinaService.obtenerFichasBeneficiaria(id, query);
  }

  /** Lista exclusivamente fichas médicas infantiles del hijo indicado. */
  @Get('hijos/:id/fichas')
  obtenerFichasHijo(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Query() query: ListarFichasMedicinaDto,
  ) {
    return this.medicinaService.obtenerFichasHijo(id, query);
  }
}

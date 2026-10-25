import { Controller, Get, Param } from '@nestjs/common';

import { ExpedientesService } from './expedientes.service';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly service: ExpedientesService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}

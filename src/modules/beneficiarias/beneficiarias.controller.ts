import { Controller, Get, Query } from '@nestjs/common';

import { BeneficiariasService } from './beneficiarias.service';

@Controller('beneficiarias')
export class BeneficiariasController {
  constructor(private readonly service: BeneficiariasService) {}

  @Get()
  findRecent(@Query('limit') limit?: string) {
    return this.service.findRecent(limit ? Number(limit) : 50);
  }
}

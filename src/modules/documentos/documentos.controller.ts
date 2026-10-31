import { Controller, Get, Param, Body, Post, ValidationPipe } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CrearCargaDocumentoDto } from './dto/crear-carga-documento.dto';

@Controller('beneficiarias')
export class DocumentosController {
  constructor(
    private readonly documentosService: DocumentosService,
  ) {}

  @Get(':id/documentos')
  async listarPorBeneficiaria(@Param('id') id: string) {
    return this.documentosService.listarPorBeneficiaria(id);
  }

  @Post(':id/documentos/cargas')
async solicitarCarga(
  @Param('id') id: string,
  @Body(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  dto: CrearCargaDocumentoDto,
) {
  return this.documentosService.solicitarCarga(id, dto);
}

@Post('cargas/:id/completar')
async completarCarga(@Param('id') id: string) {
  return this.documentosService.completarCarga(id);
}
}
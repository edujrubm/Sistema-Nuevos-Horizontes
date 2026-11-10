import { Controller, Get, Param, Post, Body, ValidationPipe } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { AnularDocumentoDto } from './dto/anular-documento.dto';


@Controller('documentos')
export class DocumentoDetalleController {
  constructor(
    private readonly documentosService: DocumentosService,
  ) {}

  @Get(':id')
  async obtenerDocumento(@Param('id') id: string) {
    return this.documentosService.obtenerDocumento(id);
  }

  @Get(':id/versiones')
async listarVersiones(@Param('id') id: string) {
  return this.documentosService.listarVersiones(id);
}

@Post(':id/versiones')
async crearVersion(@Param('id') id: string) {
  return this.documentosService.crearVersion(id);
}

@Post(':id/anular')
async anularDocumento(
  @Param('id') id: string,
  @Body(new ValidationPipe({ whitelist: true, transform: true }))
  dto: AnularDocumentoDto,
) {
  return this.documentosService.anularDocumento(id, dto);
}
@Post('cargas/:id/completar')
  async completarCarga(@Param('id') id: string) {
    return this.documentosService.completarCarga(id);
  }
}
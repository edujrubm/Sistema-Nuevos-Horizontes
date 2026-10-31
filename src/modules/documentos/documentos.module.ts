import { Module } from '@nestjs/common';

import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { AlmacenamientoService } from './almacenamiento.service';
import { DocumentoDetalleController } from './documento-detalle.controller';

@Module({
  controllers: [DocumentosController, DocumentoDetalleController],
  providers: [DocumentosService, AlmacenamientoService],
})
export class DocumentosModule {}
import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { BigintIdPipe } from "../persona3/bigint-id.pipe";
import { CargaPdfDto } from "./carga-pdf.dto";
import { ArchivoPdf, CargaPdfService } from "./carga-pdf.service";

@Controller("beneficiarias")
export class DocumentosController {
  constructor(readonly carga: CargaPdfService) {}
  // Ruta del PDF añadida a nuestro alcance; carga propia sin depender de otro módulo externo.
  @Post(":id/documentos/cargas")
  @UseInterceptors(
    FileInterceptor("archivo", {
      limits: {
        fileSize: 20 * 1024 * 1024,
        files: 1,
        fields: 2,
        fieldSize: 1000,
        parts: 3,
      },
    }),
  )
  cargar(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CargaPdfDto,
    @UploadedFile() archivo?: ArchivoPdf,
  ) {
    return this.carga.cargar(id, dto, archivo);
  }
}

import { Response } from "express";
import { DocumentosService } from "./documentos.service";
import { ListaDto, TransicionDto } from "../persona3/dto/contratos.dto";
import { LIMITE_PDF_BYTES } from "./limites";
import {
  Body,
  Get,
  Query,
  Res,
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

@Controller("v1")
export class DocumentosController {
  constructor(
    readonly carga: CargaPdfService,
    readonly documentos: DocumentosService,
  ) {}
  @Get("beneficiarias/:id/documentos") listar(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.documentos.listar(id, q);
  }
  @Get("documentos/:id") consultar(@Param("id", BigintIdPipe) id: string) {
    return this.documentos.obtener(id);
  }
  @Get("documentos/:id/versiones") versiones(
    @Param("id", BigintIdPipe) id: string,
  ) {
    return this.documentos.versiones(id);
  }
  @Post("documentos/:id/anular") anular(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: TransicionDto,
  ) {
    return this.documentos.anular(id, dto);
  }
  @Get("documentos/:id/archivo") async archivo(
    @Param("id", BigintIdPipe) id: string,
    @Res() res: Response,
  ) {
    const bytes = await this.documentos.archivo(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="documento-${id}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(bytes);
  }
  // Ruta del PDF añadida a nuestro alcance; carga propia sin depender de otro módulo externo.
  @Post("beneficiarias/:id/documentos/cargas")
  @UseInterceptors(
    FileInterceptor("archivo", {
      limits: {
        fileSize: LIMITE_PDF_BYTES,
        files: 1,
        fields: 8,
        fieldSize: 80000,
        parts: 9,
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

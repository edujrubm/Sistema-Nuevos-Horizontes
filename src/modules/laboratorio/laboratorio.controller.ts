import { Response } from "express";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
} from "@nestjs/common";
import { BigintIdPipe } from "../persona3/bigint-id.pipe";
import { LaboratorioService } from "./laboratorio.service";
import {
  DetalleLocalDto,
  RiesgosLocalDto,
  ResponsableLocalDto,
  AutorizacionesLocalDto,
  DocumentoLocalDto,
  CierreLocalDto,
} from "./laboratorio.dto";
/** Endpoints experimentales locales: no sustituyen las 14 rutas de la entrega. */
@Controller("laboratorio")
export class LaboratorioController {
  constructor(readonly service: LaboratorioService) {}
  @Get("catalogos") catalogos() {
    return this.service.catalogos();
  }
  @Get("fichas/:id") consultar(@Param("id", BigintIdPipe) id: string) {
    return this.service.consultar(id);
  }
  @Patch("fichas/:id") guardar(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: DetalleLocalDto,
  ) {
    return this.service.guardar(id, dto);
  }
  @Put("fichas/:id/riesgos") riesgos(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: RiesgosLocalDto,
  ) {
    return this.service.riesgos(id, dto);
  }
  @Post("fichas/:id/responsables") responsable(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: ResponsableLocalDto,
  ) {
    return this.service.responsable(id, dto);
  }
  @Put("fichas/:id/autorizaciones") permisos(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: AutorizacionesLocalDto,
  ) {
    return this.service.autorizaciones(id, dto);
  }
  @Post("fichas/:id/cierre") cerrar(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CierreLocalDto,
  ) {
    return this.service.cerrar(id, dto);
  }
  @Patch("documentos/:id") documento(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: DocumentoLocalDto,
  ) {
    return this.service.documento(id, dto);
  }
  @Get("documentos/:id/archivo") async archivo(
    @Param("id", BigintIdPipe) id: string,
    @Res() res: Response,
  ) {
    const bytes = await this.service.archivo(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="documento-${id}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(bytes);
  }
}

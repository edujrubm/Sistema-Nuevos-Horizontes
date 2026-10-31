import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { BigintIdPipe } from "../../persona3/bigint-id.pipe";
import { Persona3Service } from "../../persona3/persona3.service";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  CrearReferenciaDto,
  EditarReferenciaDto,
  EvolucionListaDto,
  ListaDto,
  TransicionDto,
} from "../../persona3/dto/contratos.dto";

@Controller()
export class SocialController {
  constructor(readonly service: Persona3Service) {}
  @Get("trabajo-social/beneficiarias/:id/resumen") resumen(
    @Param("id", BigintIdPipe) id: string,
  ) {
    return this.service.resumenSocial(id);
  }
  @Get("trabajo-social/beneficiarias/:id/fichas") social(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.fichas(id, null, "SOCIAL", q);
  }
}

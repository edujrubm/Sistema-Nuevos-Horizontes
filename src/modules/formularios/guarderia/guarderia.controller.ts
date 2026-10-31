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
export class GuarderiaController {
  constructor(readonly service: Persona3Service) {}
  @Get("guarderia/beneficiarias/:id/hijos") hijos(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.hijos(id, q);
  }
  @Get("guarderia/hijos/:id/fichas") guarderia(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.fichas(null, id, "GUARDERIA", q);
  }
}

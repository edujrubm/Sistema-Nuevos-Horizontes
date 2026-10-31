import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { BigintIdPipe } from "../persona3/bigint-id.pipe";
import { Persona3Service } from "../persona3/persona3.service";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  CrearReferenciaDto,
  EditarReferenciaDto,
  EvolucionListaDto,
  ListaDto,
  TransicionDto,
} from "../persona3/dto/contratos.dto";

@Controller()
export class EvolucionController {
  constructor(readonly service: Persona3Service) {}
  @Get("beneficiarias/:id/hoja-evolutiva") evolucion(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: EvolucionListaDto,
  ) {
    return this.service.evolucion(id, q);
  }
  @Post("beneficiarias/:id/hoja-evolutiva") crearEntrada(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CrearEntradaDto,
  ) {
    return this.service.crearEntrada(id, dto);
  }
  @Patch("entradas-evolutivas/:id") corregir(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CorregirEntradaDto,
  ) {
    return this.service.corregirEntrada(id, dto);
  }
  @Get("entradas-evolutivas/:id/revisiones") revisiones(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.revisiones(id, q);
  }
}

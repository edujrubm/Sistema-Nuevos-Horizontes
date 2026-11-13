import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ParseBigIntIdPipe as BigintIdPipe } from "../../common/pipes/parse-bigint-id.pipe";
import { EvolucionService } from "./evolucion.service";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  EvolucionListaDto,
  ListaDto,
} from "./dto/entrada-evolutiva.dto";

@Controller("v1")
export class EvolucionController {
  constructor(readonly service: EvolucionService) {}
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

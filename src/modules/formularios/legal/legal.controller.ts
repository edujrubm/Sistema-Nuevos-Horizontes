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
export class LegalController {
  constructor(readonly service: Persona3Service) {}
  @Get("legal/beneficiarias/:id/fichas") legal(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.fichas(id, null, "LEGAL", q);
  }
  @Get("legal/beneficiarias/:id/referencias") referencias(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.service.fichas(id, null, "REFERENCIA_LEGAL", q);
  }
  @Post("legal/beneficiarias/:id/referencias") crearReferencia(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CrearReferenciaDto,
  ) {
    return this.service.crearReferencia(id, dto);
  }
  @Get("legal/referencias/:id") referencia(
    @Param("id", BigintIdPipe) id: string,
  ) {
    return this.service.referencia(id);
  }
  @Patch("legal/referencias/:id") editarReferencia(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: EditarReferenciaDto,
  ) {
    return this.service.editarReferencia(id, dto);
  }
  @Post("legal/referencias/:id/confirmar") confirmar(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: TransicionDto,
  ) {
    return this.service.confirmarReferencia(id, dto);
  }
}

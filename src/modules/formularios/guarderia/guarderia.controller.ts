import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ParseBigIntIdPipe as BigintIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { GuarderiaService } from "./guarderia.service";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  EvolucionListaDto,
  ListaDto,
} from "../../evolucion/dto/entrada-evolutiva.dto";

@Controller("v1")
export class GuarderiaController {
  constructor(readonly service: GuarderiaService) {}
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

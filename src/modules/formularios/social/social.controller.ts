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
import { SocialService } from "./social.service";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  EvolucionListaDto,
  ListaDto,
} from "../../evolucion/dto/entrada-evolutiva.dto";

@Controller("v1")
export class SocialController {
  constructor(readonly service: SocialService) {}
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

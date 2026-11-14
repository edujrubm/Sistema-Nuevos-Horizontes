import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParseBigIntIdPipe as BigintIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { SocialService } from "./social.service";
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

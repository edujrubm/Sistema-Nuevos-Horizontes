import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParseBigIntIdPipe as BigintIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { GuarderiaService } from "./guarderia.service";
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

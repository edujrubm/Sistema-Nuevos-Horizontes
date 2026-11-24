import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParseBigIntIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { GuarderiaService } from "./guarderia.service";
@Controller("v1")
export class GuarderiaController {
  constructor(private readonly service: GuarderiaService) {}
  @Get("guarderia/beneficiarias/:id/hijos")
  hijos(@Param("id", ParseBigIntIdPipe) id: string, @Query() filtro: ListaDto) {
    return this.service.listarHijos(id, filtro);
  }
  @Get("guarderia/hijos/:id/fichas")
  fichas(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Query() filtro: ListaDto,
  ) {
    return this.service.listarFichas(id, filtro);
  }
}

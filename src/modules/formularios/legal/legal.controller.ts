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
import { ListaDto } from "../../../common/dto/pagina.dto";
import { TransicionDto } from "../../../common/dto/version.dto";
import {
  CrearReferenciaDto,
  EditarReferenciaDto,
} from "./dto/referencia-legal.dto";
import { LegalService } from "./legal.service";
@Controller("v1")
export class LegalController {
  constructor(readonly service: LegalService) {}
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

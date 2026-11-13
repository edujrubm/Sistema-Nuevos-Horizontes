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
import { LegalService } from "./legal.service";
import {
  CrearReferenciaDto,
  EditarReferenciaDto,
} from "./dto/referencia-legal.dto";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { TransicionDto } from "../../../common/dto/version.dto";

@Controller("v1")
export class LegalController {
  constructor(private readonly legalService: LegalService) {}
  @Get("legal/beneficiarias/:id/fichas") legal(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.legalService.list(id, "LEGAL", q.pagina, q.limite);
  }
  @Get("legal/beneficiarias/:id/referencias") referencias(
    @Param("id", BigintIdPipe) id: string,
    @Query() q: ListaDto,
  ) {
    return this.legalService.list(id, "REFERENCIA_LEGAL", q.pagina, q.limite);
  }
  @Post("legal/beneficiarias/:id/referencias") crearReferencia(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: CrearReferenciaDto,
  ) {
    return this.legalService.create(id, dto);
  }
  @Get("legal/referencias/:id") referencia(
    @Param("id", BigintIdPipe) id: string,
  ) {
    return this.legalService.reference(id);
  }
  @Patch("legal/referencias/:id") editarReferencia(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: EditarReferenciaDto,
  ) {
    return this.legalService.edit(id, dto);
  }
  @Post("legal/referencias/:id/confirmar") confirmar(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: TransicionDto,
  ) {
    return this.legalService.confirm(id, dto);
  }
}

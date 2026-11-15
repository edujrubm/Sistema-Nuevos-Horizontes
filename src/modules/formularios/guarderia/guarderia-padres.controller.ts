import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ParseBigIntIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { ListaDto } from "../../../common/dto/pagina.dto";
import {
  CrearPadreGuarderiaDto,
  EditarPadreGuarderiaDto,
} from "./dto/padre-guarderia.dto";
import { GuarderiaPadresService } from "./guarderia-padres.service";
@Controller("v1/guarderia/beneficiarias/:beneficiariaId/hijos/:ninoId/padres")
export class GuarderiaPadresController {
  constructor(private readonly service: GuarderiaPadresService) {}
  @Get() listar(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiariaId: string,
    @Param("ninoId", ParseBigIntIdPipe) ninoId: string,
    @Query() filtro: ListaDto,
  ) {
    return this.service.listar(beneficiariaId, ninoId, filtro);
  }
  @Post() crear(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiariaId: string,
    @Param("ninoId", ParseBigIntIdPipe) ninoId: string,
    @Body() dto: CrearPadreGuarderiaDto,
  ) {
    return this.service.crear(beneficiariaId, ninoId, dto);
  }
  @Patch(":padreId") editar(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiariaId: string,
    @Param("ninoId", ParseBigIntIdPipe) ninoId: string,
    @Param("padreId", ParseBigIntIdPipe) id: string,
    @Body() dto: EditarPadreGuarderiaDto,
  ) {
    return this.service.editar(beneficiariaId, ninoId, id, dto);
  }
}

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
import { GuardarResponsableGuarderiaDto } from "./dto/responsable-guarderia.dto";
import { GuarderiaResponsablesService } from "./guarderia-responsables.service";

@Controller(
  "v1/guarderia/beneficiarias/:beneficiariaId/fichas/:formularioId/responsables",
)
export class GuarderiaResponsablesController {
  constructor(private readonly service: GuarderiaResponsablesService) {}
  @Get() listar(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiaria: string,
    @Param("formularioId", ParseBigIntIdPipe) ficha: string,
    @Query() filtro: ListaDto,
  ) {
    return this.service.listar(beneficiaria, ficha, filtro);
  }
  @Post() crear(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiaria: string,
    @Param("formularioId", ParseBigIntIdPipe) ficha: string,
    @Body() dto: GuardarResponsableGuarderiaDto,
  ) {
    return this.service.guardar(beneficiaria, ficha, dto);
  }
  @Patch(":responsableId") editar(
    @Param("beneficiariaId", ParseBigIntIdPipe) beneficiaria: string,
    @Param("formularioId", ParseBigIntIdPipe) ficha: string,
    @Param("responsableId", ParseBigIntIdPipe) responsable: string,
    @Body() dto: GuardarResponsableGuarderiaDto,
  ) {
    return this.service.guardar(beneficiaria, ficha, dto, responsable);
  }
}

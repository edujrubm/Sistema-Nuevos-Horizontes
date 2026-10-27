import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ParseBigIntIdPipe } from "../../common/pipes/parse-bigint-id.pipe";

import { BeneficiariasService } from "./beneficiarias.service";
import { BuscarCoincidenciasDto } from "./dto/buscar-coincidencias.dto";
import { ListarBeneficiariasDto } from "./dto/listar-beneficiarias.dto";

@Controller("v1/beneficiarias")
@ApiTags("Beneficiarias")
export class BeneficiariasController {
  constructor(private readonly service: BeneficiariasService) {}

  @Get()
  @ApiOperation({
    summary: "Lista y filtra beneficiarias con paginación por cursor",
  })
  listar(@Query() filtros: ListarBeneficiariasDto) {
    return this.service.listar(filtros);
  }

  @Post("buscar-coincidencias")
  @ApiOperation({
    summary: "Busca posibles coincidencias sin incluir el CUI en la URL",
  })
  buscarCoincidencias(@Body() filtros: BuscarCoincidenciasDto) {
    return this.service.buscarCoincidencias(filtros);
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulta el perfil general de una beneficiaria" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }
}

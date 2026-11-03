import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CatalogosService } from "./catalogos.service";
import {
  FiltroDepartamentoDto,
  FiltroPaisDto,
} from "./dto/filtro-geografico.dto";

@Controller("v1/catalogos")
@ApiTags("Catálogos")
export class CatalogosController {
  constructor(private readonly service: CatalogosService) {}

  @Get("paises")
  @ApiOperation({ summary: "Consulta el catálogo de países" })
  paises() {
    return this.service.paises();
  }

  @Get("departamentos")
  @ApiOperation({ summary: "Consulta departamentos, opcionalmente por país" })
  departamentos(@Query() filtro: FiltroPaisDto) {
    return this.service.departamentos(filtro.paisId);
  }

  @Get("municipios")
  @ApiOperation({
    summary: "Consulta municipios, opcionalmente por departamento",
  })
  municipios(@Query() filtro: FiltroDepartamentoDto) {
    return this.service.municipios(filtro.departamentoId);
  }

  @Get(":tipo")
  @ApiOperation({
    summary: "Consulta un catálogo permitido por su identificador estable",
  })
  obtener(@Param("tipo") tipo: string) {
    return this.service.obtener(tipo);
  }
}

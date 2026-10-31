import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ParseBigIntIdPipe } from "../../common/pipes/parse-bigint-id.pipe";

import { BeneficiariasService } from "./beneficiarias.service";
import { ActualizarBeneficiariaDto } from "./dto/actualizar-beneficiaria.dto";
import { BuscarCoincidenciasDto } from "./dto/buscar-coincidencias.dto";
import { CambiarEstadoDto } from "./dto/cambiar-estado.dto";
import { CrearBeneficiariaDto } from "./dto/crear-beneficiaria.dto";
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

  @Post()
  @ApiOperation({
    summary:
      "Inicia la admisión: crea beneficiaria, residencia, expediente y ficha inicial en borrador",
  })
  crear(@Body() entrada: CrearBeneficiariaDto) {
    return this.service.crear(entrada);
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulta el perfil general de una beneficiaria" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Actualiza el perfil con control optimista de versión",
  })
  actualizar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ActualizarBeneficiariaDto,
  ) {
    return this.service.actualizar(id, entrada);
  }

  @Post(":id/inactivar")
  @ApiOperation({ summary: "Inactiva el expediente sin borrar información" })
  inactivar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CambiarEstadoDto,
  ) {
    return this.service.cambiarEstado(id, false, entrada);
  }

  @Post(":id/reactivar")
  @ApiOperation({ summary: "Reactiva el expediente y conserva el historial" })
  reactivar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CambiarEstadoDto,
  ) {
    return this.service.cambiarEstado(id, true, entrada);
  }

  @Get(":id/historial")
  @ApiOperation({
    summary:
      "Consulta el historial auditado de la beneficiaria y su expediente",
  })
  historial(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.historial(id);
  }
}

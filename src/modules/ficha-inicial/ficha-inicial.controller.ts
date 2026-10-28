import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { ParseBigIntIdPipe } from "../../common/pipes/parse-bigint-id.pipe";

import { ActualizarSeccionDto } from "./dto/actualizar-seccion.dto";
import { ConfirmarFichaDto } from "./dto/confirmar-ficha.dto";
import { CrearFichaDto } from "./dto/crear-ficha.dto";
import { CrearNinoFichaDto } from "./dto/crear-nino-ficha.dto";
import { ListarFichasDto } from "./dto/listar-fichas.dto";
import { FichaInicialService } from "./ficha-inicial.service";

@Controller("v1")
@ApiTags("Ficha inicial")
export class FichaInicialController {
  constructor(private readonly service: FichaInicialService) {}

  @Get("fichas-iniciales")
  @ApiOperation({ summary: "Lista fichas iniciales con cursor y estado" })
  listar(@Query() filtro: ListarFichasDto) {
    return this.service.listar(filtro);
  }

  @Post("beneficiarias/:id/fichas-iniciales")
  @ApiOperation({ summary: "Crea el único borrador activo de ficha inicial" })
  crear(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CrearFichaDto,
  ) {
    return this.service.crear(id, entrada);
  }

  @Get("fichas-iniciales/:id")
  @ApiOperation({ summary: "Consulta cabecera y secciones de una ficha" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }

  @Patch("fichas-iniciales/:id/secciones/:seccion")
  @ApiOperation({ summary: "Crea o reemplaza una sección del borrador" })
  @ApiParam({
    name: "seccion",
    description: "Una de las 19 secciones institucionales",
  })
  seccion(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Param("seccion") seccion: string,
    @Body() entrada: ActualizarSeccionDto,
  ) {
    return this.service.guardarSeccion(id, seccion, entrada);
  }

  @Post("fichas-iniciales/:id/confirmar")
  @ApiOperation({ summary: "Confirma atómicamente una ficha completa" })
  confirmar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ConfirmarFichaDto,
  ) {
    return this.service.confirmar(id, entrada);
  }

  @Post("fichas-iniciales/:id/hijos")
  @ApiOperation({
    summary: "Registra una hija o hijo en el expediente de la ficha",
  })
  agregarNino(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CrearNinoFichaDto,
  ) {
    return this.service.agregarNino(id, entrada);
  }
}

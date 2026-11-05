import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { ParseBigIntIdPipe } from "../../common/pipes/parse-bigint-id.pipe";
import { ErrorApiDto } from "../../common/errors/error-api.dto";

import { ActualizarPaginaDto } from "./dto/actualizar-pagina.dto";
import { ConfirmarFichaDto } from "./dto/confirmar-ficha.dto";
import { ListarFichasDto } from "./dto/listar-fichas.dto";
import { IniciarFichaInicialDto } from "./dto/iniciar-ficha-inicial.dto";
import { FichaInicialService } from "./ficha-inicial.service";

@Controller("v1")
@ApiTags("Ficha inicial")
export class FichaInicialController {
  constructor(private readonly service: FichaInicialService) {}

  @Post("fichas-iniciales")
  @ApiOperation({
    summary:
      "Inicia una ficha: crea beneficiaria, expediente y borrador en una sola transacción",
  })
  @ApiBadRequestResponse({
    description: "Datos obligatorios, formato o geografía incompletos",
    type: ErrorApiDto,
  })
  @ApiConflictResponse({
    description: "Registro duplicado o relación de catálogo incompatible",
    type: ErrorApiDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Fallo inesperado normalizado sin detalles internos",
    type: ErrorApiDto,
  })
  iniciar(@Body() entrada: IniciarFichaInicialDto) {
    return this.service.iniciar(entrada);
  }

  @Get("fichas-iniciales")
  @ApiOperation({ summary: "Lista fichas iniciales con cursor y estado" })
  listar(@Query() filtro: ListarFichasDto) {
    return this.service.listar(filtro);
  }

  @Get("fichas-iniciales/:id")
  @ApiOperation({ summary: "Consulta cabecera y secciones de una ficha" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }

  @Patch("fichas-iniciales/:id/paginas/:pagina")
  @ApiOperation({
    summary: "Guarda una de las 8 páginas visibles de la ficha en borrador",
  })
  @ApiParam({
    name: "pagina",
    description:
      "identificacion, residencia, datos-salud, familia, violencia, riesgo, referencias o entrevista-cierre",
  })
  pagina(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Param("pagina") pagina: string,
    @Body() entrada: ActualizarPaginaDto,
  ) {
    return this.service.guardarPagina(id, pagina, entrada);
  }

  @Post("fichas-iniciales/:id/confirmar")
  @ApiOperation({ summary: "Confirma atómicamente una ficha completa" })
  confirmar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ConfirmarFichaDto,
  ) {
    return this.service.confirmar(id, entrada);
  }
}

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

import { ParseBigIntIdPipe } from "../../../common/pipes/parse-bigint-id.pipe";
import { ActualizarFormularioDto } from "./dto/actualizar-formulario.dto";
import { ConfirmarFormularioDto } from "./dto/confirmar-formulario.dto";
import { CrearFormularioDto } from "./dto/crear-formulario.dto";
import { ListarFormulariosDto } from "./dto/listar-formularios.dto";
import { FormularioSharedService } from "./formulario-shared.service";

@Controller("v1")
@ApiTags("Formularios de área")
export class FormularioSharedController {
  constructor(private readonly service: FormularioSharedService) {}

  @Get("beneficiarias/:id/formularios-area")
  @ApiOperation({
    summary: "Consulta formularios por beneficiaria, área y tipo",
  })
  listar(
    @Param("id", ParseBigIntIdPipe) beneficiariaId: string,
    @Query() filtro: ListarFormulariosDto,
  ) {
    return this.service.listar(beneficiariaId, filtro);
  }

  @Post("beneficiarias/:id/formularios-area")
  @ApiOperation({ summary: "Crea una cabecera y su detalle tipado" })
  crear(
    @Param("id", ParseBigIntIdPipe) beneficiariaId: string,
    @Body() entrada: CrearFormularioDto,
  ) {
    return this.service.crear(beneficiariaId, entrada);
  }

  @Get("formularios-area/:id")
  @ApiOperation({ summary: "Consulta un formulario de área" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }

  @Patch("formularios-area/:id")
  @ApiOperation({ summary: "Actualiza un borrador con control de versión" })
  actualizar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ActualizarFormularioDto,
  ) {
    return this.service.actualizar(id, entrada);
  }

  @Post("formularios-area/:id/confirmar")
  @ApiOperation({ summary: "Confirma un formulario de área" })
  confirmar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ConfirmarFormularioDto,
  ) {
    return this.service.confirmar(id, entrada);
  }

  @Get("tipos-formulario")
  @ApiOperation({ summary: "Lista tipos válidos, áreas y variantes" })
  tipos() {
    return this.service.tipos();
  }
}

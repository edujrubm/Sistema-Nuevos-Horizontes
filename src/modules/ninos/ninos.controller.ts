import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ParseBigIntIdPipe } from "../../common/pipes/parse-bigint-id.pipe";

import { ActualizarNinoDto } from "./dto/actualizar-nino.dto";
import { CambiarEstadoNinoDto } from "./dto/cambiar-estado-nino.dto";
import { NinosService } from "./ninos.service";

@Controller("v1")
@ApiTags("Hijas e hijos")
export class NinosController {
  constructor(private readonly service: NinosService) {}

  @Get("beneficiarias/:id/hijos")
  @ApiOperation({ summary: "Lista las hijas e hijos vinculados al expediente" })
  listar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.listar(id);
  }

  @Get("hijos/:id")
  @ApiOperation({ summary: "Consulta una hija o hijo por identificador" })
  consultar(@Param("id", ParseBigIntIdPipe) id: string) {
    return this.service.consultar(id);
  }

  @Patch("hijos/:id")
  @ApiOperation({ summary: "Actualiza una hija o hijo con control de versión" })
  actualizar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: ActualizarNinoDto,
  ) {
    return this.service.actualizar(id, entrada);
  }

  @Post("hijos/:id/inactivar")
  @ApiOperation({ summary: "Inactiva el registro sin eliminarlo físicamente" })
  inactivar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CambiarEstadoNinoDto,
  ) {
    return this.service.cambiarEstado(id, false, entrada);
  }

  @Post("hijos/:id/reactivar")
  @ApiOperation({ summary: "Reactiva una hija o hijo y conserva su historial" })
  reactivar(
    @Param("id", ParseBigIntIdPipe) id: string,
    @Body() entrada: CambiarEstadoNinoDto,
  ) {
    return this.service.cambiarEstado(id, true, entrada);
  }
}

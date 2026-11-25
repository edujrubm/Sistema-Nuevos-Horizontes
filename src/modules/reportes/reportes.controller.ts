import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";

import {
  JwtAuthGuard,
  RequestAutenticado,
} from "../seguridad/guards/jwt-auth.guard";
import { ActualizarEtiquetaOtroDto } from "./dto/actualizar-etiqueta-otro.dto";
import { ReportesService } from "./reportes.service";

@Controller("v1/reportes/valores-otros")
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  private exigirAdministracion(request: RequestAutenticado) {
    if (request.usuario?.tipo_rol !== "administrador_general")
      throw new ForbiddenException(
        "Esta operación requiere el rol Administrador General.",
      );
    return request.usuario;
  }

  @Get()
  listar(@Req() request: RequestAutenticado) {
    this.exigirAdministracion(request);
    return this.service.listarValoresOtros();
  }

  @Patch("etiqueta")
  actualizarEtiqueta(
    @Body() entrada: ActualizarEtiquetaOtroDto,
    @Req() request: RequestAutenticado,
  ) {
    const administrador = this.exigirAdministracion(request);
    return this.service.actualizarEtiqueta(entrada, administrador.id_usuario);
  }
}

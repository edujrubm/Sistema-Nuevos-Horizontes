import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";

import { SeguridadService } from "./seguridad.service";
import { LoginDto } from "./dto/login.dto";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { JwtAuthGuard, RequestAutenticado } from "./guards/jwt-auth.guard";

import { PermisosGuard } from "./guards/permisos.guard";
import { RequierePermiso } from "./decorators/requiere-permiso.decorator";
import { CambiarContrasenaDto } from "./dto/cambiar-contrasena.dto";


import { PermitirCambioContrasenaPendiente } from "./decorators/permitir-cambio-contrasena-pendiente.decorator";


@Controller("seguridad")
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  // Inicio de sesión: no requiere JWT.
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() datos: LoginDto) {
    return this.seguridadService.login(datos);
  }

  // Endpoint protegido para verificar el JWT.
  @Get("perfil")
  @UseGuards(JwtAuthGuard)
  @PermitirCambioContrasenaPendiente()
  obtenerPerfil(@Req() request: RequestAutenticado) {
    return {
      mensaje: "Autenticación correcta",
      usuario: request.usuario,
    };
  }

  // Cerrar únicamente la sesión actual.
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @PermitirCambioContrasenaPendiente()
  async logout(@Req() request: RequestAutenticado) {
    const usuario = request.usuario!;

    return this.seguridadService.logout(usuario.id_usuario, usuario.id_sesion);
  }

  // Desactivar un usuario y revocar todas sus sesiones.
  @Patch("usuarios/:id/desactivar")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermiso("inhabilitar", "usuarios")
  async desactivarUsuario(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: RequestAutenticado,
  ) {
    return this.seguridadService.desactivarUsuario(
      String(id),
      request.usuario!.id_usuario,
    );
  }

  // Reactivar una cuenta desactivada administrativamente.
  @Patch('usuarios/:id/reactivar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermiso('habilitar', 'usuarios')
  async reactivarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestAutenticado,
  ) {
    return this.seguridadService.reactivarUsuario(
      String(id),
      request.usuario!.id_usuario,
    );
  }

  @Post("usuarios")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermiso("crear", "usuarios")
  async crearUsuario(
    @Body() datos: CrearUsuarioDto,
    @Req() request: RequestAutenticado,
  ) {
    return this.seguridadService.crearUsuario(
      datos,
      request.usuario!.id_usuario,
    );
  }

  // Cambiar la contraseña de la cuenta autenticada.
  @Patch("cambiar-contrasena")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @PermitirCambioContrasenaPendiente()
  async cambiarContrasena(
    @Body() datos: CambiarContrasenaDto,
    @Req() request: RequestAutenticado,
  ) {
    return this.seguridadService.cambiarContrasena(
      request.usuario!.id_usuario,
      datos,
    );
  }
}

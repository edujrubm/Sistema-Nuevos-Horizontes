import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Request } from "express";

import { Usuario } from "../entities/usuario.entity";
import { Empleado } from "../entities/empleado.entity";
import { Rol } from "../entities/rol.entity";
import { Reflector } from "@nestjs/core";

import { PERMITIR_CAMBIO_CONTRASENA_PENDIENTE } from "../decorators/permitir-cambio-contrasena-pendiente.decorator";

interface JwtPayload {
  sub: string;
  empleado_id: string;
  sid: string;
  iat?: number;
  exp?: number;
}

export interface UsuarioAutenticado {
  id_usuario: string;
  id_empleado: string;
  id_rol: string;
  tipo_rol: string;
  id_area: string | null;
  id_sesion: string;
}

export interface RequestAutenticado extends Request {
  usuario?: UsuarioAutenticado;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,

    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestAutenticado>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Token de autenticación requerido");
    }

    const [tipo, token, ...extras] = authorization.split(" ");

    if (tipo !== "Bearer" || !token || extras.length > 0) {
      throw new UnauthorizedException("Formato de autenticación inválido");
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ["HS256"],
      });
    } catch {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    if (
      typeof payload.sub !== "string" ||
      !/^\d+$/.test(payload.sub) ||
      typeof payload.empleado_id !== "string" ||
      !/^\d+$/.test(payload.empleado_id) ||
      typeof payload.sid !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.sid,
      )
    ) {
      throw new UnauthorizedException("Token inválido");
    }

    const sesiones: Array<{ id_sesion: string }> = await this.dataSource.query(
      `
        SELECT id_sesion
        FROM new_horizons.sesion_usuario
        WHERE id_sesion = $1::uuid
          AND id_usuario = $2::bigint
          AND revocado_en IS NULL
          AND expira_en > CURRENT_TIMESTAMP
        LIMIT 1
        `,
      [payload.sid, payload.sub],
    );

    if (sesiones.length === 0) {
      throw new UnauthorizedException("La sesión ha expirado o fue revocada");
    }
    // Consultar el estado actual del usuario.
    const usuario = await this.usuarioRepository.findOne({
      where: {
        id_usuario: payload.sub,
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException("Cuenta inactiva o inexistente");
    }
    // Consultar el estado actual de la contraseña directamente en PostgreSQL.
    const estados: Array<{ debe_cambiar_contrasena: boolean }> =
      await this.dataSource.query(
        `
        SELECT debe_cambiar_contrasena
        FROM new_horizons.usuario
        WHERE id_usuario = $1::bigint
        `,
        [usuario.id_usuario],
      );

    if (estados.length === 0) {
      throw new UnauthorizedException("Cuenta inexistente");
    }

    // Comprobar si el endpoint permite acceso durante el cambio obligatorio.
    const permiteCambioPendiente = this.reflector.getAllAndOverride<boolean>(
      PERMITIR_CAMBIO_CONTRASENA_PENDIENTE,
      [context.getHandler(), context.getClass()],
    );

    // Bloquear las funcionalidades normales mientras exista una contraseña temporal.
    if (
      estados[0].debe_cambiar_contrasena &&
      !permiteCambioPendiente
    ) {
      throw new ForbiddenException(
        "Debe cambiar su contraseña antes de continuar",
      );
    }

    // Comprobar que el empleado siga vinculado a la cuenta.
    if (usuario.id_empleado !== payload.empleado_id) {
      throw new UnauthorizedException("La sesión ya no es válida");
    }

    const empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: usuario.id_empleado,
      },
    });

    if (!empleado || !empleado.rol_id) {
      throw new UnauthorizedException("Usuario sin rol válido");
    }

    const rol = await this.rolRepository.findOne({
      where: {
        id_rol: empleado.rol_id,
      },
    });

    if (!rol) {
      throw new UnauthorizedException("Usuario sin rol válido");
    }

    // Guardar la identidad validada para los endpoints.
    request.usuario = {
      id_usuario: usuario.id_usuario,
      id_empleado: empleado.id_empleado,
      id_rol: rol.id_rol,
      tipo_rol: rol.tipo_rol ?? "",
      id_area: rol.id_area,
      id_sesion: payload.sid,
    };

    return true;
  }
}

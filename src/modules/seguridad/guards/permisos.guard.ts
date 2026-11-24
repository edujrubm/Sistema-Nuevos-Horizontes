import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";
import { DataSource } from "typeorm";

import { RequestAutenticado } from "./jwt-auth.guard";

import {
  PermisoRequerido,
  REQUIERE_PERMISO_KEY,
} from "../decorators/requiere-permiso.decorator";

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener el permiso declarado en el endpoint.
    const permisoRequerido = this.reflector.getAllAndOverride<
      PermisoRequerido | undefined
    >(REQUIERE_PERMISO_KEY, [context.getHandler(), context.getClass()]);

    // No permitir que una ruta protegida omita
    // accidentalmente la declaración del permiso.
    if (!permisoRequerido) {
      throw new ForbiddenException(
        "El endpoint no tiene un permiso configurado",
      );
    }

    // Obtener la identidad validada por JwtAuthGuard.
    const request = context.switchToHttp().getRequest<RequestAutenticado>();

    const usuario = request.usuario;

    if (!usuario) {
      throw new ForbiddenException("No se encontró una identidad autenticada");
    }

    // Consultar la autorización actual en PostgreSQL.
    const resultado: Array<{ autorizado: boolean }> =
      await this.dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM new_horizons.rol_permisos_por_recurso rp
          INNER JOIN new_horizons.permisos p
            ON p.id_permisos = rp.id_permisos
          INNER JOIN new_horizons.recursos rec
            ON rec.id_recursos = rp.id_recursos
          WHERE rp.id_rol = $1
            AND p.tipo_permisos = $2
            AND rec.tipo_recursos = $3
        ) AS autorizado
        `,
        [usuario.id_rol, permisoRequerido.permiso, permisoRequerido.recurso],
      );

    if (!resultado[0]?.autorizado) {
      throw new ForbiddenException(
        "No tiene permiso para realizar esta operación",
      );
    }

    return true;
  }
}

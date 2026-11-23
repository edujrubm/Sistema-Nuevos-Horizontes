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
  AmbitoRequerido,
  REQUIERE_AMBITO_KEY,
} from "../decorators/requiere-ambito.decorator";

@Injectable()
export class AmbitoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ambito = this.reflector.getAllAndOverride<AmbitoRequerido>(
      REQUIERE_AMBITO_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Una ruta que utiliza este Guard debe declarar
    // explícitamente su ámbito.
    if (!ambito) {
      throw new ForbiddenException(
        "El endpoint no tiene un ámbito configurado",
      );
    }

    const request = context.switchToHttp().getRequest<RequestAutenticado>();

    const usuario = request.usuario;

    if (!usuario) {
      throw new ForbiddenException("No se encontró una identidad autenticada");
    }

    // Obtener el expediente desde la ruta.
    const expedienteId = request.params[ambito.expedienteParam];

    if (typeof expedienteId !== "string" || !/^[1-9]\d*$/.test(expedienteId)) {
      throw new ForbiddenException("Expediente inválido");
    }

    // Verificar que el rol pertenezca al área requerida.
    if (usuario.id_area === null || usuario.id_area !== String(ambito.areaId)) {
      throw new ForbiddenException("No pertenece al área requerida");
    }

    // Verificar asignación vigente.
    const resultado: Array<{ autorizado: boolean }> =
      await this.dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM new_horizons.asignacion_expediente ae
          WHERE ae.empleado_id = $1
            AND ae.expediente_id = $2
            AND ae.area_id = $3
            AND ae.fecha_inicio <= CURRENT_TIMESTAMP
            AND (
              ae.fecha_fin IS NULL
              OR ae.fecha_fin > CURRENT_TIMESTAMP
            )
        ) AS autorizado
        `,
        [usuario.id_empleado, expedienteId, ambito.areaId],
      );

    if (!resultado[0]?.autorizado) {
      throw new ForbiddenException(
        "No tiene una asignación vigente al expediente",
      );
    }

    return true;
  }
}

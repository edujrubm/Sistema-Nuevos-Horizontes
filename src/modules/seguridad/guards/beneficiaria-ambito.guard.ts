import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { DataSource } from "typeorm";

import { RequestAutenticado } from "./jwt-auth.guard";

@Injectable()
export class BeneficiariaAmbitoGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestAutenticado>();

    const usuario = request.usuario;

    if (!usuario) {
      throw new ForbiddenException("No se encontró una identidad autenticada");
    }

    const beneficiariaId = request.params.id;

    if (
      typeof beneficiariaId !== "string" ||
      !/^[1-9]\d*$/.test(beneficiariaId)
    ) {
      throw new ForbiddenException("Identificador de beneficiaria inválido");
    }

    // Acceso institucional de Directora.
    // PermisosGuard debe ejecutarse antes de este Guard.
    if (usuario.tipo_rol === "directora") {
      return true;
    }

    // Los perfiles sin área no obtienen acceso
    // automático a información personal.
    if (!usuario.id_area) {
      throw new ForbiddenException("No tiene un área autorizada");
    }

    const resultado: Array<{ autorizado: boolean }> =
      await this.dataSource.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM new_horizons.expediente e
          INNER JOIN new_horizons.asignacion_expediente ae
            ON ae.expediente_id = e.id_expediente
          WHERE e.beneficiaria_id = $1::bigint
            AND ae.empleado_id = $2::bigint
            AND ae.area_id = $3::bigint
            AND ae.fecha_inicio <= CURRENT_TIMESTAMP
            AND (
              ae.fecha_fin IS NULL
              OR ae.fecha_fin > CURRENT_TIMESTAMP
            )
        ) AS autorizado
        `,
        [beneficiariaId, usuario.id_empleado, usuario.id_area],
      );

    if (!resultado[0]?.autorizado) {
      throw new ForbiddenException(
        "No tiene acceso al expediente de esta beneficiaria",
      );
    }

    return true;
  }
}

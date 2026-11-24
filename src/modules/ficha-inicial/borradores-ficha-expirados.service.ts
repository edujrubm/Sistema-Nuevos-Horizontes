import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

const INTERVALO_REVISION_MS = 60 * 60 * 1000;
const MOTIVO_DESCARTE =
  "Descarte automático: borrador de ficha inicial sin actividad durante 7 días";

@Injectable()
export class BorradoresFichaExpiradosService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BorradoresFichaExpiradosService.name);
  private temporizador?: NodeJS.Timeout;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.descartarVencidos();
    this.temporizador = setInterval(() => {
      void this.descartarVencidos();
    }, INTERVALO_REVISION_MS);
    this.temporizador.unref();
  }

  onModuleDestroy() {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  async descartarVencidos() {
    const usuario = this.config.get<string>(
      "AUDIT_ACTOR_USERNAME",
      "actor_pruebas_persona1",
    );
    try {
      const filas = await this.dataSource.transaction(async (manager) => {
        const [actor] = await manager.query<Array<{ id: string }>>(
          `SELECT id_usuario::text AS id
           FROM new_horizons.usuario WHERE nombre_usuario=$1`,
          [usuario],
        );
        if (!actor)
          throw new Error(
            "No existe el actor técnico para el descarte automático.",
          );
        await manager.query(
          "SELECT set_config('new_horizons.actor_id',$1,true),set_config('new_horizons.motivo',$2,true)",
          [actor.id, MOTIVO_DESCARTE],
        );
        return manager.query<Array<{ id: string }>>(
          `UPDATE new_horizons.ficha_inicial
           SET estado='DESCARTADA'
           WHERE estado='BORRADOR'
             AND actualizado_en <= clock_timestamp() - INTERVAL '7 days'
           RETURNING id_ficha_inicial::text AS id`,
        );
      });
      if (filas.length > 0)
        this.logger.log(
          `Se descartaron ${filas.length} borradores de ficha inicial vencidos.`,
        );
      return filas.length;
    } catch (error) {
      this.logger.error(
        "No fue posible descartar borradores vencidos de ficha inicial.",
        error,
      );
      return 0;
    }
  }
}

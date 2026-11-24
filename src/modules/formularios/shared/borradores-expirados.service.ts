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
  "Descarte automático: borrador sin actividad durante 24 horas";

/** Descarta de forma lógica los formularios que no se retomaron en 24 horas. */
@Injectable()
export class BorradoresExpiradosService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BorradoresExpiradosService.name);
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
    const borrador = this.config.get<string>(
      "FORM_DRAFT_STATE_CODE",
      "BORRADOR",
    );
    const descartado = this.config.get<string>(
      "FORM_DISCARDED_STATE_CODE",
      "DESCARTADO",
    );
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
          `UPDATE new_horizons.formulario_area
           SET estado_codigo=$1,motivo_cambio=$2
           WHERE estado_codigo=$3
             AND actualizado_en <= clock_timestamp() - INTERVAL '24 hours'
           RETURNING id::text AS id`,
          [descartado, MOTIVO_DESCARTE, borrador],
        );
      });

      if (filas.length > 0)
        this.logger.log(`Se descartaron ${filas.length} borradores vencidos.`);
      return filas.length;
    } catch (error) {
      this.logger.error("No fue posible descartar borradores vencidos.", error);
      return 0;
    }
  }
}

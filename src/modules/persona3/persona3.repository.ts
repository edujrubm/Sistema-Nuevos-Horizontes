import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";

export function camel(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      v,
    ]),
  );
}

@Injectable()
export class Persona3Repository {
  constructor(readonly data: DataSource) {}

  async pagina(
    consulta: string,
    parametros: unknown[],
    conteo: string,
    parametrosConteo: unknown[],
  ): Promise<{ filas: Record<string, any>[]; total: number }> {
    // Lista y total leen la misma instantánea, incluso si otra persona escribe.
    // El conteo no lleva LIMIT/OFFSET y también funciona en una página vacía.
    return this.data.transaction("REPEATABLE READ", async (manager) => {
      const [cantidad] = await manager.query(conteo, parametrosConteo);
      const filas = await manager.query(consulta, parametros);
      return { filas, total: Number(cantidad.total) };
    });
  }

  async expediente(id: string, manager: EntityManager = this.data.manager) {
    const rows = await manager.query(
      "SELECT id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=$1",
      [id],
    );
    if (!rows.length)
      throw new NotFoundException("Beneficiaria con expediente no encontrada");
    return rows[0].id_expediente as string;
  }

  async hijo(id: string) {
    const rows = await this.data.query(
      "SELECT nino_id, expediente_id FROM new_horizons.nino WHERE nino_id=$1",
      [id],
    );
    if (!rows.length) throw new NotFoundException("Hijo no encontrado");
    return rows[0];
  }

  async formulario(id: string, manager = this.data.manager, lock = false) {
    const rows = await manager.query(
      `SELECT f.*, e.beneficiaria_id FROM new_horizons.formulario_area f JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id WHERE f.id=$1${lock ? " FOR UPDATE OF f" : ""}`,
      [id],
    );
    if (!rows.length) throw new NotFoundException("Formulario no encontrado");
    return rows[0];
  }

  async referencia(
    id: string,
    manager = this.data.manager,
    lock = false,
  ): Promise<Record<string, unknown>> {
    const form = await this.formulario(id, manager, lock);
    if (form.tipo !== "REFERENCIA_LEGAL")
      throw new NotFoundException("Referencia no encontrada");
    const [detail] = await manager.query(
      "SELECT destino,origen,motivo_referencia,recomendaciones FROM new_horizons.referencia_legal WHERE formulario_id=$1",
      [id],
    );
    if (!detail)
      throw new NotFoundException("Detalle de referencia no encontrado");
    const { beneficiaria_id: beneficiariaId, ...header } = form;
    return { ...camel(header), beneficiariaId, detalle: camel(detail) };
  }

  version(actual: number, recibida: number) {
    if (actual !== recibida)
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El registro cambió; vuelva a consultarlo",
        versionActual: actual,
      });
  }

  // Actor de prueba del servidor. Nunca se acepta actorId enviado por el cliente.
  async transaction<T>(
    motivo: string,
    fn: (manager: EntityManager, actor: string) => Promise<T>,
  ): Promise<T> {
    const actor = process.env.P3_TEST_ACTOR_ID;
    if (
      !["development", "test"].includes(process.env.NODE_ENV || "") ||
      !actor ||
      !/^[1-9]\d{0,18}$/.test(actor)
    ) {
      throw new ServiceUnavailableException(
        "Mutaciones habilitadas únicamente en laboratorio con actor configurado",
      );
    }
    try {
      return await this.data.transaction(async (manager) => {
        await manager.query(
          "SELECT set_config('new_horizons.actor_id',$1,true),set_config('new_horizons.motivo',$2,true)",
          [actor, motivo],
        );
        return fn(manager, actor);
      });
    } catch (error) {
      const code = (error as { driverError?: { code?: string } }).driverError
        ?.code;
      if (
        code &&
        ["23503", "23505", "23514", "P0001", "40001", "40P01"].includes(code)
      ) {
        throw new ConflictException({
          code: "INTEGRITY_CONFLICT",
          message:
            "La operación contradice una relación, estado o regla de integridad",
        });
      }
      throw error;
    }
  }
}

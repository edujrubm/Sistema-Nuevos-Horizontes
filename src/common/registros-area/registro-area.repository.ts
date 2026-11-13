import { auditedTransaction } from "../database/audited-transaction";
import { ErrorApi } from "../errors/error-api";
import { Injectable } from "@nestjs/common";
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
export class RegistroAreaRepository {
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
    if (!rows.length) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    return rows[0].id_expediente as string;
  }

  async hijo(id: string) {
    const rows = await this.data.query(
      "SELECT nino_id, expediente_id FROM new_horizons.nino WHERE nino_id=$1",
      [id],
    );
    if (!rows.length) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    return rows[0];
  }

  async formulario(id: string, manager = this.data.manager, lock = false) {
    const rows = await manager.query(
      `SELECT f.*, e.beneficiaria_id FROM new_horizons.formulario_area f JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id WHERE f.id=$1${lock ? " FOR UPDATE OF f" : ""}`,
      [id],
    );
    if (!rows.length) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    return rows[0];
  }

  version(actual: number, recibida: number) {
    if (actual !== recibida) throw new ErrorApi("VERSION_DESACTUALIZADA");
  }

  // Actor de prueba del servidor. Nunca se acepta actorId enviado por el cliente.
  async transaction<T>(
    motivo: string,
    fn: (manager: EntityManager, actor: string) => Promise<T>,
  ): Promise<T> {
    return auditedTransaction(this.data, motivo, fn);
  }
}

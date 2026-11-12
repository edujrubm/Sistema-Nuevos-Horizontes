import { DataSource, EntityManager } from "typeorm";
import { Logger } from "@nestjs/common";
import { ErrorApi, codigoTecnico, falloConexion } from "../errors/error-api";

/** Conserva el protocolo transaccional auditado existente y sus errores p�blicos. */
export async function auditedTransaction<T>(
  data: DataSource,
  motivo: string,
  fn: (manager: EntityManager, actor: string) => Promise<T>,
): Promise<T> {
  const actor = process.env.P3_TEST_ACTOR_ID;
  if (
    !["development", "test"].includes(process.env.NODE_ENV || "") ||
    !actor ||
    !/^[1-9]\d{0,18}$/.test(actor)
  ) {
    throw new ErrorApi("CONFIGURACION_INCOMPLETA");
  }
  const runner = data.createQueryRunner();
  let commitIntentado = false;
  try {
    await runner.connect();
    await runner.startTransaction();
    await runner.manager.query(
      "SELECT set_config('new_horizons.actor_id',$1,true),set_config('new_horizons.motivo',$2,true)",
      [actor, motivo],
    );
    const result = await fn(runner.manager, actor);
    commitIntentado = true;
    await runner.commitTransaction();
    return result;
  } catch (error) {
    let rollbackConfirmado = true;
    if (runner.isTransactionActive) {
      try {
        await runner.rollbackTransaction();
      } catch {
        rollbackConfirmado = false;
      }
    }
    const code = codigoTecnico(error);
    if (
      !rollbackConfirmado ||
      (commitIntentado && (falloConexion(error) || !code))
    )
      throw new ErrorApi("RESULTADO_OPERACION_INCIERTO");
    // Solo FK reconocidas de nuestras escrituras. Otras restricciones se investigan como errores internos.
    const constraint = (error as { driverError?: { constraint?: string } })
      ?.driverError?.constraint;
    if (
      code === "23503" &&
      [
        "formulario_area_profesional_id_fkey",
        "ficha_social_area_coordinacion_id_fkey",
        "ficha_legal_demandado_agresor_id_fkey",
        "ficha_guarderia_etnia_id_fkey",
        "ficha_guarderia_escolaridad_id_fkey",
        "fk_form_ficha_mismo_exp",
        "fk_autorizacion_mismo_form",
        "familiar_declarado_parentesco_id_fkey",
        "formulario_area_capturado_por_fkey",
        "entrada_evolutiva_profesional_id_fkey",
        "entrada_evolutiva_capturado_por_fkey",
      ].includes(constraint || "")
    )
      throw new ErrorApi("RELACION_INCOMPATIBLE");
    if (["40001", "40P01"].includes(code || ""))
      throw new ErrorApi("BASE_DATOS_NO_DISPONIBLE");
    throw error;
  } finally {
    await runner.release().catch(() => {
      new Logger("AuditedTransaction").warn(
        "No se pudo liberar una conexión de BD; revisar el pool.",
      );
    });
  }
}

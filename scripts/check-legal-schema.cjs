const fs = require("node:fs");
const { DataSource } = require("typeorm");
const { FormularioAreaEntity } = require("../dist/modules/formularios/shared/entities/formulario-area.entity");
const { FichaLegal } = require("../dist/modules/formularios/legal/entities/ficha-legal.entity");
const { ReferenciaLegal } = require("../dist/modules/formularios/legal/entities/referencia-legal.entity");

if (fs.existsSync(".env")) process.loadEnvFile(".env");
const data = new DataSource({
  type: "postgres", host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME, username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
  entities: [FormularioAreaEntity, FichaLegal, ReferenciaLegal],
  synchronize: false, migrationsRun: false,
});

async function main() {
  if (!process.env.DATABASE_HOST || !process.env.DATABASE_NAME)
    throw new Error("Falta configurar la conexión de ensayo.");
  await data.initialize();
  const failures = await data.transaction("REPEATABLE READ", async (manager) => {
    // La comprobación no aplica migraciones ni consulta expedientes personales.
    await manager.query("SET TRANSACTION READ ONLY");
    const failures = [];
    const columns = await manager.query(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=$1",
      ["new_horizons"],
    );
    const available = new Set(columns.map((row) => row.table_name + "." + row.column_name));
    for (const entity of [FormularioAreaEntity, FichaLegal, ReferenciaLegal]) {
      const metadata = data.getMetadata(entity);
      for (const column of metadata.columns)
        if (!available.has(metadata.tableName + "." + column.databaseName))
          failures.push("Falta columna: " + metadata.tableName + "." + column.databaseName);
    }
    const states = [
      process.env.FORM_DRAFT_STATE_CODE || "BORRADOR",
      process.env.FORM_CONFIRMED_STATE_CODE || "CONFIRMADO",
      process.env.FORM_DISCARDED_STATE_CODE || "DESCARTADO",
      process.env.P3_DRAFT_STATE,
      process.env.P3_CONFIRMED_STATE,
    ];
    if (!states[3] || !states[4])
      failures.push("Faltan los estados del contexto técnico de referencias (P3_DRAFT_STATE/P3_CONFIRMED_STATE).");
    const rows = await manager.query(
      "SELECT codigo FROM new_horizons.estado_formulario WHERE codigo = ANY($1::text[])",
      [states.filter(Boolean)],
    );
    const configured = new Set(rows.map((row) => row.codigo));
    for (const state of states.filter(Boolean))
      if (!configured.has(state)) failures.push("Estado no disponible: " + state);
    const types = await manager.query(
      "SELECT codigo FROM new_horizons.tipo_formulario WHERE codigo = ANY($1::text[])",
      [["LEGAL", "REFERENCIA_LEGAL"]],
    );
    if (types.length !== 2) failures.push("Falta habilitar LEGAL o REFERENCIA_LEGAL en el catálogo.");
    const username = process.env.AUDIT_ACTOR_USERNAME || "actor_pruebas_persona1";
    const actor = await manager.query(
      "SELECT EXISTS(SELECT 1 FROM new_horizons.usuario WHERE nombre_usuario=$1) AS existe",
      [username],
    );
    if (!actor[0].existe) failures.push("No existe el actor técnico configurado para el motor común.");
    const referenceActor = process.env.P3_TEST_ACTOR_ID;
    if (!referenceActor || !/^[1-9]\d{0,18}$/.test(referenceActor) || BigInt(referenceActor) > 9223372036854775807n) {
      failures.push("Falta un actor técnico válido para las referencias (P3_TEST_ACTOR_ID).");
    } else {
      const found = await manager.query(
        "SELECT EXISTS(SELECT 1 FROM new_horizons.usuario WHERE id_usuario=$1) AS existe",
        [referenceActor],
      );
      if (!found[0].existe) failures.push("No existe el actor técnico configurado para las referencias.");
    }
    const audited = await manager.query(
      "SELECT DISTINCT c.relname AS tabla FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid WHERE n.nspname=$1 AND p.proname=$2 AND t.tgenabled <> 'D'",
      ["new_horizons", "auditar"],
    );
    for (const table of ["formulario_area", "ficha_legal", "referencia_legal"])
      if (!audited.some((row) => row.tabla === table))
        failures.push("No se encontró auditoría activa para " + table);
    return failures;
  });
  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  } else console.log("Esquema, estados, variantes y auditoría de Legal: comprobados en lectura.");
  console.log("Este chequeo no acredita autenticación productiva ni reemplaza las pruebas funcionales.");
}
main().catch(() => {
  console.error("No se pudo verificar el esquema de Legal. Revisar conexión, permisos y migraciones con el encargado.");
  process.exitCode = 1;
}).finally(async () => { if (data.isInitialized) await data.destroy(); });

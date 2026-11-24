// El modo fuente es explícito y solo permite comprobar el esquema en el laboratorio.
const sourceMode = process.env.LEGAL_SCHEMA_SOURCE === "true";
if (sourceMode && !["test","development"].includes(process.env.NODE_ENV || "")) throw new Error("Modo fuente solo disponible en pruebas locales.");
if(sourceMode){require("reflect-metadata");require("ts-node").register({transpileOnly:true});}
const codeRoot=sourceMode?"../src":"../dist";
const fs = require("node:fs");
const { DataSource } = require("typeorm");
const { FormularioAreaEntity } = require(codeRoot + "/modules/formularios/shared/entities/formulario-area.entity");
const { FichaLegal } = require(codeRoot + "/modules/formularios/legal/entities/ficha-legal.entity");
const { ReferenciaLegal } = require(codeRoot + "/modules/formularios/legal/entities/referencia-legal.entity");

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
    ];
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
    const username = process.env.AUDIT_ACTOR_USERNAME;
    if (!username?.trim()) {
      failures.push("Falta configurar AUDIT_ACTOR_USERNAME para la auditoría local.");
    } else {
      const actor = await manager.query(
        "SELECT EXISTS(SELECT 1 FROM new_horizons.usuario WHERE nombre_usuario=$1) AS existe",
        [username],
      );
      if (!actor[0].existe)
        failures.push("No existe el usuario configurado en AUDIT_ACTOR_USERNAME.");
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

// Diagnóstico local: solo metadatos, sin leer expedientes ni aplicar DDL.
require("reflect-metadata");
const fs = require("node:fs");
const { DataSource } = require("typeorm");
const { FichaSocial } = require("../dist/modules/formularios/social/entities/ficha-social.entity");
const { FormularioAreaEntity } = require("../dist/modules/formularios/shared/entities/formulario-area.entity");
const { BeneficiariaEntity, ExpedienteEntity } = require("../dist/modules/beneficiarias");
const catalogs = require("../dist/modules/formularios/shared/entities/formulario-catalogos.entity");
const { EntradaEvolutivaLectura } = require("../dist/modules/evolucion/lectura/entrada-evolutiva-lectura.entity");
const entities = [FichaSocial, FormularioAreaEntity, BeneficiariaEntity, ExpedienteEntity, EntradaEvolutivaLectura, ...Object.values(catalogs)];

async function main() {
  if (!["127.0.0.1", "localhost", "::1"].includes(process.env.SOCIAL_TEST_HOST))
    throw new Error("El diagnóstico requiere un servidor de ensayo local explícito.");
  if (!process.env.SOCIAL_TEST_DATABASE || !process.env.SOCIAL_TEST_PORT)
    throw new Error("Falta indicar base y puerto de ensayo.");
  const data = new DataSource({
    type: "postgres", host: process.env.SOCIAL_TEST_HOST,
    port: Number(process.env.SOCIAL_TEST_PORT), database: process.env.SOCIAL_TEST_DATABASE,
    username: process.env.SOCIAL_TEST_USER, password: process.env.SOCIAL_TEST_PASSWORD,
    entities, synchronize: false, migrationsRun: false, connectTimeoutMS: 3000,
  });
  try {
    await data.initialize();
    const report = await data.transaction("REPEATABLE READ", async manager => {
      await manager.query("SET TRANSACTION READ ONLY");
      const tables = entities.map(entity => data.getMetadata(entity).tableName);
      const columns = await manager.query(
        "SELECT table_name,column_name,udt_name,is_nullable,column_default,is_identity,character_maximum_length FROM information_schema.columns WHERE table_schema=$1 AND table_name=ANY($2::text[]) ORDER BY table_name,ordinal_position",
        ["new_horizons", tables],
      );
      const failures = [];
      let checked = 0;
      const aliases = { bigint: "int8", timestamptz: "timestamptz", integer: "int4", boolean: "bool" };
      for (const entity of entities) {
        const metadata = data.getMetadata(entity);
        for (const column of metadata.columns) {
          checked++;
          const key = metadata.tableName + "." + column.databaseName;
          const actual = columns.find(row => row.table_name === metadata.tableName && row.column_name === column.databaseName);
          if (!actual) { failures.push("Falta " + key); continue; }
          const expected = aliases[column.type] || column.type;
          if (actual.udt_name !== expected) failures.push("Tipo incompatible: " + key);
          if (column.length && Number(column.length) !== actual.character_maximum_length)
            failures.push("Longitud incompatible: " + key);
          if ((actual.is_nullable === "YES") !== column.isNullable) failures.push("Nulabilidad incompatible: " + key);
        }
      }
      const constraints = await manager.query(
        "SELECT c.relname AS tabla,t.conname AS nombre,t.contype AS tipo,pg_get_constraintdef(t.oid) AS definicion FROM pg_constraint t JOIN pg_class c ON c.oid=t.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) ORDER BY c.relname,t.conname",
        ["new_horizons", ["ficha_social", "formulario_area", "expediente"]],
      );
      // La cabecera debe conservar el detalle tipado y la auditoría existente.
      const triggers = await manager.query(
        "SELECT c.relname AS tabla,t.tgname AS nombre,p.proname AS funcion,t.tgenabled AS habilitado FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) AND NOT t.tgisinternal ORDER BY c.relname,t.tgname",
        ["new_horizons", ["ficha_social", "formulario_area"]],
      );
      for (const table of ["ficha_social", "formulario_area"])
        if (!triggers.some(t => t.tabla === table && t.funcion === "auditar" && t.habilitado !== "D"))
          failures.push("Falta auditoría activa: " + table);
      return { fecha: new Date().toISOString(), checked, failures, columns, constraints, triggers };
    });
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync("test-results/social-schema.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ columnasVerificadas: report.checked, diferencias: report.failures, restricciones: report.constraints, triggers: report.triggers }, null, 2));
    if (report.failures.length) process.exitCode = 1;
  } finally { if (data.isInitialized) await data.destroy(); }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });

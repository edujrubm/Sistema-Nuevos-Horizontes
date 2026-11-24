const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { createHash, randomUUID } = require("node:crypto");
const { Client } = require("pg");
const manifest = require("../database/migrations/manifest.json");

function configuracion(database = process.env.LEGAL_TEST_DATABASE) {
  assert.equal(process.env.LEGAL_TEST_HOST, "127.0.0.1");
  assert.match(database, /^legal_orm_test_[a-f0-9]+$/);
  return {
    host: "127.0.0.1",
    port: Number(process.env.LEGAL_TEST_PORT),
    database,
    user: process.env.LEGAL_TEST_USER,
    password: process.env.LEGAL_TEST_PASSWORD,
  };
}

function aplicar(database, sql) {
  const config = configuracion(database);
  const bin = path.join(
    process.env.QA_POSTGRES_BIN || "C:/Program Files/PostgreSQL/18/bin",
    "psql.exe",
  );
  const archivo = path.resolve(
    "test-results",
    `actualizacion-${randomUUID()}.sql`,
  );
  fs.writeFileSync(archivo, sql);
  try {
    execFileSync(
      bin,
      [
        "-h",
        config.host,
        "-p",
        String(config.port),
        "-U",
        config.user,
        "-d",
        database,
        "-v",
        "ON_ERROR_STOP=1",
        "-q",
        "-f",
        archivo,
      ],
      {
        env: { ...process.env, PGPASSWORD: config.password },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } finally {
    fs.unlinkSync(archivo);
  }
}

async function datos(client) {
  const tablas = (
    await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='new_horizons' ORDER BY tablename",
    )
  ).rows;
  const result = {};
  for (const { tablename } of tablas) {
    const identificador = '"' + tablename.replaceAll('"', '""') + '"';
    result[tablename] = (
      await client.query(
        `SELECT to_jsonb(t) AS fila FROM new_horizons.${identificador} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows.map((r) => r.fila);
  }
  return result;
}

async function estructura(client) {
  const consultas = {
    columnas: `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema='new_horizons' ORDER BY table_name,column_name`,
    restricciones: `SELECT r.relname,c.conname,pg_get_constraintdef(c.oid) AS definicion
      FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=c.connamespace
      WHERE n.nspname='new_horizons' ORDER BY r.relname,c.conname`,
    indices: `SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='new_horizons' ORDER BY tablename,indexname`,
    disparadores: `SELECT r.relname,t.tgname,pg_get_triggerdef(t.oid) AS definicion FROM pg_trigger t
      JOIN pg_class r ON r.oid=t.tgrelid JOIN pg_namespace n ON n.oid=r.relnamespace
      WHERE n.nspname='new_horizons' AND NOT t.tgisinternal ORDER BY r.relname,t.tgname`,
    funciones: `SELECT p.proname,pg_get_functiondef(p.oid) AS definicion FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='new_horizons' ORDER BY p.proname,p.proargtypes::text`,
  };
  const resultado = {};
  // Un único cliente PostgreSQL ejecuta consultas de forma secuencial.
  for (const [nombre, sql] of Object.entries(consultas))
    resultado[nombre] = (await client.query(sql)).rows;
  return resultado;
}

test("Actualización: el esquema histórico se limpia sin alterar datos operativos y coincide con una instalación nueva", async () => {
  const nombre = "legal_orm_test_" + randomUUID().replaceAll("-", "");
  const admin = new Client(configuracion());
  let historica;
  let app;
  const databaseAnterior = process.env.DATABASE_NAME;
  await admin.connect();
  try {
    // Se crea una base propia en el clúster desechable, nunca sobre la base del equipo.
    await admin.query(`CREATE DATABASE ${nombre}`);
    for (const file of [
      "01_new_horizons_postgresql.sql",
      "seed-local.sql",
      "fixture-migracion-test.sql",
      "02_ampliacion_formularios.sql",
    ]) {
      aplicar(nombre, fs.readFileSync("test/fixtures/" + file));
    }
    for (const migracion of manifest.migraciones.filter(
      (m) => !m.archivo.startsWith("024_"),
    )) {
      const anterior = migracion.antecedentes[0] ?? migracion;
      const sql = execFileSync("git", [
        "show",
        `${manifest.base}:database/migrations/${anterior.archivo}`,
      ]);
      assert.equal(
        createHash("sha256").update(sql).digest("hex"),
        anterior.sha256,
      );
      aplicar(nombre, sql);
    }
    aplicar(nombre, fs.readFileSync("test/fixtures/registros-area.sql"));
    historica = new Client(configuracion(nombre));
    await historica.connect();
    await historica.query(`BEGIN;
      SELECT set_config('new_horizons.actor_id','1',true),set_config('new_horizons.motivo','Ensayo de actualización',true);
      INSERT INTO new_horizons.documento_area(formulario_id,categoria,objeto_privado,mime,tamano_bytes,sha256,version_documento,cargado_por)
      SELECT id,'Documento histórico ficticio','qa-sin-archivo','application/pdf',100,repeat('a',64),1,1 FROM new_horizons.formulario_area WHERE tipo='LEGAL' LIMIT 1;
      UPDATE new_horizons.documento_area SET estado_revision_codigo='REVISADO',revisado_por=1,revisado_en='2026-11-18T12:00:00Z';
      COMMIT;`);
    // La misma API debe atender antes y después de retirar las columnas antiguas.
    process.env.DATABASE_NAME = nombre;
    const { NestFactory } = require("@nestjs/core");
    const { AppModule } = require("../dist/app.module");
    const {
      configurarTransporteApi,
    } = require("../dist/common/errors/transporte");
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix("api");
    configurarTransporteApi(app);
    await app.listen(0, "127.0.0.1");
    const documento = (
      await historica.query(
        "SELECT id::text FROM new_horizons.documento_area LIMIT 1",
      )
    ).rows[0];
    const endpoint =
      (await app.getUrl()) + "/api/v1/documentos/" + documento.id;
    const respuestaAnterior = await fetch(endpoint);
    assert.equal(respuestaAnterior.status, 200);
    const publicoAnterior = await respuestaAnterior.json();
    assert.equal(publicoAnterior.estado, "VIGENTE");
    assert.ok(!Object.hasOwn(publicoAnterior, "estadoRevisionCodigo"));
    const antes = await datos(historica);
    aplicar(
      nombre,
      fs.readFileSync(
        "database/migrations/024_retirar_revision_documental.sql",
      ),
    );
    const despues = await datos(historica);
    const respuestaActual = await fetch(endpoint);
    assert.equal(respuestaActual.status, 200);
    assert.deepEqual(await respuestaActual.json(), publicoAnterior);
    const archivo = despues.archivo_revision_documental;
    assert.equal(
      archivo.length,
      antes.documento_area.length + antes.estado_revision_documento.length,
    );
    for (const d of antes.documento_area) {
      const guardado = archivo.find(
        (a) => a.origen === "documento:" + d.id,
      ).datos;
      assert.equal(guardado.estado_revision_codigo, d.estado_revision_codigo);
      assert.equal(guardado.revisado_por, String(d.revisado_por));
      assert.equal(
        new Date(guardado.revisado_en).toISOString(),
        new Date(d.revisado_en).toISOString(),
      );
      delete d.estado_revision_codigo;
      delete d.revisado_por;
      delete d.revisado_en;
    }
    delete antes.estado_revision_documento;
    delete despues.archivo_revision_documental;
    assert.deepEqual(
      despues,
      antes,
      "La limpieza alteró datos de otro módulo, auditoría o versiones",
    );
    assert.deepEqual(
      await estructura(historica),
      await estructura(admin),
      "Instalación nueva y actualización difieren",
    );
  } finally {
    if (app) await app.close();
    if (databaseAnterior === undefined) delete process.env.DATABASE_NAME;
    else process.env.DATABASE_NAME = databaseAnterior;
    if (historica) await historica.end();
    await admin.query(`DROP DATABASE IF EXISTS ${nombre}`);
    await admin.end();
  }
});

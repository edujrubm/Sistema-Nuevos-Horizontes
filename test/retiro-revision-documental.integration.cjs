const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { Client } = require("pg");
const { randomUUID } = require("node:crypto");

// Sólo el PostgreSQL desechable del ejecutor de áreas; nunca una base compartida.
async function escenario(bloqueado) {
  assert.equal(process.env.LEGAL_TEST_HOST, "127.0.0.1");
  assert.match(process.env.LEGAL_TEST_DATABASE, /^legal_orm_test_[a-f0-9]+$/);
  const client = new Client({
    host: process.env.LEGAL_TEST_HOST,
    port: Number(process.env.LEGAL_TEST_PORT),
    database: process.env.LEGAL_TEST_DATABASE,
    user: process.env.LEGAL_TEST_USER,
    password: process.env.LEGAL_TEST_PASSWORD,
  });
  const schema = "revision_qa_" + randomUUID().replaceAll("-", "");
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${schema};
      CREATE TABLE ${schema}.estado_revision_documento(codigo text PRIMARY KEY, descripcion text NOT NULL);
      INSERT INTO ${schema}.estado_revision_documento VALUES ('BORRADOR','Sin revisión'),('REVISADO','Revisado');
      CREATE TABLE ${schema}.documento_area(id bigint PRIMARY KEY, sha256 text, version_registro integer,
        estado_revision_codigo text REFERENCES ${schema}.estado_revision_documento,
        revisado_por bigint, revisado_en timestamptz,
        CONSTRAINT ck_revision_documental CHECK ((estado_revision_codigo='BORRADOR' AND revisado_por IS NULL AND revisado_en IS NULL)
          OR (estado_revision_codigo='REVISADO' AND revisado_por IS NOT NULL AND revisado_en IS NOT NULL)));
      CREATE INDEX ix_documento_form_revision ON ${schema}.documento_area(estado_revision_codigo);
      INSERT INTO ${schema}.documento_area VALUES
        (1,'contenido-conservado',3,'REVISADO',67,'2026-11-18T12:00:00Z'),
        (2,'otro-contenido',1,'BORRADOR',NULL,NULL);`);
    const sql = fs
      .readFileSync(
        "database/migrations/024_retirar_revision_documental.sql",
        "utf8",
      )
      .replaceAll("new_horizons.", schema + ".");
    if (bloqueado) {
      await client.query(
        `CREATE VIEW ${schema}.consumidor_externo AS SELECT revisado_por FROM ${schema}.documento_area`,
      );
      await assert.rejects(
        client.query(sql),
        (error) => error.code === "2BP01",
      );
      await client.query("ROLLBACK");
      assert.equal(
        (
          await client.query(
            `SELECT revisado_por::text FROM ${schema}.documento_area WHERE id=1`,
          )
        ).rows[0].revisado_por,
        "67",
      );
      assert.equal(
        (
          await client.query("SELECT to_regclass($1) AS archivo", [
            schema + ".archivo_revision_documental",
          ])
        ).rows[0].archivo,
        null,
      );
    } else {
      await client.query(sql);
      const { rows } = await client.query(
        `SELECT origen,datos FROM ${schema}.archivo_revision_documental ORDER BY origen`,
      );
      assert.equal(rows.length, 4);
      const revisado = rows.find((r) => r.origen === "documento:1").datos;
      assert.equal(revisado.estado_revision_codigo, "REVISADO");
      assert.equal(revisado.revisado_por, "67");
      assert.equal(
        new Date(revisado.revisado_en).toISOString(),
        "2026-11-18T12:00:00.000Z",
      );
      assert.equal(
        rows.find((r) => r.origen === "documento:2").datos.revisado_por,
        null,
      );
      const columnas = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2",
        [schema, "documento_area"],
      );
      assert.deepEqual(columnas.rows.map((r) => r.column_name).sort(), [
        "id",
        "sha256",
        "version_registro",
      ]);
      assert.deepEqual(
        (
          await client.query(
            `SELECT id::text,sha256,version_registro FROM ${schema}.documento_area ORDER BY id`,
          )
        ).rows,
        [
          { id: "1", sha256: "contenido-conservado", version_registro: 3 },
          { id: "2", sha256: "otro-contenido", version_registro: 1 },
        ],
      );
      assert.equal(
        (
          await client.query("SELECT to_regclass($1) AS catalogo", [
            schema + ".estado_revision_documento",
          ])
        ).rows[0].catalogo,
        null,
      );
    }
  } finally {
    await client.query("ROLLBACK");
    // El nombre se genera aquí y sólo contiene el prefijo de QA y un UUID hexadecimal.
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await client.end();
  }
}
test("Retiro documental: archiva revisión y catálogo sin perder contenido ni versiones", () =>
  escenario(false));
test("Retiro documental: revierte todo ante una dependencia externa desconocida", () =>
  escenario(true));

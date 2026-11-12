const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DataSource } = require("typeorm");
const { LegalRepository } = require("../dist/modules/formularios/legal/repositories/legal.repository");
const { FormularioAreaEntity } = require("../dist/modules/formularios/shared/entities/formulario-area.entity");
const { FichaLegal } = require("../dist/modules/formularios/legal/entities/ficha-legal.entity");
const { ReferenciaLegal } = require("../dist/modules/formularios/legal/entities/referencia-legal.entity");
const { ExpedienteEntity } = require("../dist/modules/beneficiarias/entities/expediente.entity");

let database, repository, app, baseUrl;
const statements = [];
before(async () => {
  // Exige un destino explícito: nunca hereda credenciales del entorno compartido.
  assert.equal(process.env.LEGAL_TEST_HOST, "127.0.0.1");
  assert.ok(process.env.LEGAL_TEST_PORT);
  assert.ok(process.env.LEGAL_TEST_DATABASE);
  assert.match(process.env.LEGAL_TEST_DATABASE, /^legal_orm_test_/);
  database = new DataSource({
    type: "postgres",
    host: process.env.LEGAL_TEST_HOST,
    port: Number(process.env.LEGAL_TEST_PORT),
    database: process.env.LEGAL_TEST_DATABASE,
    username: process.env.LEGAL_TEST_USER,
    password: process.env.LEGAL_TEST_PASSWORD,
    entities: [FormularioAreaEntity, FichaLegal, ReferenciaLegal, ExpedienteEntity],
    synchronize: false,
    migrationsRun: false,
    logging: ["query"],
    logger: {
      logQuery: (query) => statements.push(query),
      logQueryError() {}, logQuerySlow() {}, logSchemaBuild() {},
      logMigration() {}, log() {},
    },
  });
  await database.initialize();
  repository = new LegalRepository(database);
  Object.assign(process.env, {
    NODE_ENV: "test", DATABASE_HOST: process.env.LEGAL_TEST_HOST,
    DATABASE_PORT: process.env.LEGAL_TEST_PORT,
    DATABASE_NAME: process.env.LEGAL_TEST_DATABASE,
    DATABASE_USER: process.env.LEGAL_TEST_USER,
    DATABASE_PASSWORD: process.env.LEGAL_TEST_PASSWORD,
    DATABASE_SSL: "false", P3_TEST_AREA: "Legal",
    P3_TEST_ACTOR_ID: "1", P3_DRAFT_STATE: "P3_BORRADOR",
    P3_CONFIRMED_STATE: "P3_CONFIRMADO",
  });
  const { NestFactory } = require("@nestjs/core");
  const { AppModule } = require("../dist/app.module");
  const { configurarTransporteApi } = require("../dist/common/errors/transporte");
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  configurarTransporteApi(app);
  await app.listen(0, "127.0.0.1");
  baseUrl = await app.getUrl();
  const fixture = await fetch(baseUrl + "/api/v1/legal/beneficiarias/100/referencias", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1",
      detalle: { destino: "Institución sintética", motivoReferencia: "Ensayo ORM" },
    }),
  });
  assert.equal(fixture.status, 201, await fixture.text());
});
after(async () => {
  if (app) await app.close();
  if (database?.isInitialized) await database.destroy();
});

test("Legal: listado tipado conserva identificadores bigint como texto", async () => {
  const result = await repository.list("100", "LEGAL", 1, 20);
  assert.ok(result.total > 0, "Preparar la ficha Legal sintética del expediente 100");
  assert.equal(result.datos.length, Math.min(result.total, 20));
  for (const row of result.datos) {
    assert.equal(row.tipo, "LEGAL");
    for (const key of ["id", "expedienteId", "areaId", "profesionalId", "capturadoPor"])
      assert.equal(typeof row[key], "string");
    assert.ok(Object.hasOwn(row.detalle, "diagnosticoJuridico"));
    assert.equal(Object.hasOwn(row.detalle, "formularioId"), false);
  }
});
test("Legal: página vacía conserva el total", async () => {
  const first = await repository.list("100", "LEGAL", 1, 1);
  const last = await repository.list("100", "LEGAL", first.total + 1, 1);
  assert.deepEqual(last.datos, []);
  assert.equal(last.total, first.total);
});
test("Legal: referencias no se mezclan con fichas legales", async () => {
  const result = await repository.list("100", "REFERENCIA_LEGAL", 1, 20);
  for (const row of result.datos) {
    assert.equal(row.tipo, "REFERENCIA_LEGAL");
    assert.ok(Object.hasOwn(row.detalle, "destino"));
  }
});
test("Legal: expediente inexistente y ausencia de función SQL auxiliar", async () => {
  await assert.rejects(repository.list("9223372036854775807", "LEGAL", 1, 20),
    (error) => error.codigo === "REGISTRO_NO_ENCONTRADO");
  assert.ok(statements.length > 0);
  assert.equal(statements.some((sql) => sql.includes("local_json_seguro")), false);
});
test("Legal HTTP: ambas rutas conservan contrato, total e identificadores", async () => {
  for (const path of ["fichas", "referencias"]) {
    const response = await fetch(baseUrl + "/api/v1/legal/beneficiarias/100/" + path);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["datos", "limite", "pagina", "total"]);
    assert.equal(body.pagina, 1);
    assert.equal(typeof body.total, "number");
    if (body.datos.length) assert.equal(typeof body.datos[0].id, "string");
  }
});
test("Legal HTTP: IDs inválidos, inexistentes y paginación mantienen errores comunes", async () => {
  for (const [suffix, status] of [
    ["letras/fichas", 400],
    ["9223372036854775807/fichas", 404],
    ["100/fichas?limite=101", 400],
  ]) {
    const response = await fetch(baseUrl + "/api/v1/legal/beneficiarias/" + suffix);
    assert.equal(response.status, status);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["codigo", "errores", "estado", "idSolicitud", "mensaje"]);
    assert.equal(body.estado, status);
  }
});
test("Legal: consulta individual ORM coincide con el listado y rechaza otro tipo", async () => {
  const refs = await repository.list("100", "REFERENCIA_LEGAL", 1, 20);
  assert.ok(refs.datos.length > 0, "Preparar una referencia Legal sintética");
  const first = refs.datos[0];
  const detail = await repository.reference(first.id);
  assert.equal(detail.beneficiariaId, "100");
  assert.equal(detail.id, first.id);
  assert.deepEqual(detail.detalle, first.detalle);
  const response = await fetch(baseUrl + "/api/v1/legal/referencias/" + first.id);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).beneficiariaId, "100");
  const legal = await repository.list("100", "LEGAL", 1, 20);
  const wrong = await fetch(baseUrl + "/api/v1/legal/referencias/" + legal.datos[0].id);
  assert.equal(wrong.status, 404);
});

async function request(method, path, body, status) {
  const response = await fetch(baseUrl + "/api/v1" + path, {
    method, headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  return value;
}
async function createReference(detail = { destino: "Entidad sintética", motivoReferencia: "Prueba ORM" }) {
  return request("POST", "/legal/beneficiarias/100/referencias", {
    fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1", detalle: detail,
  }, 201);
}
test("Legal ORM: edición, confirmación y corrección conservan versiones y auditoría", async () => {
  let reference = await createReference();
  const path = "/legal/referencias/" + reference.id;
  const version = reference.version;
  reference = await request("PATCH", path, {
    version, motivo: "Corrección sintética", detalle: { recomendaciones: "Revisar antecedentes" },
  }, 200);
  assert.ok(reference.version > version);
  await request("PATCH", path, { version, motivo: "Versión antigua", detalle: { destino: "No guardar" } }, 409);
  reference = await request("POST", path + "/confirmar", { version: reference.version, motivo: "Confirmación sintética" }, 201);
  assert.equal(reference.estadoCodigo, "P3_CONFIRMADO");
  reference = await request("PATCH", path, {
    version: reference.version, motivo: "Corrección posterior", detalle: { origen: "Institución de origen sintética" },
  }, 200);
  assert.equal(reference.detalle.origen, "Institución de origen sintética");
  const history = await database.query(
    "SELECT actor_id, motivo FROM new_horizons.revision_registro WHERE tabla='referencia_legal' AND registro_id=$1",
    [reference.id],
  );
  assert.ok(history.some((row) => row.actor_id === "1" && row.motivo === "Corrección posterior"));
});
test("Legal ORM: confirmación incompleta y FK inválida revierten cambios", async () => {
  const reference = await createReference({});
  await request("POST", "/legal/referencias/" + reference.id + "/confirmar", {
    version: reference.version, motivo: "Intento incompleto",
  }, 400);
  assert.equal((await repository.reference(reference.id)).version, reference.version);
  const count = await repository.list("100", "REFERENCIA_LEGAL", 1, 100);
  await request("POST", "/legal/beneficiarias/100/referencias", {
    fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "9223372036854775807", detalle: {},
  }, 409);
  assert.equal((await repository.list("100", "REFERENCIA_LEGAL", 1, 100)).total, count.total);
});
test("Legal ORM: dos escrituras simultáneas no sobrescriben la misma versión", async () => {
  const reference = await createReference();
  const responses = await Promise.all(["Primera", "Segunda"].map((origen) =>
    fetch(baseUrl + "/api/v1/legal/referencias/" + reference.id, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: reference.version, motivo: "Prueba concurrente", detalle: { origen } }),
    })));
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
});

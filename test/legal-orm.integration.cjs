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
  });
  const { NestFactory } = require("@nestjs/core");
  const { AppModule } = require("../dist/app.module");
  const { configurarTransporteApi } = require("../dist/common/errors/transporte");
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  configurarTransporteApi(app);
  await app.listen(0, "127.0.0.1");
  baseUrl = await app.getUrl();
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

require("reflect-metadata");
require("ts-node").register({transpileOnly:true});
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DataSource } = require("typeorm");
const { LegalRepository } = require("../src/modules/formularios/legal/repositories/legal.repository");
const { FormularioAreaEntity } = require("../src/modules/formularios/shared/entities/formulario-area.entity");
const { FichaLegal } = require("../src/modules/formularios/legal/entities/ficha-legal.entity");
const { ReferenciaLegal } = require("../src/modules/formularios/legal/entities/referencia-legal.entity");
const { ExpedienteEntity } = require("../src/modules/beneficiarias/entities/expediente.entity");

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
    NODE_ENV: "test",
    DATABASE_HOST: process.env.LEGAL_TEST_HOST,
    DATABASE_PORT: process.env.LEGAL_TEST_PORT,
    DATABASE_NAME: process.env.LEGAL_TEST_DATABASE,
    DATABASE_USER: process.env.LEGAL_TEST_USER,
    DATABASE_PASSWORD: process.env.LEGAL_TEST_PASSWORD,
    DATABASE_SSL: "false",
    FORM_DRAFT_STATE_CODE: "BORRADOR",
    FORM_CONFIRMED_STATE_CODE: "CONFIRMADO",
    FORM_DISCARDED_STATE_CODE: "DESCARTADO",
    AUDIT_ACTOR_USERNAME: "laboratorio-local",
  });
  const { Module } = require("@nestjs/common");
  const { NestFactory } = require("@nestjs/core");
  const { DatabaseModule } = require("../src/database/database.module");
  const { ErroresApiModule } = require("../src/common/errors/errores.module");
  const { LegalModule } = require("../src/modules/formularios/legal/legal.module");
  const { FormularioSharedModule } = require("../src/modules/formularios/shared/formulario-shared.module");
  const { configurarTransporteApi } = require("../src/common/errors/transporte");

  // Usa los módulos reales de Legal y formularios, sin arrancar toda la aplicación.
  class LegalIntegrationModule {}
  Module({
    imports: [
      DatabaseModule,
      ErroresApiModule,
      LegalModule,
      require("../src/modules/documentos/documentos.module").DocumentosModule,
      require("../src/modules/beneficiarias/beneficiarias.module").BeneficiariasModule,
      FormularioSharedModule,
    ],
  })(LegalIntegrationModule);

  app = await NestFactory.create(LegalIntegrationModule, { logger: false });
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
  assert.equal(reference.estadoCodigo, "CONFIRMADO");
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
  }, 400);
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
test("Ficha Legal ORM: crear, reabrir, guardar, confirmar y conservar el detalle", async () => {
  let response = await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1",
    detalle: { demandadoNombreDeclarado: "Parte sintética", diligenciamiento: "Texto de prueba" },
  }, 201);
  let form = response.data;
  assert.equal(form.tipo, "LEGAL");
  assert.equal(typeof form.id, "string");
  assert.equal(form.detalle.diligenciamiento, "Texto de prueba");
  form = (await request("GET", "/formularios-area/" + form.id, undefined, 200)).data;
  response = await request("PATCH", "/formularios-area/" + form.id, {
    version: form.version, motivo: "Guardado sintético", detalle: { juzgado: "Juzgado sintético" },
  }, 200);
  form = response.data;
  assert.equal(form.detalle.juzgado, "Juzgado sintético");
  form = (await request("POST", "/formularios-area/" + form.id + "/confirmar", {
    version: form.version, motivo: "Confirmación sintética",
  }, 201)).data;
  assert.equal(form.estado, "CONFIRMADO");
  await request("PATCH", "/formularios-area/" + form.id, {
    version: form.version, motivo: "No cambiar confirmado", detalle: { juzgado: "No guardar" },
  }, 409);
  const loaded = (await request("GET", "/formularios-area/" + form.id, undefined, 200)).data;
  assert.equal(loaded.detalle.juzgado, "Juzgado sintético");
});
test("Ficha Legal ORM: descarte lógico, pertenencia y versión", async () => {
  let form = (await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1", detalle: {},
  }, 201)).data;
  await request("PATCH", "/formularios-area/" + form.id, {
    version: form.version + 1, motivo: "Versión antigua", detalle: { juzgado: "No guardar" },
  }, 409);
  form = (await request("POST", "/formularios-area/" + form.id + "/descartar", {
    version: form.version, motivo: "Borrador sintético duplicado",
  }, 201)).data;
  assert.equal(form.estado, "DESCARTADO");
  const list = await request("GET", "/beneficiarias/100/formularios-area?tipo=LEGAL", undefined, 200);
  assert.equal(list.data.some((row) => row.id === form.id), false);
  await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", ninoId: "100", fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1", detalle: {},
  }, 400);
  await request("POST", "/beneficiarias/9223372036854775807/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-12T10:00:00-06:00", profesionalId: "1", detalle: {},
  }, 404);
});

test("Ficha Legal: editar solo detalle aumenta version y registra motivo y autor", async () => {
 const initial = (await request("POST", "/beneficiarias/100/formularios-area", {tipo:"LEGAL",fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"1",detalle:{juzgado:"Inicial sintetico"}},201)).data;
 const motive="Correccion sintetica solo detalle";
 const edited=(await request("PATCH","/formularios-area/"+initial.id,{version:initial.version,motivo:motive,detalle:{juzgado:"Corregido sintetico"}},200)).data;
 assert.equal(edited.version,initial.version+1);
 const audits=await database.query("SELECT actor_id::text, motivo, anterior, nuevo FROM new_horizons.revision_registro WHERE tabla='ficha_legal' AND registro_id=$1 AND operacion='UPDATE'",[initial.id]);
 assert.equal(audits.length,1);assert.equal(audits[0].motivo,motive);assert.equal(audits[0].actor_id,"1");assert.equal(audits[0].anterior.juzgado,"Inicial sintetico");assert.equal(audits[0].nuevo.juzgado,"Corregido sintetico");
 const headers=await database.query("SELECT motivo_cambio FROM new_horizons.formulario_area WHERE id=$1",[initial.id]);assert.equal(headers[0].motivo_cambio,motive);
 await request("PATCH","/formularios-area/"+initial.id,{version:initial.version,motivo:"Reintento desactualizado",detalle:{juzgado:"No guardar"}},409);
});
test("Ficha Legal: ediciones simultaneas solo de detalle no se sobrescriben", async () => {
 const initial=(await request("POST","/beneficiarias/100/formularios-area",{tipo:"LEGAL",fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"1",detalle:{}},201)).data;
 const responses=await Promise.all(["A","B"].map(value=>fetch(baseUrl+"/api/v1/formularios-area/"+initial.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:initial.version,motivo:"Edicion simultanea sintetica "+value,detalle:{juzgado:value}})})));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
});

test("Referencia: detalle vacio permite borrador", async()=>{
 const form=await createReference({});assert.equal(form.detalle.destino,null);assert.equal(form.detalle.motivoReferencia,null);
});
test("Referencia: detalle ausente, nulo y campos adicionales son rechazados",async()=>{
 const path="/legal/beneficiarias/100/referencias";
 const base={fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"1"};
 await request("POST",path,base,400);
 await request("POST",path,{...base,detalle:null},400);
 await request("POST",path,{...base,detalle:{formularioId:"100"}},400);
 await request("POST",path,{...base,ninoId:"100",detalle:{}},400);
});
test("Referencia: conserva los cinco campos admitidos",async()=>{
 const detail={destino:"Destino sintetico",origen:"Origen sintetico",motivoReferencia:"Motivo sintetico",recomendaciones:"Recomendaciones sinteticas",medioEntrega:"Medio sintetico"};
 const form=await createReference(detail);assert.deepEqual(form.detalle,detail);
});

async function contarReferenciasYAuditoria() {
 const [counts]=await database.query(`SELECT (SELECT count(*)::text FROM new_horizons.formulario_area) AS cabeceras,(SELECT count(*)::text FROM new_horizons.referencia_legal) AS detalles,(SELECT count(*)::text FROM new_horizons.revision_registro) AS revisiones`);
 return counts;
}
test("Referencia: profesional inexistente devuelve 400 sin registros parciales",async()=>{
 const before=await contarReferenciasYAuditoria();
 const value=await request("POST","/legal/beneficiarias/100/referencias",{fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"9223372036854775807",detalle:{}},400);
 assert.equal(value.codigo,"DATOS_INVALIDOS");
 assert.deepEqual(await contarReferenciasYAuditoria(),before);
});
test("Referencia: expediente inexistente devuelve 404 sin registros parciales",async()=>{
 const before=await contarReferenciasYAuditoria();
 await request("POST","/legal/beneficiarias/9223372036854775807/referencias",{fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"1",detalle:{}},404);
 assert.deepEqual(await contarReferenciasYAuditoria(),before);
});
test("Referencia: estado no configurado revierte la transaccion",async()=>{
 const before=await contarReferenciasYAuditoria();
 const repo=new LegalRepository(app.get(DataSource));
 await assert.rejects(repo.createReference("100",{fechaAtencion:"2026-11-12T10:00:00-06:00",profesionalId:"1",detalle:{}},"ESTADO_SINTETICO_INEXISTENTE"),error=>error.codigo==="CONFIGURACION_INCOMPLETA");
 assert.deepEqual(await contarReferenciasYAuditoria(),before);
});



test("Legal: la aplicación de prueba registra únicamente Legal y sus dependencias de prueba", () => {
  const { ModulesContainer } = require("@nestjs/core");
  const modules = app.get(ModulesContainer);
  const controllers = [...modules.values()].flatMap((module) =>
    [...module.controllers.values()].map((controller) => controller.metatype.name),
  );
  assert.deepEqual(controllers.sort(), [
    "BeneficiariasController",
    "DocumentosController",
    "FormularioSharedController",
    "LegalController",
  ]);
});


function ejecutarVerificadorLegal(variables = {}) {
  const { spawnSync } = require("node:child_process");
  const path = require("node:path");
  return spawnSync(process.execPath, ["scripts/check-legal-schema.cjs"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, LEGAL_SCHEMA_SOURCE:"true", ...variables },
    encoding: "utf8",
    timeout: 30000,
  });
}

test("Verificador Legal: valida el esquema local sin modificar registros", async () => {
  const antes = await contarReferenciasYAuditoria();
  const resultado = ejecutarVerificadorLegal();
  assert.equal(resultado.status, 0, resultado.stderr);
  assert.match(resultado.stdout, /comprobados en lectura/);
  assert.deepEqual(await contarReferenciasYAuditoria(), antes);
});

test("Verificador Legal: rechaza un usuario técnico inexistente", async () => {
  const antes = await contarReferenciasYAuditoria();
  const resultado = ejecutarVerificadorLegal({
    AUDIT_ACTOR_USERNAME: "usuario_sintetico_inexistente",
  });
  assert.equal(resultado.status, 1, resultado.stderr);
  assert.match(resultado.stderr, /No existe el usuario configurado/);
  assert.deepEqual(await contarReferenciasYAuditoria(), antes);
});

test("Verificador Legal: detecta un estado configurado ausente del catálogo", async () => {
  const resultado = ejecutarVerificadorLegal({
    FORM_CONFIRMED_STATE_CODE: "ESTADO_SINTETICO_INEXISTENTE",
  });
  assert.equal(resultado.status, 1, resultado.stderr);
  assert.match(resultado.stderr, /Estado no disponible/);
});


test("Motor compartido: sin el área registrada no omite la validación de referencias", async () => {
  const referencia = await createReference({});
  const antes = await contarReferenciasYAuditoria();
  const { Module } = require("@nestjs/common");
  const { NestFactory } = require("@nestjs/core");
  const { DatabaseModule } = require("../src/database/database.module");
  const { ErroresApiModule } = require("../src/common/errors/errores.module");
  const { FormularioSharedModule } = require("../src/modules/formularios/shared/formulario-shared.module");
  const { configurarTransporteApi } = require("../src/common/errors/transporte");
  class MotorSinAreaModule {}
  Module({ imports: [DatabaseModule, ErroresApiModule, FormularioSharedModule] })(MotorSinAreaModule);
  const motor = await NestFactory.create(MotorSinAreaModule, { logger: false });
  try {
    motor.setGlobalPrefix("api");
    configurarTransporteApi(motor);
    await motor.listen(0, "127.0.0.1");
    const response = await fetch((await motor.getUrl()) + "/api/v1/formularios-area/" + referencia.id + "/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: referencia.version, motivo: "Confirmación sin política registrada" }),
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).codigo, "CONFIGURACION_INCOMPLETA");
    assert.deepEqual(await contarReferenciasYAuditoria(), antes);
    const guardada = await repository.reference(referencia.id);
    assert.equal(guardada.version, referencia.version);
    assert.equal(guardada.estadoCodigo, referencia.estadoCodigo);
  } finally {
    await motor.close();
  }
});


test("Ficha Legal: profesional inexistente identifica el campo y no guarda registros", async () => {
  const antes = await contarReferenciasYAuditoria();
  const error = await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-13T10:00:00-06:00",
    profesionalId: "99999", detalle: {},
  }, 400);
  assert.equal(error.codigo, "DATOS_INVALIDOS");
  assert.equal(error.errores[0].campo, "profesionalId");
  assert.deepEqual(await contarReferenciasYAuditoria(), antes);
});

test("Ficha Legal: errores de detalle incluyen todos los campos sin exponer valores", async () => {
  const error = await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-13T10:00:00-06:00",
    profesionalId: "1", detalle: { inicioProcesoFecha: "2026-02-31", juzgado: 123 },
  }, 400);
  assert.deepEqual(error.errores.map((e) => e.campo), ["detalle.inicioProcesoFecha", "detalle.juzgado"]);
  assert.ok(error.errores.every((e) => Object.keys(e).sort().join() === "campo,mensaje"));
});

test("Ficha Legal: el profesional sintético 67 permite crear y conservar el responsable", async () => {
  const form = (await request("POST", "/beneficiarias/100/formularios-area", {
    tipo: "LEGAL", fechaAtencion: "2026-11-13T10:00:00-06:00",
    profesionalId: "67", detalle: { juzgado: "Juzgado sintético" },
  }, 201)).data;
  assert.equal(form.profesionalId, "67");
  const loaded = (await request("GET", "/formularios-area/" + form.id, undefined, 200)).data;
  assert.equal(loaded.profesionalId, "67");
});

test("Ficha Legal: identificadores profesionales fuera de bigint se señalan antes de consultar", async () => {
  for (const profesionalId of ["0", "9223372036854775808"]) {
    const error = await request("POST", "/beneficiarias/100/formularios-area", {
      tipo: "LEGAL", fechaAtencion: "2026-11-13T10:00:00-06:00", profesionalId, detalle: {},
    }, 400);
    assert.ok(error.errores.some((e) => e.campo === "profesionalId"));
  }
});

test("Legal PDF: carga, persistencia, descarga y versiones sin cruzar caso",async()=>{
 const form=(await request("POST","/beneficiarias/100/formularios-area",{tipo:"LEGAL",fechaAtencion:"2026-11-13T10:00:00-06:00",profesionalId:"67",detalle:{juzgado:"Juzgado ficticio PDF"}},201)).data;
 const {PDFDocument}=require("pdf-lib");const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
 async function upload(extra={},beneficiaria="100",contenido=bytes){const body=new FormData();body.set("formularioId",form.id);body.set("categoria","Constancia");for(const [k,v] of Object.entries(extra))body.set(k,v);body.set("archivo",new Blob([contenido],{type:"application/pdf"}),"ensayo.pdf");const response=await fetch(baseUrl+`/api/v1/beneficiarias/${beneficiaria}/documentos/cargas`,{method:"POST",body});return {status:response.status,body:await response.json()};}
 const first=await upload();assert.equal(first.status,201,JSON.stringify(first.body));const doc=first.body.data??first.body;assert.equal(doc.formularioId,form.id);
 assert.equal(doc.sha256,require("node:crypto").createHash("sha256").update(bytes).digest("hex"));assert.ok(!Object.hasOwn(doc,"objetoPrivado"));
 const file=await fetch(baseUrl+"/api/v1/documentos/"+doc.id+"/archivo");assert.equal(file.status,200);assert.deepEqual(Buffer.from(await file.arrayBuffer()),Buffer.from(bytes));
 const second=await upload({documentoAnteriorId:doc.id,motivoCambio:"Actualización ficticia"});assert.equal(second.status,201,JSON.stringify(second.body));assert.equal((second.body.data??second.body).versionDocumento,2);
 const foreign=await upload({},"200");assert.ok(foreign.status>=400&&foreign.status<500);
 const invalid=await upload({},"100",Buffer.from("No es PDF"));assert.ok(invalid.status>=400&&invalid.status<500);
});

test("Legal React: creación, reapertura, edición y confirmación con HTTP real",{timeout:90000},async()=>{
 const {spawn}=require("node:child_process");
 const result=await new Promise((resolve,reject)=>{
 const child=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c","pnpm --dir frontend exec vitest run src/modules/legal/legal.live.test.tsx --config vite.config.ts"],{env:{...process.env,LEGAL_LIVE_API:baseUrl+"/api/v1",VITE_API_BASE_URL:baseUrl+"/api/v1"},windowsHide:true});
 let output="";child.stdout.on("data",d=>output+=d);child.stderr.on("data",d=>output+=d);child.on("error",reject);child.on("close",code=>resolve({code,output}));
 });require("node:fs").mkdirSync("test-results/qa",{recursive:true});require("node:fs").writeFileSync("test-results/qa/legal-react-http.log",result.output);assert.equal(result.code,0,result.output);
});

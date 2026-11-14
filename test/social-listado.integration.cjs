require("reflect-metadata");
require("ts-node").register({transpileOnly:true});
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DataSource } = require("typeorm");
const { SocialRepository } = require("../src/modules/formularios/social/repositories/social.repository");
const { FichaSocial } = require("../src/modules/formularios/social/entities/ficha-social.entity");
const { FormularioAreaEntity } = require("../src/modules/formularios/shared/entities/formulario-area.entity");
const { ExpedienteEntity } = require("../src/modules/beneficiarias/entities/expediente.entity");
const { BeneficiariaEntity } = require("../src/modules/beneficiarias/entities/beneficiaria.entity");
const { AreaFormularioEntity, EstadoFormularioEntity, ProfesionalFormularioEntity } = require("../src/modules/formularios/shared/entities/formulario-catalogos.entity");
const { TipoFormularioEntity } = require("../src/modules/formularios/shared/entities/tipo-formulario.entity");
let data, repository, app, url;

before(async () => {
  assert.equal(process.env.SOCIAL_TEST_HOST, "127.0.0.1");
  assert.match(process.env.SOCIAL_TEST_DATABASE || "", /^social_orm_test_[a-f0-9]+$/);
  data = new DataSource({
    type: "postgres", host: process.env.SOCIAL_TEST_HOST,
    port: Number(process.env.SOCIAL_TEST_PORT), database: process.env.SOCIAL_TEST_DATABASE,
    username: process.env.SOCIAL_TEST_USER, password: process.env.SOCIAL_TEST_PASSWORD,
    entities: [FichaSocial, FormularioAreaEntity, ExpedienteEntity, BeneficiariaEntity,
      AreaFormularioEntity, EstadoFormularioEntity, ProfesionalFormularioEntity, TipoFormularioEntity],
    synchronize: false, migrationsRun: false,
  });
  await data.initialize();
  repository = new SocialRepository(data);
  const { Module } = require("@nestjs/common");
  const { NestFactory } = require("@nestjs/core");
  const { DatabaseModule } = require("../src/database/database.module");
  const { SocialModule } = require("../src/modules/formularios/social/social.module");
  const { ErroresApiModule } = require("../src/common/errors/errores.module");
  const { FormularioSharedModule } = require("../src/modules/formularios/shared/formulario-shared.module");
  const { configurarTransporteApi } = require("../src/common/errors/transporte");
  class SocialIntegrationModule {}
  Module({ imports: [DatabaseModule, ErroresApiModule, SocialModule, FormularioSharedModule, require("../src/modules/documentos/documentos.module").DocumentosModule, require("../src/modules/beneficiarias/beneficiarias.module").BeneficiariasModule] })(SocialIntegrationModule);
  app = await NestFactory.create(SocialIntegrationModule, { logger: false });
  app.setGlobalPrefix("api");
  configurarTransporteApi(app);
  await app.listen(0, "127.0.0.1");
  url = await app.getUrl();
});
after(async () => {
  if (app) await app.close();
  if (data?.isInitialized) await data.destroy();
});

test("Listado Social: mantiene respuesta, detalle y precisión de identificadores", async () => {
  const page = await repository.listar("100", 1, 2);
  assert.deepEqual(Object.keys(page).sort(), ["datos", "limite", "pagina", "total"]);
  assert.equal(page.total, 3);
  assert.equal(page.datos.length, 2);
  for (const form of page.datos) {
    assert.equal(form.tipo, "SOCIAL");
    assert.equal(typeof form.id, "string");
    assert.equal(typeof form.profesionalId, "string");
    assert.equal(form.detalle.fechaRevision, "2026-11-20");
    assert.ok(!("formularioId" in form.detalle));
  }
});
test("Paginación: ordena por atención y desempata por bigint sin repetir fichas", async () => {
  const a = await repository.listar("100", 1, 2);
  const b = await repository.listar("100", 2, 2);
  const ids = [...a.datos, ...b.datos].map(f => f.id);
  assert.equal(new Set(ids).size, 3);
  assert.equal(a.datos[0].detalle.diagnosticoSocial, "Diagnóstico sintético 1");
  assert.ok(BigInt(a.datos[1].id) > BigInt(b.datos[0].id));
  assert.equal(b.total, 3);
});
test("Expediente existente sin fichas: página vacía con total cero", async () => {
  assert.deepEqual(await repository.listar("300", 1, 20), {
    datos: [], pagina: 1, limite: 20, total: 0,
  });
});
test("Página posterior al final: conserva total y devuelve lista vacía", async () => {
  const page = await repository.listar("100", 9, 2);
  assert.equal(page.total, 3);
  assert.deepEqual(page.datos, []);
});
test("Aislamiento: no mezcla otro expediente ni fichas Legal", async () => {
  const a = await repository.listar("100", 1, 20);
  const b = await repository.listar("200", 1, 20);
  assert.equal(b.total, 1);
  assert.ok(a.datos.every(f => f.expedienteId !== b.datos[0].expedienteId));
  assert.ok(a.datos.every(f => f.tipo === "SOCIAL"));
});
test("Compatibilidad: conserva descartadas en este listado histórico", async () => {
  const page = await repository.listar("100", 1, 20);
  assert.ok(page.datos.some(f => f.estadoCodigo === "DESCARTADO"));
});
test("Expediente inexistente: error público de registro no encontrado", async () => {
  await assert.rejects(repository.listar("999999", 1, 20), error => error.codigo === "REGISTRO_NO_ENCONTRADO");
});
test("HTTP real: ruta pública entrega paginación y fechas serializadas", async () => {
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/100/fichas?pagina=2&limite=2");
  assert.equal(response.status, 200);
  const page = await response.json();
  assert.equal(page.pagina, 2);
  assert.equal(page.limite, 2);
  assert.equal(page.total, 3);
  assert.equal(page.datos.length, 1);
  assert.match(page.datos[0].fechaAtencion, /T/);
});
for (const query of ["pagina=0", "limite=101", "pagina=abc", "limite=0"]) {
  test("HTTP rechaza paginación inválida: " + query, async () => {
    const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/100/fichas?" + query);
    assert.equal(response.status, 400);
  });
}
test("HTTP rechaza identificador fuera de rango", async () => {
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/9223372036854775808/fichas");
  assert.equal(response.status, 400);
});

test("Resumen HTTP conserva contrato, identidad protegida y última ficha", async () => {
  const { SocialResumenRepository } = require("../src/modules/formularios/social/repositories/social-resumen.repository");
  const direct = await app.get(SocialResumenRepository).consultar("100");
  assert.equal(direct.totalFichas, 3);
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/100/resumen");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), [
    "beneficiariaId", "expedienteId", "totalFichas", "ultimaAtencion", "beneficiaria",
    "ultimaFicha", "historialReciente", "camposSinSoporte", "totalRiesgos",
  ].sort());
  assert.equal(body.totalFichas, 3);
  assert.equal(body.beneficiaria.cuiProtegido, "***0123");
  assert.equal(typeof body.beneficiaria.edadCalculada, "number");
  assert.ok(!JSON.stringify(body).includes("1234567890123"));
  assert.equal(body.ultimaFicha.diagnosticoSocial, "Diagnóstico sintético 1");
  assert.equal(body.ultimaFicha.detalle.diagnosticoSocial, "Diagnóstico sintético 1");
  assert.equal(body.ultimaFicha.profesionalNombre, "Empleado sintético");
  assert.equal(body.ultimaAtencion, body.ultimaFicha.fechaAtencion);
  assert.equal(body.totalRiesgos, null);
  assert.deepEqual(body.camposSinSoporte, ["totalRiesgos"]);
});
test("Resumen: solo los cinco seguimientos Social del expediente, ordenados", async () => {
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/100/resumen");
  assert.equal(response.status, 200);
  const { historialReciente } = await response.json();
  assert.equal(historialReciente.length, 5);
  assert.ok(historialReciente.every(e => e.accion.startsWith("Acción sintética")));
  assert.ok(historialReciente.every(e => typeof e.id === "string"));
  for (let i = 1; i < historialReciente.length; i++)
    assert.ok(BigInt(historialReciente[i-1].id) > BigInt(historialReciente[i].id));
});
test("Resumen sin fichas y datos opcionales conserva ausencia real", async () => {
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/300/resumen");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.totalFichas, 0);
  assert.equal(body.ultimaFicha, null);
  assert.equal(body.ultimaAtencion, null);
  assert.deepEqual(body.historialReciente, []);
  assert.equal(body.beneficiaria.cuiProtegido, null);
  assert.equal(body.beneficiaria.edadCalculada, null);
});
test("Resumen de expediente inexistente conserva error 404 en español", async () => {
  const response = await fetch(url + "/api/v1/trabajo-social/beneficiarias/999999/resumen");
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.ok(JSON.stringify(body).includes("REGISTRO_NO_ENCONTRADO"));
});

async function request(path, method, body) {
  const response = await fetch(url + "/api/v1" + path, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
async function crear(detalle = {}) {
  const response = await request("/beneficiarias/100/formularios-area", "POST", {
    tipo: "SOCIAL", fechaAtencion: "2026-11-13T09:00:00-06:00", profesionalId: "1", detalle,
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.data;
}
test("Adaptador SOCIAL registrado en el motor común", () => {
  const { FormularioAdapterRegistry } = require("../src/modules/formularios/shared/formulario-adapter.registry");
  const { SocialFormRepository } = require("../src/modules/formularios/social/repositories/social-form.repository");
  assert.ok(app.get(FormularioAdapterRegistry).obtener("SOCIAL") instanceof SocialFormRepository);
});
test("Crear, recuperar y editar ficha Social con detalle completo y nulos", async () => {
  const form = await crear({ historiaViolencia: "Historia sintética", riesgosIdentificados: "Texto sintético", dependenciaEconomica: false });
  assert.equal(form.tipo, "SOCIAL");
  assert.equal(form.estado, "BORRADOR");
  assert.equal(form.ninoId, null);
  assert.equal(form.detalle.dependenciaEconomica, false);
  const read = await request(`/formularios-area/${form.id}`, "GET");
  assert.equal(read.status, 200);
  assert.equal(read.body.data.detalle.historiaViolencia, "Historia sintética");
  const edit = await request(`/formularios-area/${form.id}`, "PATCH", {
    version: form.version, motivo: "Corrección sintética", profesionalId: "67",
    detalle: { historiaViolencia: null, diagnosticoSocial: "Diagnóstico corregido" },
  });
  assert.equal(edit.status, 200, JSON.stringify(edit.body));
  assert.equal(edit.body.data.detalle.historiaViolencia, null);
  assert.equal(edit.body.data.profesionalId, "67");
  assert.ok(edit.body.data.version > form.version);
});
test("Auditoría de Social conserva creación, corrección, actor, motivo y valores anteriores", async () => {
  const form = await crear({ objetivoGeneral: "Objetivo anterior sintético" });
  const edit = await request(`/formularios-area/${form.id}`, "PATCH", {
    version: form.version, motivo: "Ajuste auditado sintético", detalle: { objetivoGeneral: "Objetivo nuevo sintético" },
  });
  assert.equal(edit.status, 200);
  const rows = await data.query("SELECT operacion,anterior,nuevo,actor_id,motivo FROM new_horizons.revision_registro WHERE tabla=$1 AND registro_id=$2 ORDER BY id", ["ficha_social", form.id]);
  assert.ok(rows.some(row => row.operacion === "INSERT"));
  const correction = rows.find(row => row.operacion === "UPDATE");
  assert.equal(correction.actor_id, "1");
  assert.equal(correction.motivo, "Ajuste auditado sintético");
  assert.equal(correction.anterior.objetivo_general, "Objetivo anterior sintético");
  assert.equal(correction.nuevo.objetivo_general, "Objetivo nuevo sintético");
});
test("Dos ediciones concurrentes con igual versión: solo una persiste", async () => {
  const form = await crear();
  const changes = await Promise.all(["A", "B"].map(label => request(`/formularios-area/${form.id}`, "PATCH", {
    version: form.version, motivo: "Ensayo de concurrencia", detalle: { actividades: label },
  })));
  assert.deepEqual(changes.map(change => change.status).sort(), [200,409]);
  const read = await request(`/formularios-area/${form.id}`, "GET");
  assert.ok(["A","B"].includes(read.body.data.detalle.actividades));
});
test("Confirmar preserva versión, bloquea edición normal y segunda confirmación", async () => {
  const form = await crear({ diagnosticoSocial: "Diagnóstico sintético" });
  const confirm = await request(`/formularios-area/${form.id}/confirmar`, "POST", { version: form.version, motivo: "Confirmación inicial de ficha" });
  assert.equal(confirm.status, 201, JSON.stringify(confirm.body));
  assert.equal(confirm.body.data.estado, "CONFIRMADO");
  assert.ok(confirm.body.data.version > form.version);
  const edit = await request(`/formularios-area/${form.id}`, "PATCH", { version: confirm.body.data.version, motivo: "Intento de edición", detalle: { actividades: "No debe persistir" } });
  assert.equal(edit.status, 409);
  const repeat = await request(`/formularios-area/${form.id}/confirmar`, "POST", { version: confirm.body.data.version, motivo: "Segunda confirmación" });
  assert.equal(repeat.status, 409);
});
test("Descarte lógico conserva detalle y lo excluye del listado común por cursor", async () => {
  const form = await crear({ evaluacion: "Evaluación sintética" });
  const discard = await request(`/formularios-area/${form.id}/descartar`, "POST", { version: form.version, motivo: "Descarte de ensayo" });
  assert.equal(discard.status, 201);
  assert.equal(discard.body.data.estado, "DESCARTADO");
  assert.ok(await data.getRepository(FichaSocial).existsBy({ formularioId: form.id }));
  const list = await request(`/beneficiarias/100/formularios-area?tipo=SOCIAL&cursor=${BigInt(form.id)-1n}&limite=100`, "GET");
  assert.equal(list.status, 200);
  assert.ok(!list.body.data.some(row => row.id === form.id));
});
test("Cursor común: página adicional y filtro de área conservan el contrato", async () => {
  const first = await request("/beneficiarias/100/formularios-area?tipo=SOCIAL&limite=1", "GET");
  assert.equal(first.status, 200);
  assert.equal(first.body.data.length, 1);
  assert.equal(first.body.page.hasMore, true);
  const next = await request(`/beneficiarias/100/formularios-area?tipo=SOCIAL&limite=1&cursor=${first.body.page.nextCursor}`, "GET");
  assert.equal(next.status, 200);
  assert.ok(BigInt(next.body.data[0].id) > BigInt(first.body.data[0].id));
  const wrongArea = await request("/beneficiarias/100/formularios-area?tipo=SOCIAL&areaId=999999", "GET");
  assert.deepEqual(wrongArea.body.data, []);
});
test("Social rechaza niño y profesional inexistente sin crear ficha", async () => {
  const common = { tipo: "SOCIAL", fechaAtencion: "2026-11-13T09:00:00-06:00", profesionalId: "1", detalle: {} };
  const child = await request("/beneficiarias/100/formularios-area", "POST", { ...common, ninoId: "100" });
  assert.equal(child.status, 400);
  const professional = await request("/beneficiarias/100/formularios-area", "POST", { ...common, profesionalId: "999999" });
  assert.equal(professional.status, 400);
  assert.ok(JSON.stringify(professional.body).includes("profesionalId"));
});
test("Detalle Social rechaza exceso bigint y coordinación inexistente por campo", async () => {
  for (const area of ["9223372036854775808", "999999"]) {
    const response = await request("/beneficiarias/100/formularios-area", "POST", {
      tipo: "SOCIAL", fechaAtencion: "2026-11-13T09:00:00-06:00", profesionalId: "1", detalle: { areaCoordinacionId: area },
    });
    assert.equal(response.status, 400);
    assert.ok(JSON.stringify(response.body).includes("detalle.areaCoordinacionId"));
  }
});
test("Cabecera y auditoría revierten si falla la escritura del detalle", async () => {
  const { SocialFormRepository } = require("../src/modules/formularios/social/repositories/social-form.repository");
  const before = await data.getRepository(FormularioAreaEntity).count();
  const [auditBefore] = await data.query("SELECT count(*) AS total FROM new_horizons.revision_registro");
  const broken = new SocialFormRepository({
    transaction: callback => data.transaction(async manager => {
      const original = manager.getRepository.bind(manager);
      manager.getRepository = entity => {
        const repository = original(entity);
        if (entity === FichaSocial) repository.save = async () => { throw new Error("Fallo sintético de detalle"); };
        return repository;
      };
      return callback(manager);
    }),
  });
  await assert.rejects(broken.create("100", { fechaAtencion: "2026-11-13T09:00:00-06:00", profesionalId: "1", detalle: {} },
    { borrador: "BORRADOR", confirmado: "CONFIRMADO", descartado: "DESCARTADO" },
    async manager => {
      await manager.query("SELECT set_config('new_horizons.actor_id','1',true),set_config('new_horizons.motivo','Fallo sintético',true)");
      return { usuarioId: "1" };
    }), /Fallo sintético/);
  assert.equal(await data.getRepository(FormularioAreaEntity).count(), before);
  const [auditAfter] = await data.query("SELECT count(*) AS total FROM new_horizons.revision_registro");
  assert.equal(auditAfter.total, auditBefore.total);
});

test("Social PDF: exige ficha confirmada y conserva contenido y versiones",async()=>{
 const form=await crear();const {PDFDocument}=require("pdf-lib");const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
 const upload=async(extra={},beneficiaria="100",contenido=bytes)=>{const body=new FormData();body.set("formularioId",form.id);body.set("categoria","Ficha firmada");for(const [k,v]of Object.entries(extra))body.set(k,v);body.set("archivo",new Blob([contenido],{type:"application/pdf"}),"social.pdf");const response=await fetch(url+`/api/v1/beneficiarias/${beneficiaria}/documentos/cargas`,{method:"POST",body});return {status:response.status,body:await response.json()};};
 const draft=await upload();assert.ok(draft.status>=400&&draft.status<500);
 const confirm=await request(`/formularios-area/${form.id}/confirmar`,"POST",{version:form.version,motivo:"Confirmación ficticia para PDF"});assert.equal(confirm.status,201);
 const first=await upload();assert.equal(first.status,201,JSON.stringify(first.body));const doc=first.body.data??first.body;assert.equal(doc.formularioId,form.id);
 const file=await fetch(url+"/api/v1/documentos/"+doc.id+"/archivo");assert.equal(file.status,200);assert.deepEqual(Buffer.from(await file.arrayBuffer()),Buffer.from(bytes));
 const second=await upload({documentoAnteriorId:doc.id,motivoCambio:"Corrección ficticia"});assert.equal(second.status,201);assert.equal((second.body.data??second.body).versionDocumento,2);
 const foreign=await upload({},"200");assert.ok(foreign.status>=400&&foreign.status<500);
 const invalid=await upload({},"100",Buffer.from("No es PDF"));assert.ok(invalid.status>=400&&invalid.status<500);
});
test("Social React: creación y confirmación por HTTP real",{timeout:90000},async()=>{
 const {spawn}=require("node:child_process");const result=await new Promise((resolve,reject)=>{
 const child=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c","pnpm --dir frontend exec vitest run src/modules/social/social.live.test.tsx --config vite.config.ts"],{env:{...process.env,SOCIAL_LIVE_API:url+"/api/v1",VITE_API_BASE_URL:url+"/api/v1"},windowsHide:true});let output="";child.stdout.on("data",d=>output+=d);child.stderr.on("data",d=>output+=d);child.on("error",reject);child.on("close",code=>resolve({code,output}));
 });require("node:fs").mkdirSync("test-results/qa",{recursive:true});require("node:fs").writeFileSync("test-results/qa/social-react-http.log",result.output);assert.equal(result.code,0,result.output);
});

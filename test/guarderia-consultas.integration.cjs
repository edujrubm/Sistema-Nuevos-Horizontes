require("reflect-metadata");
require("ts-node").register({ transpileOnly: true });
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { Module } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");
const { DataSource } = require("typeorm");
const { FormularioSharedModule } = require("../src/modules/formularios/shared/formulario-shared.module");
const { GuarderiaModule } = require("../src/modules/formularios/guarderia/guarderia.module");
const { DatabaseModule } = require("../src/database/database.module");
const { BeneficiariasModule } = require("../src/modules/beneficiarias/beneficiarias.module");
const { DocumentosModule } = require("../src/modules/documentos/documentos.module");
const { CatalogosModule } = require("../src/modules/catalogos/catalogos.module");
const { ErroresApiModule } = require("../src/common/errors/errores.module");
const { configurarTransporteApi } = require("../src/common/errors/transporte");
let app, data, url, otrasAreasAntes, perfilMaternoAntes;
before(async () => {
  process.env.AREA_TEST_NOMBRE="Guardería"; process.env.AREA_TEST_ROL="COORDINACION";
  assert.equal(process.env.GUARDERIA_TEST_HOST, "127.0.0.1");
  assert.match(process.env.GUARDERIA_TEST_DATABASE, /^guarderia_orm_test_/);
  data = new DataSource({ type: "postgres", host: process.env.GUARDERIA_TEST_HOST,
    port: Number(process.env.GUARDERIA_TEST_PORT), database: process.env.GUARDERIA_TEST_DATABASE,
    username: process.env.GUARDERIA_TEST_USER, password: process.env.GUARDERIA_TEST_PASSWORD,
    synchronize: false, migrationsRun: false });
  await data.initialize();
  // Solo datos sintéticos del clúster desechable creado por el ejecutor.
  await data.transaction(async manager => {
    await manager.query("SELECT set_config('new_horizons.actor_id','1',true),set_config('new_horizons.motivo','Ensayo de consultas Guardería',true)");
    await manager.query("INSERT INTO new_horizons.nino(nino_id,nombre,expediente_id) SELECT 101,'Hijo sintético sin inscripción',id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=100");
    const [ocupacion]=await manager.query("INSERT INTO new_horizons.ocupacion(nombre) VALUES('Ocupación ficticia QA') RETURNING ocupacion_id AS id");
    const [estado]=await manager.query("INSERT INTO new_horizons.estado_civil(nombre) VALUES('Estado civil ficticio QA') RETURNING estado_civil_id AS id");
    await manager.query("UPDATE new_horizons.beneficiaria SET ocupacion_id=$1,estado_civil_id=$2 WHERE id_beneficiaria=100",[ocupacion.id,estado.id]);

  });
  perfilMaternoAntes=await data.query("SELECT * FROM new_horizons.beneficiaria WHERE id_beneficiaria=100");
  otrasAreasAntes=await data.query("SELECT * FROM new_horizons.formulario_area WHERE tipo <> 'GUARDERIA' ORDER BY id");
  class PruebaGuarderia {}
  Module({ imports: [DatabaseModule, ErroresApiModule, GuarderiaModule, FormularioSharedModule, BeneficiariasModule, CatalogosModule, DocumentosModule] })(PruebaGuarderia);
  app = await NestFactory.create(PruebaGuarderia, { logger: false });
  app.setGlobalPrefix("api"); configurarTransporteApi(app);
  await app.listen(0, "127.0.0.1"); url = await app.getUrl();
});
after(async () => { if (app) await app.close(); if (data?.isInitialized) await data.destroy(); });
async function get(route, status = 200) {
  const response = await fetch(url + "/api/v1" + route);
  const body = await response.json(); assert.equal(response.status, status, JSON.stringify(body)); return body;
}
test("Lista inscritos y no inscritos, sin CUI ni datos de otro expediente", async () => {
  const result = await get("/guarderia/beneficiarias/100/hijos");
  assert.equal(result.total, 2);
  assert.deepEqual(result.datos.map(n => [n.ninoId,n.inscrito]), [["100",true],["101",false]]);
  assert.deepEqual(Object.keys(result.datos[0]).sort(),["ninoId","nombre","fechaNac","expedienteId","inscrito"].sort());
});
test("La página vacía conserva el total del expediente", async () => {
  const result = await get("/guarderia/beneficiarias/100/hijos?pagina=3&limite=1");
  assert.equal(result.total,2); assert.deepEqual(result.datos,[]);
});
test("Solo inscritos abren fichas; inexistentes y otros hijos no obtienen esa ficha", async () => {
  for (const id of ["101","200","999999"]) await get(`/guarderia/hijos/${id}/fichas`,404);
  const result = await get("/guarderia/hijos/100/fichas");
  assert.equal(result.total,1); assert.equal(result.datos[0].ninoId,"100");
  assert.equal(result.datos[0].tipo,"GUARDERIA");
  assert.equal(result.datos[0].detalle.observaciones,"Ficha sintética infantil");
  assert.equal(typeof result.datos[0].id,"string");
  assert.ok(!("formularioId" in result.datos[0].detalle));
});
test("Fichas paginadas conservan total aunque la página no tenga filas", async () => {
  const result = await get("/guarderia/hijos/100/fichas?pagina=2&limite=1");
  assert.equal(result.total,1); assert.deepEqual(result.datos,[]);
});
test("Beneficiaria inexistente e identificadores inválidos respetan errores públicos", async () => {
  await get("/guarderia/beneficiarias/999999/hijos",404);
  for (const id of ["abc","0","9223372036854775808"]) await get(`/guarderia/hijos/${id}/fichas`,400);
  await get("/guarderia/beneficiarias/100/hijos?pagina=0",400);
});
test("La configuración de inscripción es obligatoria", async () => {
  const before=process.env.FORM_CONFIRMED_STATE_CODE;
  delete process.env.FORM_CONFIRMED_STATE_CODE;
  try { assert.equal((await get("/guarderia/hijos/100/fichas",503)).codigo,"CONFIGURACION_INCOMPLETA"); }
  finally { process.env.FORM_CONFIRMED_STATE_CODE=before; }
});

async function enviar(method, route, body, status) {
  const response=await fetch(url+"/api/v1"+route, {method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const result=await response.json();
  assert.equal(response.status,status,JSON.stringify(result));return result;
}
const borrador=(detalle={}, ninoId="101")=>({tipo:"GUARDERIA",ninoId,profesionalId:"1",fechaAtencion:"2026-11-13T10:00:00-06:00",detalle});
let creado;
test("Motor común crea un borrador ORM para el niño y conserva false y null", async()=>{
  creado=(await enviar("POST","/beneficiarias/100/formularios-area",borrador({padeceEnfermedad:false,observaciones:null}),201)).data;
  assert.equal(creado.ninoId,"101"); assert.equal(creado.detalle.padeceEnfermedad,false);
  const loaded=(await get("/formularios-area/"+creado.id)).data;
  assert.equal(loaded.detalle.observaciones,null); assert.equal(loaded.tipo,"GUARDERIA");
  const [row]=await data.query("SELECT identidad_al_atender FROM new_horizons.formulario_area WHERE id=$1",[creado.id]);
  assert.equal(row.identidad_al_atender.tipo,"NINO");assert.equal(row.identidad_al_atender.id,"101");
  await get("/guarderia/hijos/101/fichas",404);
});
test("No admite otro expediente, profesional inexistente o identificadores de catálogo fuera de rango", async()=>{
  await enviar("POST","/beneficiarias/100/formularios-area",borrador({},"200"),400);
  const bad=await enviar("POST","/beneficiarias/100/formularios-area",{...borrador(),profesionalId:"999999"},400);
  assert.ok(bad.errores.some(e=>e.campo==="profesionalId"));
  for(const campo of ["etniaId","escolaridadId"]){
    const invalid=await enviar("POST","/beneficiarias/100/formularios-area",borrador({[campo]:"9223372036854775808"}),400);
    assert.ok(invalid.errores.some(e=>e.campo==="detalle."+campo));
    const missing=await enviar("POST","/beneficiarias/100/formularios-area",borrador({[campo]:"999999"}),400);
    assert.ok(missing.errores.some(e=>e.campo==="detalle."+campo));
  }
});
test("Ediciones simultáneas de la misma versión producen un único ganador auditado", async()=>{
  const result=await Promise.all(["Primera","Segunda"].map(observaciones=>fetch(url+"/api/v1/formularios-area/"+creado.id,{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:creado.version,motivo:"Edición sintética",detalle:{observaciones}})})));
  assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);
  const loaded=(await get("/formularios-area/"+creado.id)).data;
  assert.ok(loaded.version>creado.version);assert.ok(["Primera","Segunda"].includes(loaded.detalle.observaciones));
  const [audit]=await data.query("SELECT count(*)::int AS n FROM new_horizons.revision_registro WHERE tabla='ficha_guarderia' AND registro_id=$1",[creado.id]);
  assert.equal(audit.n,2); creado=loaded;
});
test("Confirmar habilita inscripción y bloquea la edición ordinaria", async()=>{
  creado=(await enviar("POST","/formularios-area/"+creado.id+"/confirmar",{version:creado.version,motivo:"Confirmación sintética"},201)).data;
  assert.equal(creado.estado,"CONFIRMADO");
  assert.equal((await get("/guarderia/hijos/101/fichas")).total,1);
  await enviar("PATCH","/formularios-area/"+creado.id,{version:creado.version,motivo:"Edición posterior",detalle:{observaciones:"No guardar"}},409);
});
test("Descartar conserva el registro y lo excluye del cursor común", async()=>{
  await data.query("INSERT INTO new_horizons.estado_formulario(codigo,descripcion) VALUES('DESCARTADO','Ensayo') ON CONFLICT DO NOTHING");
  const draft=(await enviar("POST","/beneficiarias/100/formularios-area",borrador(),201)).data;
  const discarded=(await enviar("POST","/formularios-area/"+draft.id+"/descartar",{version:draft.version,motivo:"Descarte sintético"},201)).data;
  assert.equal(discarded.estado,"DESCARTADO");
  assert.equal((await get("/formularios-area/"+draft.id)).data.id,draft.id);
  const list=await get("/beneficiarias/100/formularios-area?tipo=GUARDERIA&limite=100");
  assert.ok(!list.data.some(f=>f.id===draft.id));assert.ok(list.data.every(f=>f.tipo==="GUARDERIA"));
});
test("Fallo del detalle revierte cabecera y auditoría en la misma transacción", async()=>{
  const {GuarderiaFormRepository}=require("../src/modules/formularios/guarderia/repositories/guarderia-form.repository");
  const {FichaGuarderia}=require("../src/modules/formularios/guarderia/entities/ficha-guarderia.entity");
  const source=app.get(GuarderiaFormRepository).data;
  const original=source.transaction;
  const count=async()=> (await data.query("SELECT (SELECT count(*)::int FROM new_horizons.formulario_area) AS fichas,(SELECT count(*)::int FROM new_horizons.revision_registro) AS revisiones"))[0];
  const before=await count();
  source.transaction=function(fn){return original.call(this,async manager=>{
    const repository=manager.getRepository.bind(manager);
    manager.getRepository=entity=>{const repo=repository(entity);if(entity===FichaGuarderia)repo.save=async()=>{throw new Error("Fallo sintético");};return repo;};
    return fn(manager);
  });};
  try {await enviar("POST","/beneficiarias/100/formularios-area",borrador(),500);}
  finally {source.transaction=original;}
  assert.deepEqual(await count(),before);
});
test("El adaptador Guardería no intercepta formularios de otras áreas", async()=>{
  const rows=await data.query("SELECT id,tipo FROM new_horizons.formulario_area WHERE tipo <> 'GUARDERIA'");
  for(const row of rows){
    const loaded=(await get("/formularios-area/"+row.id)).data;
    assert.equal(loaded.tipo,row.tipo);assert.equal(loaded.id,row.id);
  }
});
test("La vista React guarda en el mismo PostgreSQL mediante HTTP real", {timeout:90000}, async()=>{
  const {spawn}=require("node:child_process");
  const result=await new Promise((resolve,reject)=>{
    const child=spawn(process.env.ComSpec || "cmd.exe",["/d","/s","/c","pnpm --dir frontend exec vitest run src/modules/guarderia/guarderia.live.test.tsx --config vite.config.ts"],{
      env:{...process.env,GUARDERIA_LIVE_API:url+"/api/v1",VITE_API_BASE_URL:url+"/api/v1"},windowsHide:true,
    });
    let output="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>output+=chunk);
    child.on("error",reject);child.on("close",code=>resolve({code,output}));
  });
  require("node:fs").writeFileSync("test-results/guarderia-react-http.log",result.output);
  assert.equal(result.code,0,result.output);
  const rows=await data.query("SELECT d.numero_ficha FROM new_horizons.ficha_guarderia d JOIN new_horizons.formulario_area f ON f.id=d.formulario_id WHERE f.nino_id=101 AND d.numero_ficha=$1",["Ensayo React y PostgreSQL"]);
  assert.equal(rows.length,1);
});

test("PDF de Guardería: carga, persistencia, descarga y versiones reales", async()=>{
 const {PDFDocument}=require("pdf-lib");
 const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
 const upload=async(extra={}, file=bytes)=>{
  const form=new FormData();form.set("formularioId",creado.id);form.set("categoria","Constancia");
  for(const [k,v] of Object.entries(extra))form.set(k,v);
  form.set("archivo",new Blob([file],{type:"application/pdf"}),"prueba.pdf");
  const response=await fetch(url+"/api/v1/beneficiarias/100/documentos/cargas",{method:"POST",body:form});
  return {status:response.status,body:await response.json()};
 };
 const first=await upload();assert.equal(first.status,201,JSON.stringify(first.body));
 const doc=first.body.data??first.body;assert.equal(doc.formularioId,creado.id);
 const download=await fetch(url+"/api/v1/documentos/"+doc.id+"/archivo");assert.equal(download.status,200);
 assert.deepEqual(Buffer.from(await download.arrayBuffer()),Buffer.from(bytes));
 const [stored]=await data.query("SELECT formulario_id FROM new_horizons.documento_area WHERE id=$1",[doc.id]);assert.equal(stored.formulario_id,creado.id);
 const next=await upload({documentoAnteriorId:doc.id,motivoCambio:"Actualización sintética"});
 assert.equal(next.status,201,JSON.stringify(next.body));assert.equal((next.body.data??next.body).versionDocumento,2);
 const invalid=await upload({},Buffer.from("esto no es PDF"));assert.ok(invalid.status>=400&&invalid.status<500);
 const foreign=await upload({formularioId:"2"});assert.ok(foreign.status>=400&&foreign.status<500);
});

let fichaResponsables, responsableQa;
const rutaResponsables=(beneficiaria="100",ficha=fichaResponsables.id)=>`/guarderia/beneficiarias/${beneficiaria}/fichas/${ficha}/responsables`;
const responsableInput=version=>({version,motivo:"Ensayo de responsable autorizado",nombre:"Gabriela López ficticia",cui:"0000000000067",relacion:"Abuela",telefono:"55550067"});
test("Responsables: ficha propia, guardado ORM, ceros iniciales y auditoría",async()=>{
 fichaResponsables=(await enviar("POST","/beneficiarias/100/formularios-area",borrador(),201)).data;
 const result=await enviar("POST",rutaResponsables(),responsableInput(fichaResponsables.version),201);
 responsableQa=result.responsable;assert.equal(typeof responsableQa.creadoEn,"string");assert.equal(responsableQa.cui,"0000000000067");assert.equal(responsableQa.formularioId,fichaResponsables.id);
 assert.ok(result.version>fichaResponsables.version);fichaResponsables.version=result.version;
 const lista=await get(rutaResponsables());assert.equal(lista.total,1);assert.equal(lista.datos[0].id,responsableQa.id);
 const [audit]=await data.query("SELECT count(*)::int n FROM new_horizons.revision_registro WHERE tabla='guarderia_responsable' AND registro_id=$1",[responsableQa.id]);assert.equal(audit.n,1);
});
test("Responsables: no cruza expedientes, áreas ni ámbitos",async()=>{
 await get(rutaResponsables("200"),404);
 await enviar("POST",rutaResponsables("200"),responsableInput(fichaResponsables.version),404);
 await get(rutaResponsables("100","2"),404);
 process.env.AREA_TEST_NOMBRE="Legal";
 try {await get(rutaResponsables(),403);await enviar("POST",rutaResponsables(),responsableInput(fichaResponsables.version),403);}finally{process.env.AREA_TEST_NOMBRE="Guardería";}
});
test("Responsables: validación por campo y rechazo de asignación masiva",async()=>{
 for(const campo of ["nombre","cui","relacion","telefono"]){
  const invalid=await enviar("POST",rutaResponsables(),{...responsableInput(fichaResponsables.version),[campo]:" "},400);
  assert.ok(invalid.errores.some(e=>e.campo===campo));
 }
 await enviar("POST",rutaResponsables(),{...responsableInput(fichaResponsables.version),formularioId:"2"},400);
});
test("Responsables: dos correcciones simultáneas conservan un ganador e historial",async()=>{
 const responses=await Promise.all(["55550001","55550002"].map(telefono=>fetch(url+"/api/v1"+rutaResponsables()+"/"+responsableQa.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...responsableInput(fichaResponsables.version),telefono})})));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const lista=await get(rutaResponsables());assert.equal(lista.total,1);fichaResponsables.version=lista.version;
 const audits=await data.query("SELECT anterior,nuevo,motivo FROM new_horizons.revision_registro WHERE tabla='guarderia_responsable' AND registro_id=$1 ORDER BY id",[responsableQa.id]);
 assert.equal(audits.length,2);assert.equal(audits[1].anterior.telefono,"55550067");assert.ok(["55550001","55550002"].includes(audits[1].nuevo.telefono));
});
test("Responsables: página vacía conserva total y no permite editar otro registro",async()=>{
 const pagina=await get(rutaResponsables()+"?pagina=2&limite=1");assert.equal(pagina.total,1);assert.deepEqual(pagina.datos,[]);
 const otra=(await enviar("POST","/beneficiarias/100/formularios-area",borrador(),201)).data;
 await enviar("PATCH",rutaResponsables("100",otra.id)+"/"+responsableQa.id,responsableInput(otra.version),404);
});
test("Responsables: fallo de auditoría revierte inserción y versión",async()=>{
 const before=await get(rutaResponsables());
 const countAudit=async()=> (await data.query("SELECT count(*)::int n FROM new_horizons.revision_registro"))[0].n;
 const revisionesAntes=await countAudit();
 await data.query("CREATE FUNCTION new_horizons.qa_fallo_responsable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo QA'; END $$");
 await data.query("CREATE TRIGGER zz_qa_fallo AFTER INSERT ON new_horizons.guarderia_responsable FOR EACH ROW EXECUTE FUNCTION new_horizons.qa_fallo_responsable()");
 try {await enviar("POST",rutaResponsables(),responsableInput(before.version),500);}finally{await data.query("DROP TRIGGER zz_qa_fallo ON new_horizons.guarderia_responsable");await data.query("DROP FUNCTION new_horizons.qa_fallo_responsable()");}
 const after=await get(rutaResponsables());assert.equal(after.total,before.total);assert.equal(after.version,before.version);assert.equal(await countAudit(),revisionesAntes);
});
test("Responsables: ficha confirmada queda en consulta; producción deniega contexto técnico",async()=>{
 await enviar("POST","/formularios-area/"+fichaResponsables.id+"/confirmar",{version:fichaResponsables.version,motivo:"Confirmación QA"},201);
 const lista=await get(rutaResponsables());assert.equal(lista.total,1);
 await enviar("POST",rutaResponsables(),responsableInput(lista.version),409);
 process.env.NODE_ENV="production";
 try {await get(rutaResponsables(),503);}finally{process.env.NODE_ENV="test";}
});

test("Reconstrucción de Guardería conserva las cabeceras de las demás áreas",async()=>{
 const actuales=await data.query("SELECT * FROM new_horizons.formulario_area WHERE tipo <> 'GUARDERIA' ORDER BY id");
 assert.deepEqual(actuales,otrasAreasAntes);
});

test("Responsables: PostgreSQL impide vincular a Legal y borrar físicamente",async()=>{
 await assert.rejects(data.query("INSERT INTO new_horizons.guarderia_responsable(formulario_id,nombre,cui,relacion,telefono) VALUES(2,'Ficticio','0001','Contacto','55550001')"),e=>e.code==='23503');
 await assert.rejects(data.query("DELETE FROM new_horizons.guarderia_responsable WHERE id=$1",[responsableQa.id]),e=>e.code==='P0001');
 assert.equal((await get(rutaResponsables())).total,1);
});
let padreHttp;
const padresRuta=(b="100",n="100")=>`/guarderia/beneficiarias/${b}/hijos/${n}/padres`;
test("Padres HTTP: crea por niño, conserva CUI, tipo y datos opcionales",async()=>{
 padreHttp=await enviar("POST",padresRuta(),{tipoVinculo:"BIOLOGICO",nombre:"Carlos Méndez ficticio",cui:"0000000000067"},201);
 assert.equal(padreHttp.ninoId,"100");assert.equal(padreHttp.version,1);assert.equal(padreHttp.telefono,null);assert.equal(padreHttp.cui,"0000000000067");
 const legal=await enviar("POST",padresRuta(),{tipoVinculo:"LEGAL"},201);assert.equal(legal.tipoVinculo,"LEGAL");assert.equal(legal.nombre,null);
 const list=await get(padresRuta());assert.equal(list.total,2);assert.equal(list.datos.length,2);
});
test("Padres HTTP: rechaza caso ajeno, niño ajeno, asignación masiva y tipo inválido",async()=>{
 await get(padresRuta("200","100"),404);
 await enviar("POST",padresRuta("100","200"),{tipoVinculo:"LEGAL"},404);
 await enviar("POST",padresRuta(),{tipoVinculo:"LEGAL",ninoId:"200"},400);
 const invalid=await enviar("POST",padresRuta(),{tipoVinculo:"OTRO"},400);assert.ok(invalid.errores.some(e=>e.campo==="tipoVinculo"));
 const wrong=await enviar("POST",padresRuta(),{tipoVinculo:"LEGAL",telefono:123},400);assert.ok(wrong.errores.some(e=>e.campo==="telefono"));
 await enviar("PATCH",padresRuta("100","101")+"/"+padreHttp.id,{tipoVinculo:"BIOLOGICO",version:padreHttp.version,motivo:"Ensayo de aislamiento",nombre:"No guardar"},404);
});
test("Padres HTTP: corrige con motivo y conserva anterior/nuevo auditado",async()=>{
 const beforeHeaders=await data.query("SELECT * FROM new_horizons.formulario_area ORDER BY id");
 const beforeInitial=await data.query("SELECT * FROM new_horizons.ficha_inicial ORDER BY id_ficha_inicial");
 padreHttp=await enviar("PATCH",padresRuta()+"/"+padreHttp.id,{tipoVinculo:"BIOLOGICO",version:padreHttp.version,motivo:"Corrección ficticia",telefono:"55550067"},200);
 assert.equal(padreHttp.version,2);assert.equal(padreHttp.cui,"0000000000067");
 const rows=await data.query("SELECT anterior,nuevo,actor_id,motivo FROM new_horizons.revision_registro WHERE tabla='padre_nino' AND registro_id=$1 AND operacion='UPDATE'",[padreHttp.id]);
 assert.equal(rows.length,1);assert.equal(rows[0].anterior.telefono,null);assert.equal(rows[0].nuevo.telefono,"55550067");assert.equal(rows[0].actor_id,"1");assert.equal(rows[0].motivo,"Corrección ficticia");
 assert.deepEqual(await data.query("SELECT * FROM new_horizons.formulario_area ORDER BY id"),beforeHeaders);
 assert.deepEqual(await data.query("SELECT * FROM new_horizons.ficha_inicial ORDER BY id_ficha_inicial"),beforeInitial);
});
test("Padres HTTP: dos correcciones con igual versión solo guardan una",async()=>{
 const requests=await Promise.all(["55550068","55550069"].map(telefono=>fetch(url+"/api/v1"+padresRuta()+"/"+padreHttp.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipoVinculo:"BIOLOGICO",version:padreHttp.version,motivo:"Concurrencia ficticia",telefono})})));
 assert.deepEqual(requests.map(r=>r.status).sort(),[200,409]);
 const page=await get(padresRuta()+"?pagina=2&limite=2");assert.equal(page.total,2);assert.deepEqual(page.datos,[]);
});
test("Padres HTTP: error de auditoría revierte padre y revisión",async()=>{
 const count=async()=>(await data.query("SELECT (SELECT count(*) FROM new_horizons.padre_nino)::int padres,(SELECT count(*) FROM new_horizons.revision_registro)::int revisiones"))[0];const before=await count();
 await data.query("CREATE FUNCTION new_horizons.qa_fallo_padre() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo ficticio de QA'; END $$");
 await data.query("CREATE TRIGGER zz_qa_fallo AFTER INSERT ON new_horizons.padre_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.qa_fallo_padre()");
 try {await enviar("POST",padresRuta(),{tipoVinculo:"LEGAL",nombre:"No persistir"},500);}finally{await data.query("DROP TRIGGER zz_qa_fallo ON new_horizons.padre_nino");await data.query("DROP FUNCTION new_horizons.qa_fallo_padre()");}
 assert.deepEqual(await count(),before);
});
test("Padres HTTP: otro ámbito y producción no aceptan identidad técnica",async()=>{
 process.env.AREA_TEST_NOMBRE="Legal";try{await get(padresRuta(),403);await enviar("POST",padresRuta(),{tipoVinculo:"LEGAL"},403);}finally{process.env.AREA_TEST_NOMBRE="Guardería";}
 process.env.NODE_ENV="production";try{await get(padresRuta(),503);}finally{process.env.NODE_ENV="test";}
});

test("Consulta de datos maternos no altera el perfil de la beneficiaria",async()=>{
 assert.deepEqual(await data.query("SELECT * FROM new_horizons.beneficiaria WHERE id_beneficiaria=100"),perfilMaternoAntes);
});

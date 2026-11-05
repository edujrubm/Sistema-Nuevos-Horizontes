const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {NestFactory}=require('@nestjs/core'),{DataSource}=require('typeorm'),{AppModule}=require('../dist/app.module'),{configurarTransporteApi}=require('../dist/common/errors/transporte');
let app,db,url,forms,documento;
before(async()=>{process.env.P3_TEST_AREA='Legal';app=await NestFactory.create(AppModule,{logger:false});configurarTransporteApi(app);app.setGlobalPrefix('api/v1');await app.listen(0,'127.0.0.1');url=await app.getUrl()+'/api/v1';db=app.get(DataSource);forms=Object.fromEntries((await db.query('SELECT id,tipo FROM new_horizons.formulario_area')).map(x=>[x.tipo,x.id]));});
after(async()=>{if(app)await app.close();});
async function call(method,p,b,status=200){const r=await fetch(url+p,{method,headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));if(status>=400)assert.deepEqual(Object.keys(d).sort(),['estado','codigo','mensaje','errores','idSolicitud'].sort());return d;}
const privado=key=>path.resolve(process.env.P3_DOCUMENTS_DIR||'test-results/documentos-privados',key);
const get=tipo=>call('GET','/laboratorio/fichas/'+forms[tipo]);
const change=d=>({version:d.formulario.version,motivo:'Prueba integral local'});
async function tx(fn){return db.transaction(async m=>{await m.query("SELECT set_config('new_horizons.actor_id','1',true),set_config('new_horizons.motivo','Prueba SQL local',true)");return fn(m);});}
async function pdf(extra={},status=201){const f=new FormData();for(const [k,v] of Object.entries({formularioId:forms.LEGAL,categoria:'Prueba local',...extra}))f.set(k,v);f.set('archivo',new Blob([fs.readFileSync('test/fixtures/documento.pdf')],{type:'application/pdf'}),'documento.pdf');const r=await fetch(url+'/beneficiarias/100/documentos/cargas',{method:'POST',body:f});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
test('Local: catálogos, cinco tablas nuevas y restricción de área',async()=>{
 const c=await call('GET','/laboratorio/catalogos');assert.equal(c.riesgos.length,4);assert.equal(c.estadosDocumento.length,2);assert.equal(c.areaActual,'Legal');assert.ok(c.fichas.every(f=>['LEGAL','REFERENCIA_LEGAL'].includes(f.tipo)));
 const [n]=await db.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='new_horizons' AND table_name IN ('riesgo_social','ficha_social_riesgo','autorizacion_traslado_guarderia','estado_revision_documento','asignacion_caso_area')");assert.equal(n.n,5);
 await call('GET','/laboratorio/fichas/'+forms.SOCIAL,undefined,403);
});
test('Local: campos nuevos de Legal, historial y fecha sin truncamiento',async()=>{
 let d=await get('LEGAL');d=await call('PATCH','/laboratorio/fichas/'+forms.LEGAL,{...change(d),detalle:{normativaAplicable:'Normativa sintética',objetivoLegal:'Objetivo local',proximaActuacionFecha:'2026-11-10'}});assert.equal(d.detalle.normativaAplicable,'Normativa sintética');
 const [rev]=await db.query("SELECT nuevo,motivo FROM new_horizons.revision_registro WHERE tabla='ficha_legal' AND registro_id=$1 ORDER BY id DESC LIMIT 1",[forms.LEGAL]);assert.equal(rev.nuevo.normativa_aplicable,'Normativa sintética');assert.equal(rev.motivo,'Prueba integral local');
 const invalid=await call('PATCH','/laboratorio/fichas/'+forms.LEGAL,{...change(d),detalle:{proximaActuacionFecha:'2026-11-10T08:00:00Z'}},400);assert.ok(invalid.errores.some(e=>e.campo==='detalle.proximaActuacionFecha'));
});
test('Local: Social conserva contrato de pantalla y bigint exactos',async()=>{
 process.env.P3_TEST_AREA='Trabajo Social';await db.query("INSERT INTO new_horizons.area(id_area,nombre_area) VALUES(9007199254740993,'Área sintética bigint')");let d=await get('SOCIAL');d=await call('PATCH','/laboratorio/fichas/'+forms.SOCIAL,{...change(d),detalle:{areaCoordinacionId:'9007199254740993',tipoVivienda:'Alquilada',composicionFamiliar:'Grupo sintético',redesApoyo:'Red local',dependenciaEconomica:false,fechaRevision:'2026-11-03'}});assert.equal(d.detalle.areaCoordinacionId,'9007199254740993');
 const lista=await call('GET','/trabajo-social/beneficiarias/100/fichas');assert.equal(lista.datos[0].detalle.areaCoordinacionId,'9007199254740993');const resumen=await call('GET','/trabajo-social/beneficiarias/100/resumen');assert.equal(resumen.ultimaFicha.historiaViolencia,'Historia sintética');assert.equal(resumen.ultimaFicha.areaCoordinacionId,'9007199254740993');assert.equal(resumen.ultimaFicha.detalle.tipoVivienda,'Alquilada');
});
test('Local: riesgos seleccionables, contador, retiro y auditoría sin borrado',async()=>{
 let d=await get('SOCIAL');const cat=await call('GET','/laboratorio/catalogos');d=await call('PUT','/laboratorio/fichas/'+forms.SOCIAL+'/riesgos',{...change(d),riesgosIds:cat.riesgos.slice(0,2).map(x=>x.id)});assert.equal(d.totalRiesgos,2);assert.equal((await call('GET','/trabajo-social/beneficiarias/100/resumen')).totalRiesgos,2);
 d=await call('PUT','/laboratorio/fichas/'+forms.SOCIAL+'/riesgos',{...change(d),riesgosIds:[]});assert.equal(d.totalRiesgos,0);const [n]=await db.query('SELECT count(*)::int n FROM new_horizons.ficha_social_riesgo WHERE formulario_id=$1 AND NOT seleccionado',[forms.SOCIAL]);assert.equal(n.n,2);
 const [hist]=await db.query("SELECT count(*)::int n FROM new_horizons.revision_registro WHERE tabla='ficha_social_riesgo'");assert.ok(hist.n>=4);
});
test('Local: riesgos inválidos no cambian registros y la concurrencia detecta versión',async()=>{
 const d=await get('SOCIAL');await call('PUT','/laboratorio/fichas/'+forms.SOCIAL+'/riesgos',{...change(d),riesgosIds:['999999']},409);assert.equal((await get('SOCIAL')).formulario.version,d.formulario.version);
 const body={...change(d),riesgosIds:['1']};const requests=await Promise.all([1,2].map(()=>fetch(url+'/laboratorio/fichas/'+forms.SOCIAL+'/riesgos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})));assert.deepEqual(requests.map(r=>r.status).sort(),[200,409]);
});
test('Local: autorizaciones de Guardería separan llevar y recoger',async()=>{
 process.env.P3_TEST_AREA='Guardería';let d=await get('GUARDERIA');const p=await call('POST','/laboratorio/fichas/'+forms.GUARDERIA+'/responsables',{...change(d),nombre:'Responsable sintético',cui:'TEST-LOCAL-CUI',telefono:'55555555'},201);d=await get('GUARDERIA');d=await call('PUT','/laboratorio/fichas/'+forms.GUARDERIA+'/autorizaciones',{...change(d),autorizaciones:[{familiarId:p.id,puedeLlevar:true,puedeRecoger:false}]});assert.equal(d.autorizaciones[0].puedeLlevar,true);assert.equal(d.autorizaciones[0].puedeRecoger,false);
 await call('PUT','/laboratorio/fichas/'+forms.GUARDERIA+'/autorizaciones',{...change(d),autorizaciones:[{familiarId:p.id,puedeLlevar:false,puedeRecoger:false}]},400);assert.equal((await get('GUARDERIA')).formulario.version,d.formulario.version);
});
test('Local: FK compuesta impide autorizar familiares de otra ficha incluso por SQL',async()=>{
 const [p]=await tx(m=>m.query("INSERT INTO new_horizons.familiar_declarado(formulario_id,vinculo,nombre) VALUES($1,'RESPONSABLE','Persona de otra ficha') RETURNING id",[forms.LEGAL]));await assert.rejects(tx(m=>m.query('INSERT INTO new_horizons.autorizacion_traslado_guarderia(formulario_id,familiar_declarado_id,puede_llevar,puede_recoger) VALUES($1,$2,true,false)',[forms.GUARDERIA,p.id])),e=>e.driverError.code==='23503');
 const d=await get('GUARDERIA');await call('PUT','/laboratorio/fichas/'+forms.GUARDERIA+'/autorizaciones',{...change(d),autorizaciones:[{familiarId:p.id,puedeLlevar:true,puedeRecoger:false}]},409);
});
test('Local: vínculo de ficha inicial exige el mismo expediente',async()=>{
 process.env.P3_TEST_AREA='Legal';const [ex]=await db.query('SELECT id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=200');const [fi]=await tx(m=>m.query('INSERT INTO new_horizons.ficha_inicial(expediente_id) VALUES($1) RETURNING id_ficha_inicial',[ex.id_expediente]));let d=await get('LEGAL');await call('PATCH','/laboratorio/fichas/'+forms.LEGAL,{...change(d),detalle:{},fichaInicialId:fi.id_ficha_inicial},409);assert.equal((await get('LEGAL')).formulario.version,d.formulario.version);d=await call('PATCH','/laboratorio/fichas/'+forms.LEGAL,{...change(d),detalle:{},fichaInicialId:'100'});assert.equal(d.formulario.fichaInicialId,'100');
});
test('Local: PDF con título, fecha y descripción de 20000 caracteres persiste',async()=>{
 documento=await pdf({nombreDocumento:'Documento de prueba local',fechaDocumento:'2026-10-31',descripcion:'á'.repeat(20000)});assert.equal(documento.nombreDocumento,'Documento de prueba local');assert.equal(documento.descripcion.length,20000);assert.equal(documento.estadoRevisionCodigo,'BORRADOR');const [d]=await db.query('SELECT fecha_documento::text,descripcion FROM new_horizons.documento_area WHERE id=$1',[documento.id]);assert.equal(d.fecha_documento,'2026-10-31');assert.equal(d.descripcion.length,20000);
});
test('Local: consulta PDF verifica integridad y rechaza acceso de otra área',async()=>{
 const r=await fetch(url+'/laboratorio/documentos/'+documento.id+'/archivo');assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync('test/fixtures/documento.pdf'));process.env.P3_TEST_AREA='Guardería';await call('GET','/laboratorio/documentos/'+documento.id+'/archivo',undefined,403);process.env.P3_TEST_AREA='Legal';
 const [d]=await db.query('SELECT objeto_privado FROM new_horizons.documento_area WHERE id=$1',[documento.id]);const bytes=fs.readFileSync(privado(d.objeto_privado)),changed=Buffer.from(bytes);changed[0]^=1;try{fs.writeFileSync(privado(d.objeto_privado),changed);const bad=await call('GET','/laboratorio/documentos/'+documento.id+'/archivo',undefined,500);assert.equal(bad.codigo,'INTEGRIDAD_DOCUMENTO_NO_VERIFICADA');}finally{fs.writeFileSync(privado(d.objeto_privado),bytes);}
});
test('Local: revisión documental con autor, fecha, historial y versión optimista',async()=>{
 let d=await call('PATCH','/laboratorio/documentos/'+documento.id,{version:1,motivo:'Revisión sintética',estadoRevisionCodigo:'REVISADO'});const doc=d.documentos.find(x=>x.id===documento.id);assert.equal(doc.estadoRevisionCodigo,'REVISADO');assert.equal(doc.vigente,true);assert.equal(doc.versionRegistro,2);await call('PATCH','/laboratorio/documentos/'+documento.id,{version:1,motivo:'Petición obsoleta',estadoRevisionCodigo:'BORRADOR'},409);const [dbDoc]=await db.query('SELECT revisado_por,revisado_en FROM new_horizons.documento_area WHERE id=$1',[documento.id]);assert.equal(dbDoc.revisado_por,'1');assert.ok(dbDoc.revisado_en);
});
test('Local: versiones de PDF conservan archivos y evitan dos sucesores concurrentes',async()=>{
 await pdf({documentoAnteriorId:documento.id},400);const results=await Promise.all([1,2].map(async()=>{const f=new FormData();for(const [k,v] of Object.entries({formularioId:forms.LEGAL,categoria:'Prueba local',documentoAnteriorId:documento.id,motivoCambio:'Nueva versión sintética'}))f.set(k,v);f.set('archivo',new Blob([fs.readFileSync('test/fixtures/documento.pdf')],{type:'application/pdf'}),'version.pdf');const r=await fetch(url+'/beneficiarias/100/documentos/cargas',{method:'POST',body:f});return {status:r.status,body:await r.json()};}));assert.deepEqual(results.map(x=>x.status).sort(),[201,409]);const next=results.find(x=>x.status===201).body;assert.equal(next.versionDocumento,2);assert.equal(next.nombreDocumento,documento.nombreDocumento);const d=await get('LEGAL');assert.equal(d.documentos.find(x=>x.id===documento.id).vigente,false);const [count]=await db.query('SELECT count(*)::int n FROM new_horizons.documento_area WHERE documento_anterior_id=$1',[documento.id]);assert.equal(count.n,1);
});
test('Local: contenido de PDF y cadena de versión son inmutables desde SQL',async()=>{
 await assert.rejects(tx(m=>m.query("UPDATE new_horizons.documento_area SET sha256=repeat('a',64) WHERE id=$1",[documento.id])),e=>e.driverError.code==='P0001');await assert.rejects(tx(m=>m.query('DELETE FROM new_horizons.documento_area WHERE id=$1',[documento.id])),e=>e.driverError.code==='P0001');
});
test('Local: cierre Social valida fecha, resultados y bloquea edición posterior',async()=>{
 process.env.P3_TEST_AREA='Trabajo Social';let d=await get('SOCIAL');await call('POST','/laboratorio/fichas/'+forms.SOCIAL+'/cierre',{...change(d),fechaCierre:'2026-02-31',resultadosAlcanzados:'Resultado'},400);await call('POST','/laboratorio/fichas/'+forms.SOCIAL+'/cierre',{...change(d),fechaCierre:'2020-01-01',resultadosAlcanzados:'Resultado'},422);d=await call('POST','/laboratorio/fichas/'+forms.SOCIAL+'/cierre',{...change(d),fechaCierre:'2026-10-31',resultadosAlcanzados:'Resultados sintéticos locales'},201);assert.equal(d.formulario.estadoCodigo,'CERRADA');await call('PATCH','/laboratorio/fichas/'+forms.SOCIAL,{...change(d),detalle:{observaciones:'No permitido después del cierre'}},409);
});

test('Local: editor experimental no vacía referencias confirmadas',async()=>{
 process.env.P3_TEST_AREA='Legal';let r=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-31T12:00:00Z',profesionalId:'1',detalle:{destino:'Institución sintética',motivoReferencia:'Motivo local'}},201);r=await call('POST','/legal/referencias/'+r.id+'/confirmar',{version:r.version,motivo:'Confirmación para prueba'},201);
 const current=await call('GET','/laboratorio/fichas/'+r.id);await call('PATCH','/laboratorio/fichas/'+r.id,{...change(current),detalle:{destino:null}},400);const same=await call('GET','/legal/referencias/'+r.id);assert.equal(same.detalle.destino,'Institución sintética');assert.equal(same.version,r.version);
});
test('Local: no marca revisado un PDF con integridad dañada',async()=>{
 process.env.P3_TEST_AREA='Legal';const d=await pdf({nombreDocumento:'Prueba de integridad en revisión'});const [file]=await db.query('SELECT objeto_privado FROM new_horizons.documento_area WHERE id=$1',[d.id]);const original=fs.readFileSync(privado(file.objeto_privado)),bad=Buffer.from(original);bad[0]^=1;
 try{fs.writeFileSync(privado(file.objeto_privado),bad);const error=await call('PATCH','/laboratorio/documentos/'+d.id,{version:1,motivo:'Revisión de archivo dañado',estadoRevisionCodigo:'REVISADO'},500);assert.equal(error.codigo,'INTEGRIDAD_DOCUMENTO_NO_VERIFICADA');const [same]=await db.query('SELECT estado_revision_codigo,version_registro FROM new_horizons.documento_area WHERE id=$1',[d.id]);assert.equal(same.estado_revision_codigo,'BORRADOR');assert.equal(same.version_registro,1);}finally{fs.writeFileSync(privado(file.objeto_privado),original);}
});

test('Local: archivos usan claves portables sin cambiar registros de BD',async()=>{
 process.env.P3_TEST_AREA='Legal';const d=await pdf({nombreDocumento:'Documento portable'});const [row]=await db.query('SELECT objeto_privado FROM new_horizons.documento_area WHERE id=$1',[d.id]);assert.equal(path.isAbsolute(row.objeto_privado),false);assert.match(row.objeto_privado,/^[0-9a-f-]+\.pdf$/);
 const prev=process.env.P3_DOCUMENTS_DIR,dir=path.resolve('test-results','reubicacion-'+crypto.randomUUID());fs.mkdirSync(dir);fs.copyFileSync(privado(row.objeto_privado),path.join(dir,row.objeto_privado));
 try{process.env.P3_DOCUMENTS_DIR=dir;const r=await fetch(url+'/laboratorio/documentos/'+d.id+'/archivo');assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync('test/fixtures/documento.pdf'));}finally{if(prev===undefined)delete process.env.P3_DOCUMENTS_DIR;else process.env.P3_DOCUMENTS_DIR=prev;fs.unlinkSync(path.join(dir,row.objeto_privado));fs.rmdirSync(dir);}
});

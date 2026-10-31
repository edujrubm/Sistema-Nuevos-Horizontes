const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {NestFactory}=require('@nestjs/core');
const {configurarTransporteApi}=require('../dist/common/errors/transporte');
const {AppModule}=require('../dist/app.module');
const {DataSource}=require('typeorm');
let app,db,url,reference,entry;
const forms={};
async function call(method,path,body,status=200){
 const r=await fetch(url+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));if(status>=400)comprobarError(r,data);return data;
}
before(async()=>{
 process.env.P3_TEST_AREA='Legal';process.env.P3_TEST_ROLE='COORDINACION';
 app=await NestFactory.create(AppModule,{logger:false});
 app.setGlobalPrefix('api/v1');
 configurarTransporteApi(app);
 await app.listen(0,'127.0.0.1');url=await app.getUrl()+'/api/v1';db=app.get(DataSource);
 for(const row of await db.query('SELECT id,tipo FROM new_horizons.formulario_area'))forms[row.tipo]=row.id;
});
after(async()=>{if(app)await app.close();});
test('Social: resumen, persistencia semilla y ficha tipada',async()=>{
 const r=await call('GET','/trabajo-social/beneficiarias/100/resumen');assert.equal(r.totalFichas,1);
 const f=await call('GET','/trabajo-social/beneficiarias/100/fichas');assert.equal(f.datos[0].detalle.historiaViolencia,'Historia sintética');
});
test('Legal: ficha e inexistencia diferenciadas',async()=>{
 const r=await call('GET','/legal/beneficiarias/100/fichas');assert.equal(r.datos[0].tipo,'LEGAL');
 await call('GET','/legal/beneficiarias/999999/fichas',undefined,404);
});
test('Guardería: hijos del expediente y ficha infantil',async()=>{
 const children=await call('GET','/guarderia/beneficiarias/100/hijos');assert.deepEqual(children.datos.map(x=>x.ninoId),['100']);
 const fichas=await call('GET','/guarderia/hijos/100/fichas');assert.equal(fichas.datos[0].ninoId,'100');
 await call('GET','/guarderia/hijos/9999/fichas',undefined,404);
});
test('IDs, paginación y propiedades desconocidas se validan',async()=>{
 for(const path of ['/legal/beneficiarias/letras/fichas','/legal/beneficiarias/9223372036854775808/fichas','/legal/beneficiarias/100/fichas?limite=101','/legal/beneficiarias/100/fichas?sql=DROP'])await call('GET',path,undefined,400);
});
test('Referencia: alta atómica, camelCase, ID texto y captura servidor',async()=>{
 reference=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-26T10:00:00-06:00',profesionalId:'1',detalle:{destino:'Institución sintética',motivoReferencia:'Prueba'}},201);
 assert.equal(typeof reference.id,'string');assert.equal(reference.capturadoPor,'1');assert.equal(reference.detalle.motivoReferencia,'Prueba');
 assert.equal((await call('GET','/legal/referencias/'+reference.id)).id,reference.id);
 assert.equal((await call('GET','/legal/beneficiarias/100/referencias')).datos.length,1);
});
test('Referencia: validación anidada y actor del cliente rechazado',async()=>{
 const base={fechaAtencion:'2026-10-26T10:00:00-06:00',profesionalId:'1',detalle:{}};
 for(const body of [{...base,actorId:'2'},{...base,detalle:{campoInventado:'x'}},{...base,detalle:null},{...base,fechaAtencion:'2026-10-26'}])await call('POST','/legal/beneficiarias/100/referencias',body,400);
});
test('Referencia: FK inválida revierte cabecera y auditoría',async()=>{
 const [before]=await db.query('SELECT count(*) AS n FROM new_horizons.formulario_area');
 await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-26T10:00:00Z',profesionalId:'99999',detalle:{}},409);
 const [after]=await db.query('SELECT count(*) AS n FROM new_horizons.formulario_area');assert.equal(after.n,before.n);
});
test('Referencia: editar borrador y rechazar versión antigua',async()=>{
 const old=reference.version;
 reference=await call('PATCH','/legal/referencias/'+reference.id,{version:old,motivo:'Corrección sintética',detalle:{recomendaciones:'Seguimiento sintético'}});
 assert.ok(reference.version>old);
 await call('PATCH','/legal/referencias/'+reference.id,{version:old,motivo:'Obsoleta',detalle:{destino:'x'}},409);
});
test('Referencia: confirmar y corregir conservando estado, motivo e historial',async()=>{
 reference=await call('POST','/legal/referencias/'+reference.id+'/confirmar',{version:reference.version,motivo:'Confirmación sintética'},201);
 assert.equal(reference.estadoCodigo,'P3_CONFIRMADO');
 await call('POST','/legal/referencias/'+reference.id+'/confirmar',{version:reference.version,motivo:'Repetida'},409);
 const old=reference;
 reference=await call('PATCH','/legal/referencias/'+reference.id,{version:reference.version,motivo:'Corrección posterior a confirmación',detalle:{destino:'Destino corregido'}});
 assert.equal(reference.estadoCodigo,'P3_CONFIRMADO');assert.ok(reference.version>old.version);
 const [revision]=await db.query("SELECT anterior,nuevo,motivo FROM new_horizons.revision_registro WHERE tabla='referencia_legal' AND registro_id=$1 AND operacion='UPDATE' ORDER BY id DESC LIMIT 1",[reference.id]);assert.equal(revision.nuevo.destino,'Destino corregido');assert.equal(revision.motivo,'Corrección posterior a confirmación');
 await call('PATCH','/legal/referencias/'+reference.id,{version:reference.version,detalle:{destino:'Sin motivo'}},400);
 await call('GET','/legal/referencias/'+forms.SOCIAL,undefined,404);
});
test('Evolución: todas las áreas y vínculo correcto al expediente',async()=>{
 for(const tipo of ['SOCIAL','LEGAL','GUARDERIA','PSICOLOGIA_MUJER','MEDICINA_MUJER']){
  process.env.P3_TEST_AREA={SOCIAL:'Trabajo Social',LEGAL:'Legal',GUARDERIA:'Guardería',PSICOLOGIA_MUJER:'Psicología',MEDICINA_MUJER:'Medicina'}[tipo];
  const e=await call('POST','/beneficiarias/100/hoja-evolutiva',{formularioId:forms[tipo],accion:'Atención sintética',contenido:'Contenido '+tipo,fechaAtencion:'2026-10-26T11:00:00-06:00',profesionalId:'1'},201);
  if(tipo==='LEGAL')entry=e;
 }
 process.env.P3_TEST_AREA='Legal';
 const entries=await call('GET','/beneficiarias/100/hoja-evolutiva');assert.equal(entries.datos.length,1);assert.ok(entries.datos.every(x=>x.formularioId===forms.LEGAL));
 process.env.P3_TEST_AREA='Guardería';
 const guarderia=await call('GET','/beneficiarias/100/hoja-evolutiva?hijoId=100');assert.equal(guarderia.datos.length,1);
 await call('GET','/beneficiarias/100/hoja-evolutiva?hijoId=200',undefined,404);
 process.env.P3_TEST_AREA='Legal';
 await call('POST','/beneficiarias/200/hoja-evolutiva',{formularioId:forms.LEGAL,accion:'x',contenido:'x',fechaAtencion:'2026-10-26T11:00:00Z',profesionalId:'1'},404);
});
test('Evolución: corregir conserva captura y registra revisión anterior/nueva',async()=>{
 const old=entry;
 entry=await call('PATCH','/entradas-evolutivas/'+entry.id,{version:entry.version,motivo:'Corrección de contenido sintético',contenido:'Contenido corregido'});
 assert.equal(entry.registradoEn,old.registradoEn);assert.equal(entry.capturadoPor,old.capturadoPor);assert.equal(entry.version,old.version+1);
 const hist=await call('GET','/entradas-evolutivas/'+entry.id+'/revisiones');
 const update=hist.datos.find(x=>x.operacion==='UPDATE');assert.deepEqual(update.cambios,[{campo:'contenido',antes:old.contenido,despues:entry.contenido}]);assert.equal(update.autor.usuarioId,'1');assert.ok(hist.datos.some(x=>x.operacion==='INSERT'));assert.ok(!Object.hasOwn(update,'anterior'));
 await call('PATCH','/entradas-evolutivas/'+entry.id,{version:old.version,motivo:'Obsoleta',contenido:'x'},409);
});
test('Evolución: corrección vacía/null, campos protegidos y autoría falsa rechazados',async()=>{
 for(const dto of [{version:entry.version,motivo:'Sin cambios'},{version:entry.version,motivo:'Inválida',contenido:null},{version:entry.version,motivo:'Inválida',capturadoPor:'200',contenido:'x'}])await call('PATCH','/entradas-evolutivas/'+entry.id,dto,400);
 await call('GET','/entradas-evolutivas/999999/revisiones',undefined,404);
});
test('Evolución: escrituras simultáneas no pierden entradas',async()=>{
 process.env.P3_TEST_AREA='Trabajo Social';
 const before=(await call('GET','/beneficiarias/100/hoja-evolutiva?limite=100')).datos.length;
 await Promise.all(Array.from({length:10},(_,i)=>call('POST','/beneficiarias/100/hoja-evolutiva',{formularioId:forms.SOCIAL,accion:'Concurrente '+i,contenido:'Sintético',fechaAtencion:'2026-10-26T12:00:00Z',profesionalId:'1'},201)));
 assert.equal((await call('GET','/beneficiarias/100/hoja-evolutiva?limite=100')).datos.length,before+10);
 process.env.P3_TEST_AREA='Legal';
});
test('Evolución: dos correcciones de la misma versión producen un conflicto',async()=>{
 const results=await Promise.all(['A','B'].map(contenido=>fetch(url+'/entradas-evolutivas/'+entry.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:entry.version,motivo:'Concurrente',contenido})})));
 assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
});
test('Sin DELETE físico ni actor de prueba en producción',async()=>{
 await call('DELETE','/entradas-evolutivas/'+entry.id,undefined,404);
 const old=process.env.P3_TEST_ACTOR_ID;delete process.env.P3_TEST_ACTOR_ID;
 try{await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-26T10:00:00Z',profesionalId:'1',detalle:{}},503);}finally{process.env.P3_TEST_ACTOR_ID=old;}
});

test('Postman: ejecutar las 14 peticiones con Newman contra la API real',async()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const newman=require('newman');
 const collection=JSON.parse(fs.readFileSync(path.join(__dirname,'../postman/Persona3.postman_collection.json'),'utf8'));
 const report=await new Promise((resolve,reject)=>newman.run({collection,reporters:[],envVar:[{key:'baseUrl',value:url},{key:'formularioId',value:forms.LEGAL}]},(err,result)=>err?reject(err):resolve(result)));
 fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});
 fs.writeFileSync(path.join(__dirname,'../test-results/newman.json'),JSON.stringify({requests:report.run.stats.requests,assertions:report.run.stats.assertions,failures:report.run.failures},null,2));
 assert.equal(report.run.stats.requests.total,14);
 assert.equal(report.run.failures.length,0,JSON.stringify(report.run.failures));
});

test('Área activa: no se puede leer, crear o corregir evolución de otra área',async()=>{
 process.env.P3_TEST_AREA='Legal';
 await call('GET','/beneficiarias/100/hoja-evolutiva?area=Trabajo%20Social',undefined,403);
 await call('GET','/beneficiarias/100/hoja-evolutiva?formularioId='+forms.SOCIAL,undefined,403);
 await call('POST','/beneficiarias/100/hoja-evolutiva',{formularioId:forms.SOCIAL,accion:'x',contenido:'x',fechaAtencion:'2026-10-27T10:00:00Z',profesionalId:'1'},403);
 process.env.P3_TEST_AREA='Trabajo Social';
 await call('PATCH','/entradas-evolutivas/'+entry.id,{version:1,motivo:'Cruce',contenido:'x'},403);
 await call('GET','/entradas-evolutivas/'+entry.id+'/revisiones',undefined,403);
 process.env.P3_TEST_AREA='Legal';process.env.P3_TEST_ROLE='PROFESIONAL';
 await call('GET','/entradas-evolutivas/'+entry.id+'/revisiones',undefined,403);
 process.env.P3_TEST_ROLE='COORDINACION';
});
test('Guardería: se pueden seleccionar todos, pero solo abrir inscritos',async()=>{
 const [ex]=await db.query('SELECT id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=100');
 await db.query("INSERT INTO new_horizons.nino(nino_id,nombre,expediente_id) VALUES(300,'Hijo no inscrito sintético',$1)",[ex.id_expediente]);
 const children=await call('GET','/guarderia/beneficiarias/100/hijos');
 assert.equal(children.datos.find(x=>x.ninoId==='100').inscrito,true);
 assert.equal(children.datos.find(x=>x.ninoId==='300').inscrito,false);
 await call('GET','/guarderia/hijos/300/fichas',undefined,404);
});
test('Seguimientos: borrador bloqueado, acción libre y cambios auditados',async()=>{
 const draft=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-27T10:00:00Z',profesionalId:'1',detalle:{}},201);
 await call('POST','/beneficiarias/100/hoja-evolutiva',{formularioId:draft.id,accion:'Acción libre',contenido:'Prueba',fechaAtencion:'2026-10-27T10:00:00Z',profesionalId:'1'},409);
});
test('Resumen Social satisface los campos disponibles del mockup sin datos inventados',async()=>{
 const r=await call('GET','/trabajo-social/beneficiarias/100/resumen');
 assert.equal(r.beneficiaria.nombre,'Beneficiaria histórica sintética');assert.equal(r.ultimaFicha.estadoCodigo,'P3_CONFIRMADO');assert.ok(r.ultimaFicha.actualizadoEn);assert.ok(r.historialReciente.length);assert.equal(r.totalRiesgos,null);assert.ok(r.camposSinSoporte.includes('fechaRevision'));
});
test('Contrato: las 14 rutas P3 coinciden exactamente con la página 4 del PDF',()=>{
 const fs=require('node:fs');const {PATH_METADATA,METHOD_METADATA}=require('@nestjs/common/constants');const {RequestMethod}=require('@nestjs/common');
 const classes=[require('../dist/modules/formularios/legal/legal.controller').LegalController,require('../dist/modules/formularios/social/social.controller').SocialController,require('../dist/modules/formularios/guarderia/guarderia.controller').GuarderiaController,require('../dist/modules/evolucion/evolucion.controller').EvolucionController];
 const actual=classes.flatMap(cls=>Object.getOwnPropertyNames(cls.prototype).filter(n=>n!=='constructor'&&Reflect.hasMetadata(METHOD_METADATA,cls.prototype[n])).map(n=>({metodo:RequestMethod[Reflect.getMetadata(METHOD_METADATA,cls.prototype[n])],ruta:'/'+Reflect.getMetadata(PATH_METADATA,cls.prototype[n])})));
 const expected=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'fixtures/rutas-persona3.json'),'utf8'));
 const ordered=a=>a.map(x=>x.metodo+' '+x.ruta).sort();assert.deepEqual(ordered(actual),ordered(expected));
});
async function cargarPdf({beneficiaria='100',formularioId=forms.LEGAL,bytes,mime='application/pdf',nombre='documento.pdf',categoria='Referencia sintética'},status){
 const fs=require('node:fs'),path=require('node:path');
 const data=new FormData();data.set('formularioId',formularioId);data.set('categoria',categoria);
 data.set('archivo',new Blob([bytes??fs.readFileSync(path.join(__dirname,'fixtures/documento.pdf'))],{type:mime}),nombre);
 const r=await fetch(url+'/beneficiarias/'+beneficiaria+'/documentos/cargas',{method:'POST',body:data});
 const body=await r.json();assert.equal(r.status,status,JSON.stringify(body));if(status>=400)comprobarError(r,body);return body;
}
test('PDF: sube original, se asocia a su ficha/expediente y guarda auditoría',async()=>{
 const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');process.env.P3_TEST_AREA='Legal';
 const doc=await cargarPdf({},201);
 const [stored]=await db.query('SELECT d.*,f.expediente_id FROM new_horizons.documento_area d JOIN new_horizons.formulario_area f ON f.id=d.formulario_id WHERE d.id=$1',[doc.id]);
 assert.equal(doc.formularioId,forms.LEGAL);assert.equal(doc.expedienteId,stored.expediente_id);assert.ok(!Object.hasOwn(doc,'objetoPrivado'));
 const original=fs.readFileSync(path.join(__dirname,'fixtures/documento.pdf'));assert.deepEqual(fs.readFileSync(stored.objeto_privado),original);assert.equal(doc.sha256,crypto.createHash('sha256').update(original).digest('hex'));
 const [audit]=await db.query("SELECT actor_id FROM new_horizons.revision_registro WHERE tabla='documento_area' AND registro_id=$1",[doc.id]);assert.equal(audit.actor_id,'1');
});
test('PDF: rechaza imagen, archivo falso, más de 20 MiB, expediente ajeno y otra área',async()=>{
 await cargarPdf({bytes:Buffer.from('imagen'),mime:'image/png',nombre:'documento.png'},415);
 await cargarPdf({bytes:Buffer.from('%PDF-falso')},422);
 await cargarPdf({bytes:Buffer.alloc(20*1024*1024+1)},413);
 await cargarPdf({beneficiaria:'200'},404);
 await cargarPdf({formularioId:forms.SOCIAL},403);
 await cargarPdf({categoria:' '},400);
});


test('Listas: total representa todos los resultados filtrados, incluso en página vacía',async()=>{
 process.env.P3_TEST_AREA='Legal';
 const rutas=['/trabajo-social/beneficiarias/100/fichas','/legal/beneficiarias/100/fichas','/legal/beneficiarias/100/referencias','/guarderia/beneficiarias/100/hijos','/guarderia/hijos/100/fichas','/beneficiarias/100/hoja-evolutiva','/entradas-evolutivas/'+entry.id+'/revisiones'];
 for(const ruta of rutas){
  const completa=await call('GET',ruta+'?limite=100');
  const primera=await call('GET',ruta+'?limite=1');
  const vacia=await call('GET',ruta+'?limite=1&pagina=100000');
  assert.equal(completa.total,completa.datos.length,ruta);
  assert.equal(primera.total,completa.total,ruta);assert.ok(primera.datos.length<=1);
  assert.equal(vacia.total,completa.total,ruta);assert.deepEqual(vacia.datos,[],ruta);
 }
 const sinAtenciones=await call('GET','/beneficiarias/100/hoja-evolutiva?hijoId=100');
 assert.equal(sinAtenciones.total,0);assert.deepEqual(sinAtenciones.datos,[]);
 process.env.P3_TEST_AREA='Guardería';
 const infantil=await call('GET','/beneficiarias/100/hoja-evolutiva?hijoId=100');
 assert.equal(infantil.total,1);assert.equal(infantil.datos[0].ninoId,'100');
 process.env.P3_TEST_AREA='Legal';
});
test('Borrador mínimo: beneficiaria, fecha y profesional; textos opcionales',async()=>{
 const draft=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-29T09:00:00-06:00',profesionalId:'1'},201);
 assert.equal(draft.beneficiariaId,'100');assert.equal(draft.estadoCodigo,'P3_BORRADOR');assert.ok(Object.values(draft.detalle).every(v=>v===null));
 const [before]=await db.query('SELECT count(*) AS total FROM new_horizons.revision_registro WHERE registro_id=$1 AND tabla=\'formulario_area\'',[draft.id]);
 const rejection=await call('POST','/legal/referencias/'+draft.id+'/confirmar',{version:draft.version,motivo:'Confirmación incompleta'},400);
 assert.deepEqual(rejection.errores.map(e=>e.campo).sort(),['detalle.destino','detalle.motivoReferencia']);
 const same=await call('GET','/legal/referencias/'+draft.id);assert.equal(same.version,draft.version);assert.equal(same.estadoCodigo,'P3_BORRADOR');
 const [after]=await db.query('SELECT count(*) AS total FROM new_horizons.revision_registro WHERE registro_id=$1 AND tabla=\'formulario_area\'',[draft.id]);assert.equal(after.total,before.total);
 for(const body of [{profesionalId:'1'},{fechaAtencion:'2026-10-29T09:00:00-06:00'}])await call('POST','/legal/beneficiarias/100/referencias',body,400);
});
test('Confirmación: exige destino y motivo reales; origen y recomendaciones opcionales',async()=>{
 let draft=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'2026-10-29T09:00:00-06:00',profesionalId:'1',detalle:{destino:'  ',motivoReferencia:'Orientación sintética'}},201);
 const rejected=await call('POST','/legal/referencias/'+draft.id+'/confirmar',{version:draft.version,motivo:'Confirmar'},400);assert.equal(rejected.errores[0].campo,'detalle.destino');
 draft=await call('PATCH','/legal/referencias/'+draft.id,{version:draft.version,motivo:'Completar destino',detalle:{destino:'Institución sintética'}});
 let confirmed=await call('POST','/legal/referencias/'+draft.id+'/confirmar',{version:draft.version,motivo:'Confirmar completa'},201);
 assert.equal(confirmed.estadoCodigo,'P3_CONFIRMADO');assert.equal(confirmed.detalle.origen,null);assert.equal(confirmed.detalle.recomendaciones,null);
 for(const detalle of [{destino:null},{motivoReferencia:'   '}])await call('PATCH','/legal/referencias/'+draft.id,{version:confirmed.version,motivo:'Vaciar dato obligatorio',detalle},400);
 const intact=await call('GET','/legal/referencias/'+draft.id);assert.equal(intact.version,confirmed.version);assert.equal(intact.estadoCodigo,'P3_CONFIRMADO');assert.equal(intact.detalle.destino,'Institución sintética');
 confirmed=await call('PATCH','/legal/referencias/'+draft.id,{version:confirmed.version,motivo:'Corregir sin perder completitud',detalle:{destino:'Otro destino válido'}});assert.equal(confirmed.estadoCodigo,'P3_CONFIRMADO');
});

function comprobarError(r,data,codigo){
 assert.deepEqual(Object.keys(data).sort(),['estado','codigo','mensaje','errores','idSolicitud'].sort());
 assert.equal(data.estado,r.status);if(codigo)assert.equal(data.codigo,codigo);
 const {CATALOGO}=require('../dist/common/errors/catalogo');assert.equal(data.mensaje,CATALOGO[data.codigo].mensaje);
 assert.match(data.idSolicitud,/^SOL-[0-9a-f-]{36}$/);assert.equal(r.headers.get('X-Id-Solicitud'),data.idSolicitud);
 for(const detalle of data.errores){assert.deepEqual(Object.keys(detalle).sort(),['campo','mensaje']);assert.equal(typeof detalle.campo,'string');assert.equal(typeof detalle.mensaje,'string');}
}
test('Errores: JSON inválido, cuerpo grande, ruta ausente e ID propio del servidor',async()=>{
 for(const [path,body,estado,codigo] of [['/legal/beneficiarias/100/referencias','{"dato":',400,'JSON_INVALIDO'],['/legal/beneficiarias/100/referencias',JSON.stringify({dato:'x'.repeat(110000)}),413,'SOLICITUD_DEMASIADO_GRANDE']]){
  const r=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json','X-Id-Solicitud':'ID-CLIENTE'},body});assert.equal(r.status,estado);comprobarError(r,await r.json(),codigo);
 }
 const r=await fetch(url+'/ruta-inexistente');assert.equal(r.status,404);comprobarError(r,await r.json(),'RUTA_NO_ENCONTRADA');
 const a=await call('GET','/legal/beneficiarias/letras/fichas',undefined,400),b=await call('GET','/legal/beneficiarias/letras/fichas',undefined,400);assert.notEqual(a.idSolicitud,b.idSolicitud);assert.equal(a.codigo,'IDENTIFICADOR_INVALIDO');
});
test('Errores: detalle anidado español sin valores y conflicto de versión específico',async()=>{
 const data=await call('POST','/legal/beneficiarias/100/referencias',{fechaAtencion:'fecha-secreta',profesionalId:'1',detalle:{destino:123,campoInventado:'VALOR_PRIVADO'}},400);
 assert.equal(data.codigo,'DATOS_INVALIDOS');assert.ok(data.errores.some(e=>e.campo==='detalle.destino'));assert.ok(data.errores.some(e=>e.campo==='detalle.campoInventado'));assert.ok(!JSON.stringify(data).includes('VALOR_PRIVADO'));assert.ok(!JSON.stringify(data).includes('must be'));
 const stale=await call('PATCH','/legal/referencias/'+reference.id,{version:1,motivo:'Obsoleta',detalle:{destino:'Cambio'}},409);assert.equal(stale.codigo,'VERSION_DESACTUALIZADA');
});
test('Errores: fallo interno y desconexión de BD no filtran SQL ni datos',async()=>{
 const {Persona3Repository}=require('../dist/modules/persona3/persona3.repository');const repo=app.get(Persona3Repository),original=repo.expediente;
 try{
  for(const [error,estado,codigo] of [[new Error('SELECT CUI DATOS_PRIVADOS'),500,'ERROR_INTERNO'],[Object.assign(new Error('conexión privada'),{code:'ECONNREFUSED'}),503,'BASE_DATOS_NO_DISPONIBLE']]){
   repo.expediente=async()=>{throw error;};const data=await call('GET','/legal/beneficiarias/100/fichas',undefined,estado);assert.equal(data.codigo,codigo);assert.ok(!JSON.stringify(data).includes('DATOS_PRIVADOS'));
  }
 }finally{repo.expediente=original;}
});
test('Errores: PDF requerido, vacío, tipo, ilegible, límite y estructura multipart',async()=>{
 const required=await call('POST','/beneficiarias/100/documentos/cargas',{formularioId:forms.LEGAL,categoria:'Prueba'},400);assert.equal(required.codigo,'ARCHIVO_REQUERIDO');
 assert.equal((await cargarPdf({bytes:Buffer.alloc(0)},400)).codigo,'ARCHIVO_VACIO');
 assert.equal((await cargarPdf({bytes:Buffer.from('imagen'),mime:'image/png',nombre:'x.png'},415)).codigo,'TIPO_ARCHIVO_NO_PERMITIDO');
 assert.equal((await cargarPdf({bytes:Buffer.from('%PDF-falso')},422)).codigo,'PDF_INVALIDO');
 assert.equal((await cargarPdf({bytes:require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/protegido.pdf'))},422)).codigo,'PDF_PROTEGIDO');
 assert.equal((await cargarPdf({bytes:Buffer.alloc(20*1024*1024+1)},413)).codigo,'ARCHIVO_DEMASIADO_GRANDE');
 const f=new FormData();f.set('archivoErroneo',new Blob(['dato']),'x.pdf');const r=await fetch(url+'/beneficiarias/100/documentos/cargas',{method:'POST',body:f});assert.equal(r.status,400);comprobarError(r,await r.json(),'FORMATO_INVALIDO');
});

test('Errores: disco no disponible y compensación documental según certeza del guardado',async()=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
 const {Persona3Repository}=require('../dist/modules/persona3/persona3.repository'),{ErrorApi}=require('../dist/common/errors/error-api');
 const repo=app.get(Persona3Repository),original=repo.transaction,prev=process.env.P3_DOCUMENTS_DIR;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'p3-errores-'));
 try{
  const blocker=path.join(dir,'archivo');fs.writeFileSync(blocker,'prueba');process.env.P3_DOCUMENTS_DIR=path.join(blocker,'subcarpeta');
  const unavailable=await cargarPdf({},503);assert.equal(unavailable.codigo,'ALMACENAMIENTO_NO_DISPONIBLE');
  process.env.P3_DOCUMENTS_DIR=path.join(dir,'documentos');
  repo.transaction=async()=>{throw new ErrorApi('RELACION_INCOMPATIBLE');};await cargarPdf({},409);assert.equal(fs.readdirSync(process.env.P3_DOCUMENTS_DIR).length,0);
  repo.transaction=async()=>{throw new ErrorApi('RESULTADO_OPERACION_INCIERTO');};const uncertain=await cargarPdf({},503);assert.equal(uncertain.codigo,'RESULTADO_OPERACION_INCIERTO');assert.equal(fs.readdirSync(process.env.P3_DOCUMENTS_DIR).length,1);
 }finally{repo.transaction=original;if(prev===undefined)delete process.env.P3_DOCUMENTS_DIR;else process.env.P3_DOCUMENTS_DIR=prev;for(const file of fs.readdirSync(path.join(dir,'documentos'),{withFileTypes:true}))fs.unlinkSync(path.join(dir,'documentos',file.name));fs.rmdirSync(path.join(dir,'documentos'));fs.unlinkSync(path.join(dir,'archivo'));fs.rmdirSync(dir);}
});

test('Postman: errores normalizados contra HTTP real',async()=>{
 const newman=require('newman');const path=require('node:path');
 const summary=await new Promise((resolve,reject)=>newman.run({collection:path.join(__dirname,'../postman/Errores.postman_collection.json'),envVar:[{key:'baseUrl',value:url}],reporters:[]},(e,s)=>e?reject(e):resolve(s)));
 assert.equal(summary.run.failures.length,0,JSON.stringify(summary.run.failures));assert.equal(summary.run.stats.requests.total,3);
 require('node:fs').writeFileSync(path.join(__dirname,'../test-results/newman-errores.json'),JSON.stringify({peticiones:summary.run.stats.requests,comprobaciones:summary.run.stats.assertions,fallos:summary.run.failures},null,2));
});

const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {NestFactory}=require('@nestjs/core');
const {DataSource}=require('typeorm');
const {AppModule}=require('../dist/app.module');
const {configurarTransporteApi}=require('../dist/common/errors/transporte');
let app,db,url,estancia;
before(async()=>{app=await NestFactory.create(AppModule,{logger:false});configurarTransporteApi(app);app.setGlobalPrefix('api');await app.listen(0,'127.0.0.1');url=await app.getUrl()+'/api/v1';db=app.get(DataSource);await db.query("INSERT INTO new_horizons.estado_albergue(nombre) VALUES ('Activo'),('Inactivo')");});
after(async()=>{if(app)await app.close()});
async function call(method,path,body,status=200){const r=await fetch(url+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
test('Albergue: ingreso y consultas usan las rutas del frontend',async()=>{estancia=await call('POST','/albergue/estancias',{beneficiariaId:'100',ninoIds:['100']},201);assert.equal(estancia.beneficiariaId,'100');const lista=await call('GET','/albergue/estancias?pagina=1&limite=20');assert.ok(lista.datos.some(d=>d.id===estancia.id));assert.equal((await call('GET','/albergue/estancias/'+estancia.id)).id,estancia.id);assert.equal((await call('GET','/albergue/resumen')).estanciasActivas,1);assert.equal((await call('GET','/albergue/estados')).length,2);const duplicada=await call('POST','/albergue/estancias',{beneficiariaId:'100'},409);assert.equal(duplicada.codigo,'ESTANCIA_ACTIVA_EXISTENTE');});
test('Albergue: salida, bloqueo de egreso, retorno e historial',async()=>{await call('POST',`/albergue/estancias/${estancia.id}/salidas-temporales`,{destino:'Destino sintetico'},201);assert.equal((await call('GET','/albergue/salidas-temporales/pendientes')).length,1);await call('POST',`/albergue/estancias/${estancia.id}/egreso`,{motivo:'Egreso sintético'},409);await call('POST',`/albergue/estancias/${estancia.id}/retornos`,undefined,201);assert.equal((await call('GET','/albergue/salidas-temporales/pendientes')).length,0);const h=await call('GET','/albergue/movimientos');assert.equal(h.datos[0].estadoMovimiento,'COMPLETADO');});
test('Albergue: nacimiento vinculado y egreso definitivo',async()=>{const n=await call('POST',`/albergue/estancias/${estancia.id}/nacimientos`,{nombre:'Hija sintetica albergue',fechaNacimiento:'2026-10-01',genero:'F'},201);assert.ok(n.id);const detalle=await call('GET','/albergue/estancias/'+estancia.id);assert.ok(detalle.menoresAsociados.some(h=>h.ninoId===n.id));const hijos=await call('GET','/beneficiarias/100/hijos');assert.ok(hijos.data.some(h=>h.id===n.id));const egreso=await call('POST',`/albergue/estancias/${estancia.id}/egreso`,{motivo:'Egreso sintético'},201);assert.ok(egreso.fechaEgreso);await call('POST',`/albergue/estancias/${estancia.id}/retornos`,undefined,409);});
test('Albergue: valida paginacion e identificadores sin SQL fallido',async()=>{await call('GET','/albergue/estancias?pagina=0',undefined,400);await call('GET','/albergue/estancias/no-valido',undefined,400);await call('GET','/albergue/movimientos?limite=101',undefined,400);});

test('Integración: consultas médicas conservan el prefijo común',async()=>{const mujer=await call('GET','/medicina/beneficiarias/100/fichas');assert.ok(Array.isArray(mujer.data));assert.ok(mujer.data.length>0);const hijo=await call('GET','/medicina/hijos/100/fichas');assert.ok(Array.isArray(hijo.data));});

test('Albergue UI: historial completo, filtros y menores cerrados con egreso',async()=>{
 const h=await call('GET','/albergue/historial?pagina=1&limite=2');assert.equal(h.datos.length,2);assert.equal(h.paginacion.total,5);
 const tipos=await call('GET','/albergue/historial?tipo=RETORNO');assert.equal(tipos.paginacion.total,1);assert.equal(tipos.datos[0].tipo,'RETORNO');
 const eg=await call('GET','/albergue/historial?tipo=EGRESO');assert.equal(eg.datos[0].motivo,'Egreso sintético');assert.ok(eg.datos[0].responsable);
 const resumen=await call('GET','/albergue/resumen');assert.equal(resumen.menoresActivos,0);
 const det=await call('GET','/albergue/estancias/'+estancia.id);assert.ok(det.menoresAsociados.length>=2);assert.ok(det.menoresAsociados.every(n=>n.fechaEgreso));
 await call('GET','/albergue/historial?desde=2026-02-30',undefined,400);await call('GET','/albergue/historial?desde=2026-11-20&hasta=2026-11-01',undefined,400);
 await call('POST',`/albergue/estancias/${estancia.id}/egreso`,{motivo:'   '},400);
 await call('GET','/albergue/estancias/9999999999999999999999999',undefined,400);
});
test('Albergue: hijo de otro expediente revierte ingreso completo',async()=>{
 await call('POST','/albergue/estancias',{beneficiariaId:'100',ninoIds:['200']},400);
 const l=await call('GET','/albergue/estancias?estado=ACTIVAS');assert.equal(l.paginacion.total,0);
 const h=await call('GET','/albergue/historial');assert.equal(h.paginacion.total,5);
});

test('Albergue: búsqueda por cuerpo, paginación y privacidad de CUI',async()=>{
 const r=await call('POST','/albergue/estancias/buscar',{pagina:1,limite:1,estado:'TODAS',buscar:'histórica'} ,201);assert.ok(r.datos.length>0);assert.ok(!Object.hasOwn(r.datos[0],'cui'));assert.ok(r.paginacion.total>0);
 await call('POST','/albergue/estancias/buscar',{pagina:0,buscar:'prueba'},400);
});

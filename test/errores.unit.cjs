const {test}=require('node:test');const assert=require('node:assert/strict');
const {HttpException,Logger}=require('@nestjs/common');Logger.overrideLogger(false);
const {ErrorApi}=require('../dist/common/errors/error-api');
const {clasificarError,ErroresApiFilter}=require('../dist/common/errors/errores.filter');
const {Persona3Repository}=require('../dist/modules/persona3/persona3.repository');
test('Catálogo: 66 códigos y respaldo seguro para excepciones no reconocidas',()=>{
 const {CATALOGO}=require('../dist/common/errors/catalogo');assert.equal(Object.keys(CATALOGO).length,66);
 for(const [codigo,value] of Object.entries(CATALOGO)){const e=new ErrorApi(codigo);assert.equal(e.getStatus(),value.estado);assert.equal(clasificarError(e).codigo,codigo);}
 for(const e of [new Error('SQL privado'),new HttpException('detalle interno',503),'valor privado',null,42])assert.deepEqual(clasificarError(e),{codigo:'ERROR_INTERNO',estado:500});
 assert.deepEqual(clasificarError(new HttpException('desconocido',418)),{codigo:'SOLICITUD_RECHAZADA',estado:418});
});
test('Filtro: no envía un segundo JSON después de iniciar la respuesta',()=>{
 let cerrado=false;const res={headersSent:true,destroyed:false,destroy(){cerrado=true;},status(){throw Error('Segundo JSON');}};
 const host={switchToHttp:()=>({getRequest:()=>({idSolicitud:'SOL-prueba'}),getResponse:()=>res})};new ErroresApiFilter().catch(new Error('privado'),host);assert.equal(cerrado,true);
});
function repositorio({commitError,rollbackError,queryError}={}){
 const runner={isTransactionActive:false,manager:{query:async()=>{}},connect:async()=>{},startTransaction:async()=>{runner.isTransactionActive=true;},commitTransaction:async()=>{if(commitError)throw commitError;runner.isTransactionActive=false;},rollbackTransaction:async()=>{if(rollbackError)throw rollbackError;runner.isTransactionActive=false;},release:async()=>{}};
 return new Persona3Repository({createQueryRunner:()=>runner});
}
test('Transacción: commit perdido o rollback no confirmado usa resultado incierto',async()=>{
 process.env.NODE_ENV='test';process.env.P3_TEST_ACTOR_ID='1';
 for(const options of [{commitError:Object.assign(new Error('privado'),{code:'ECONNRESET'})},{rollbackError:new Error('sin confirmación')}]){
  const repo=repositorio(options);await assert.rejects(repo.transaction('Prueba',async()=>{if(options.rollbackError)throw new Error('falló');return {}; }),e=>e instanceof ErrorApi&&e.codigo==='RESULTADO_OPERACION_INCIERTO');
 }
});
test('Transacción: restricciones desconocidas no se convierten en conflictos de negocio',async()=>{
 const repo=repositorio();for(const code of ['23505','23514','P0001']){const error={driverError:{code,constraint:'desconocida',message:'dato privado'}};await assert.rejects(repo.transaction('Prueba',async()=>{throw error;}),e=>e===error);}
 const error={driverError:{code:'23503',constraint:'formulario_area_profesional_id_fkey'}};
 await assert.rejects(repo.transaction('Prueba',async()=>{throw error;}),e=>e.codigo==='RELACION_INCOMPATIBLE');
 for(const code of ['40001','40P01'])await assert.rejects(repo.transaction('Prueba',async()=>{throw {driverError:{code}};}),e=>e.codigo==='BASE_DATOS_NO_DISPONIBLE');
});

test('Cliente: red, JSON ajeno y códigos desconocidos tienen respaldo español',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const context=vm.createContext({document:{getElementById:()=>({value:'',disabled:false})},FormData,fetch:async()=>{throw new Error('Network failure');}});
 vm.runInContext(fs.readFileSync('public/errores-api.js','utf8'),context);vm.runInContext(fs.readFileSync('public/persona3.js','utf8'),context);
 await assert.rejects(vm.runInContext("api('/prueba')",context),e=>e.contrato.codigo==='SIN_CONEXION'&&e.contrato.estado===null);
 await assert.rejects(vm.runInContext("api('/prueba','POST',{})",context),e=>e.contrato.codigo==='RESPUESTA_NO_RECIBIDA');
 context.fetch=async()=>({status:502,json:async()=>{throw Error('HTML privado');}});
 await assert.rejects(vm.runInContext("api('/prueba')",context),e=>e.contrato.codigo==='RESPUESTA_NO_VALIDA'&&!e.message.includes('HTML privado'));
 context.fetch=async()=>({status:400,ok:false,json:async()=>({estado:400,codigo:'DESCONOCIDO',mensaje:'PRIVATE',errores:[],idSolicitud:'SOL-prueba'})});
 await assert.rejects(vm.runInContext("api('/prueba')",context),e=>e.contrato.codigo==='RESPUESTA_NO_VALIDA'&&!e.message.includes('PRIVATE'));
 context.fetch=async()=>({status:400,ok:false,json:async()=>({estado:400,codigo:'DATOS_INVALIDOS',mensaje:'Revisar',errores:[null],idSolicitud:'SOL-prueba'})});
 await assert.rejects(vm.runInContext("api('/prueba')",context),e=>e.contrato.codigo==='RESPUESTA_NO_VALIDA');
 assert.equal(vm.runInContext("mensajeVisible(new Error('English private error'))",context),'No se pudo mostrar esta sección. Vuelve a abrirla o comunícate con soporte.');
});

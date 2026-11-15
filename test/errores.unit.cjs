const {test}=require('node:test');const assert=require('node:assert/strict');
const {HttpException,Logger}=require('@nestjs/common');Logger.overrideLogger(false);
const {ErrorApi}=require('../dist/common/errors/error-api');
const {clasificarError,ErroresApiFilter}=require('../dist/common/errors/errores.filter');
const {RegistroAreaRepository}=require('../dist/common/registros-area/registro-area.repository');
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
 const runner={isTransactionActive:false,manager: {
  query: async (sql) =>
    sql.includes("FROM new_horizons.usuario")
      ? [{ id: "1" }]
      : [],
},connect:async()=>{},startTransaction:async()=>{runner.isTransactionActive=true;},commitTransaction:async()=>{if(commitError)throw commitError;runner.isTransactionActive=false;},rollbackTransaction:async()=>{if(rollbackError)throw rollbackError;runner.isTransactionActive=false;},release:async()=>{}};
 return new RegistroAreaRepository({createQueryRunner:()=>runner});
}
test('Transacción: commit perdido o rollback no confirmado usa resultado incierto',async()=>{
 process.env.NODE_ENV='test';process.env.AUDIT_ACTOR_USERNAME = "laboratorio-local";
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

test('Integración: códigos heredados de main mantienen conflicto en español',()=>{
 const {ConflictException}=require('@nestjs/common');
 assert.deepEqual(clasificarError(new ConflictException({code:'VERSION_CONFLICT'})),{codigo:'VERSION_DESACTUALIZADA',estado:409});
});

test('Integración: laboratorio ausente incluso con variable antigua activada',()=>{
 const {spawnSync}=require('node:child_process');
 for(const flag of ['false','true']){
  const r=spawnSync(process.execPath,['-e',"require('reflect-metadata');const {AppModule}=require('./dist/app.module');const xs=Reflect.getMetadata('imports',AppModule)||[];console.log(xs.some(x=>x?.name==='LaboratorioModule'))"],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'test',AREA_ENABLE_LAB:flag},encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),'false');
 }
});

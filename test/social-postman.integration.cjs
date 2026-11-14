const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {NestFactory}=require('@nestjs/core');
const {AppModule}=require('../dist/app.module');
const {configurarTransporteApi}=require('../dist/common/errors/transporte');
let app,url;
before(async()=>{process.env.AREA_TEST_NOMBRE='Trabajo Social';process.env.AREA_TEST_ROL='COORDINACION';app=await NestFactory.create(AppModule,{logger:false});app.setGlobalPrefix('api');configurarTransporteApi(app);await app.listen(0,'127.0.0.1');url=await app.getUrl()+'/api/v1';});
after(async()=>{if(app)await app.close();});
test('Social Postman: colección completa contra PostgreSQL y HTTP reales',async()=>{
 const previous=process.env.AREA_TEST_NOMBRE;
 process.env.AREA_TEST_NOMBRE='Trabajo Social';
 try {
  const path=require('node:path');
  const summary=await new Promise((resolve,reject)=>require('newman').run({
   collection:path.join(__dirname,'../postman/Social.postman_collection.json'),
   workingDir:path.join(__dirname,'..'),
   envVar:[{key:'baseUrl',value:url},{key:'beneficiariaId',value:'100'},{key:'profesionalId',value:'1'}],
   reporters:[]
  },(error,result)=>error?reject(error):resolve(result)));
  const result={peticiones:summary.run.stats.requests,comprobaciones:summary.run.stats.assertions,
   fallos:summary.run.failures.map(f=>({nombre:f.source?.name,prueba:f.error?.test,mensaje:f.error?.message}))};
  require('node:fs').writeFileSync(path.join(__dirname,'../test-results/social-newman.json'),JSON.stringify(result,null,2));
  assert.equal(summary.run.stats.requests.total,30);
  assert.equal(summary.run.failures.length,0,JSON.stringify(result.fallos));
 } finally {process.env.AREA_TEST_NOMBRE=previous;}
});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('Albergue: controladores y servicios no ejecutan persistencia',()=>{
 for(const module of ['albergue'])for(const f of files('src/modules/'+module).filter(f=>/\.(service|controller)\.ts$/.test(f))){assert.doesNotMatch(fs.readFileSync(f,'utf8'),/\.query\s*\(|\.createQueryBuilder\s*\(|\.getRepository\s*\(/,f);}
});
test('Albergue: no dependen de implementaciones privadas de otras áreas',()=>{
 for(const module of ['albergue'])for(const f of files('src/modules/'+module).filter(f=>f.endsWith('.ts'))){assert.doesNotMatch(fs.readFileSync(f,'utf8'),/from\s+["'][^"']*(?:formularios\/(?:legal|social|guarderia)\/|evolucion\/dto)/,f);}
});
test('Albergue: la identidad técnica no permite escribir en producción',async()=>{
 const {AlbergueRepository}=require('../dist/modules/albergue/repositories/albergue.repository');const previous=process.env.NODE_ENV;process.env.NODE_ENV='production';let queries=0;try{const repo=new AlbergueRepository({}, {get:()=> 'production'});await assert.rejects(repo.actor({query:()=>{queries++;}}),e=>e.codigo==='CONFIGURACION_INCOMPLETA');assert.equal(queries,0);}finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});

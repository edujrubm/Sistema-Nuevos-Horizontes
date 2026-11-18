const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('Documentos: controladores y servicios no ejecutan persistencia',()=>{
 for(const module of ['documentos'])for(const f of files('src/modules/'+module).filter(f=>/\.(service|controller)\.ts$/.test(f))){assert.doesNotMatch(fs.readFileSync(f,'utf8'),/\.query\s*\(|\.createQueryBuilder\s*\(|\.getRepository\s*\(/,f);}
});
test('Documentos: no dependen de implementaciones privadas de otras áreas',()=>{
 for(const module of ['documentos'])for(const f of files('src/modules/'+module).filter(f=>f.endsWith('.ts'))){assert.doesNotMatch(fs.readFileSync(f,'utf8'),/from\s+["'][^"']*(?:formularios\/(?:legal|social|guarderia)\/|evolucion\/dto)/,f);}
});

test('Documentos: un niño ausente nunca amplía la consulta de inscripción',async()=>{const {DocumentosRepository}=require('../dist/modules/documentos/repositories/documentos.repository');let calls=0;const repository=new DocumentosRepository({}, {manager:{getRepository(){calls++;throw Error('No debe consultar')}}});for(const id of [null,undefined,''])assert.equal(await repository.inscrito(id),false);assert.equal(calls,0);});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const domains=['legal','social','guarderia'];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):/\.tsx?$/.test(e.name)?[path.join(dir,e.name)]:[]);}
function imports(file){const text=fs.readFileSync(file,'utf8');return [...text.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)].map(m=>m[1]);}
for(const domain of domains)test(domain+': no importa la implementación de otra área',()=>{
 for(const relative of ['src/modules/formularios/'+domain,'frontend/src/modules/'+domain])for(const file of files(path.join(root,relative)))for(const spec of imports(file)){
  const resolved=spec.startsWith('.')?path.resolve(path.dirname(file),spec):spec.startsWith('@/')?path.resolve(root,'frontend/src',spec.slice(2)):null;
  if(!resolved)continue;
  for(const other of domains.filter(x=>x!==domain))for(const peer of ['src/modules/formularios/'+other,'frontend/src/modules/'+other]){
   const base=path.resolve(root,peer);assert.ok(resolved!==base&&!resolved.startsWith(base+path.sep),path.relative(root,file)+' importa '+spec);
  }
 }
});
test('El motor compartido no importa implementaciones privadas de áreas',()=>{
 for(const file of files(path.join(root,'src/modules/formularios/shared')))for(const spec of imports(file)){
  if(!spec.startsWith('.'))continue;
  const resolved=path.resolve(path.dirname(file),spec);
  for(const domain of domains){const base=path.resolve(root,'src/modules/formularios',domain);assert.ok(resolved!==base&&!resolved.startsWith(base+path.sep),path.relative(root,file)+' importa '+spec);}
 }
});
test('El router compone entradas públicas independientes',()=>{
 const text=fs.readFileSync(path.join(root,'frontend/src/app/router/router.tsx'),'utf8');
 for(const domain of domains){assert.ok(text.includes('../../modules/'+domain+'/routes'));assert.ok(text.includes('...'+domain+'Routes'));}
 assert.doesNotMatch(text,/modules\/(?:legal|social|guarderia)\/(?:pages|hooks|api|components)/);
});
test('La entidad paterna no invade el módulo Niños',()=>{
 assert.equal(fs.existsSync(path.join(root,'src/modules/ninos/entities/padre-nino.entity.ts')),false);
});


test('Los módulos reconstruidos usan el transporte y el error públicos del equipo',()=>{
 for(const domain of domains){const dir=path.join(root,'frontend/src/modules',domain);for(const file of files(dir)){
  if(/\.test\./.test(file))continue;
  const text=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(text,/from\s*["'][^"']*\/api\/http["']/);
  assert.doesNotMatch(text,/from\s*["'][^"']*useConsulta["']/);
  if(/\/hooks\/use(?:Legal|Social|Guarderia)Editor\.ts$/.test(file.split(path.sep).join('/'))){assert.match(text,/useQuery\(/);assert.match(text,/useMutation\(/);}
 }}
});
test('La fachada publicada no implementa otro transporte ni otra clase de error',()=>{
 const text=fs.readFileSync(path.join(root,'frontend/src/shared/api/http.ts'),'utf8');
 assert.doesNotMatch(text,/\bfetch\s*\(|class\s+ApiError|VITE_API_BASE/);
 assert.match(text,/apiRequest/);
});


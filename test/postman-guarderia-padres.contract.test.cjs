require("reflect-metadata");require("ts-node").register({transpileOnly:true});
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const c=JSON.parse(fs.readFileSync("postman/Guarderia_Padres.postman_collection.json","utf8"));
test("Padres Postman: las tres rutas corresponden al controlador Guardería",()=>{
 const {GuarderiaPadresController:C}=require("../src/modules/formularios/guarderia/guarderia-padres.controller");const {METHOD_METADATA,PATH_METADATA}=require("@nestjs/common/constants");const {RequestMethod}=require("@nestjs/common");
 const prefix=Reflect.getMetadata(PATH_METADATA,C).replace(/^v1\//,"");let count=0;
 for(const name of Object.getOwnPropertyNames(C.prototype)){
 const method=C.prototype[name];if(name==="constructor"||!Reflect.hasMetadata(METHOD_METADATA,method))continue;
 const route=("/"+prefix+"/"+Reflect.getMetadata(PATH_METADATA,method)).replace(/\/+/g,"/").replace(/\/$/,"");
 const pattern=new RegExp("^"+route.replace(/:[^/]+/g,"[^/]+")+"$");const verb=RequestMethod[Reflect.getMetadata(METHOD_METADATA,method)];
 assert.ok(c.item.some(i=>i.request.method===verb&&pattern.test(i.request.url.replace("{{baseUrl}}","").split("?")[0].replace(/{{[^}]+}}/g,"1"))),verb+" "+route);count++;
 }assert.equal(count,3);
});
test("Padres Postman: scripts válidos y bloqueo de destinos externos",()=>{
 for(const item of [c,...c.item])for(const e of item.event||[])new vm.Script(e.script.exec.join("\n"));
 const script=c.event[0].script.exec.join("\n");const context=value=>({pm:{variables:{get:()=>value}}});assert.doesNotThrow(()=>vm.runInNewContext(script,context("http://127.0.0.1:3049/api/v1")));assert.throws(()=>vm.runInNewContext(script,context("https://equipo.example/api/v1")),/laboratorio local/);
});

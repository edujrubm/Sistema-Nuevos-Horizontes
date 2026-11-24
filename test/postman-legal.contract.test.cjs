require("reflect-metadata");require("ts-node").register({transpileOnly:true});
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const {METHOD_METADATA,PATH_METADATA}=require("@nestjs/common/constants");const {RequestMethod}=require("@nestjs/common");
const collection=JSON.parse(fs.readFileSync("postman/Legal.postman_collection.json","utf8"));
function flatten(items){return items.flatMap(item=>[...(item.request?[item]:[]),...flatten(item.item||[])]);}
test("Legal Postman: cubre controladores Legal, formularios y Documentos",()=>{
 const controllers=[require("../src/modules/formularios/legal/legal.controller").LegalController,require("../src/modules/formularios/shared/formulario-shared.controller").FormularioSharedController,require("../src/modules/documentos/documentos.controller").DocumentosController];
 const requests=flatten(collection.item);let count=0;
 for(const controller of controllers)for(const name of Object.getOwnPropertyNames(controller.prototype)){
 const method=controller.prototype[name];if(name==="constructor"||!Reflect.hasMetadata(METHOD_METADATA,method))continue;
 const verb=RequestMethod[Reflect.getMetadata(METHOD_METADATA,method)];const route="/"+Reflect.getMetadata(PATH_METADATA,method);const pattern=new RegExp("^"+route.replace(/:[^/]+/g,"[^/]+")+"$");
 assert.ok(requests.some(item=>item.request.method===verb&&pattern.test(item.request.url.replace("{{baseUrl}}","").split("?")[0].replace(/{{[^}]+}}/g,"1"))),verb+" "+route);count++;
 }
 assert.equal(count,20);
});
test("Legal Postman: scripts conservan sintaxis JavaScript válida",()=>{
 for(const item of [collection,...flatten(collection.item)])for(const event of item.event||[])new vm.Script(event.script.exec.join("\n"));
});

test("Legal Postman: permite solo la API local antes de escribir",()=>{
 const script=collection.event[0].script.exec.join("\n");
 const context=target=>({pm:{variables:{get:()=>target}}});
 assert.doesNotThrow(()=>vm.runInNewContext(script,context("http://127.0.0.1:3050/api/v1")));
 assert.throws(()=>vm.runInNewContext(script,context("https://equipo.example/api/v1")),/API local/);
});

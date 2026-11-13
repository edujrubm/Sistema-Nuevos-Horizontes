const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const collection = JSON.parse(fs.readFileSync(path.join(__dirname,"../postman/Social.postman_collection.json"),"utf8"));

test("Social Postman: los scripts son JavaScript válido y el flujo tiene treinta peticiones", () => {
  assert.equal(collection.item.length,30);
  for (const item of [collection,...collection.item])
    for (const event of item.event || []) new vm.Script(event.script.exec.join("\n"));
});

test("Social Postman: permite loopback y bloquea destinos externos antes de escribir", () => {
  const script = collection.event[0].script.exec.join("\n");
  let redirected, stopped = false;
  const context = target => ({ pm: { variables: { get: () => target }, request: { url: { update: value => { redirected=value; } } } }, postman: { setNextRequest: value => { stopped=value===null; } } });
  vm.runInNewContext(script,context("http://127.0.0.1:3033/api/v1"));
  assert.equal(redirected,undefined);
  assert.throws(() => vm.runInNewContext(script,context("https://example.com/api/v1")), /laboratorio local/);
  assert.equal(redirected,"http://127.0.0.1:1/api/v1/ensayo-bloqueado");
  assert.equal(stopped,true);
});

test("Social Postman: cubre las dieciséis operaciones HTTP reales del alcance", () => {
  require("reflect-metadata");
  const { METHOD_METADATA,PATH_METADATA } = require("@nestjs/common/constants");
  const { RequestMethod } = require("@nestjs/common");
  const { SocialController } = require("../dist/modules/formularios/social/social.controller");
  const { FormularioSharedController } = require("../dist/modules/formularios/shared/formulario-shared.controller");
  const { DocumentosController } = require("../dist/modules/documentos/documentos.controller");
  let total=0;
  for (const controller of [SocialController,FormularioSharedController,DocumentosController]) {
    for (const name of Object.getOwnPropertyNames(controller.prototype)) {
      const method=controller.prototype[name];
      if (name === "constructor" || !Reflect.hasMetadata(METHOD_METADATA,method)) continue;
      total++;
      const verb=RequestMethod[Reflect.getMetadata(METHOD_METADATA,method)];
      const route="/"+Reflect.getMetadata(PATH_METADATA,method);
      const pattern=new RegExp("^"+route.replace(/:[^/]+/g,"[^/]+")+"$");
      assert.ok(collection.item.some(item => item.request.method===verb && pattern.test(item.request.url.replace("{{baseUrl}}","").split("?")[0].replace(/{{[^}]+}}/g,"1"))),verb+" "+route);
    }
  }
  assert.equal(total,16);
});

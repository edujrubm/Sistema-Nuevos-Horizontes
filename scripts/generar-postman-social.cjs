const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const items = [];
const guardar = (name, expression) => `pm.collectionVariables.set(${JSON.stringify(name)}, ${expression});`;
function agregar(name, method, route, status, body, checks = [], multipart = false) {
  const request = { method, header: [], url: "{{baseUrl}}" + route };
  if (body) request.body = multipart ? { mode: "formdata", formdata: body } : {
    mode: "raw", raw: JSON.stringify(body, null, 2).replace(/"{{(versionSocial|versionAnterior|versionDescartable|versionDocumento)}}"/g, "{{$1}}"),
    options: { raw: { language: "json" } },
  };
  const script = [`pm.test("Estado HTTP esperado", () => pm.response.to.have.status(${status}));`];
  if (status >= 400) script.push(
    "const error = pm.response.json();",
    "pm.test('Error público en español y solicitud identificada', () => { pm.expect(error.mensaje).to.be.a('string').and.not.empty; pm.expect(error.idSolicitud).to.match(/^SOL-/); pm.expect(error.errores).to.be.an('array'); });",
  );
  script.push(...checks);
  items.push({ name, request, event: [{ listen: "test", script: { type: "text/javascript", exec: script } }] });
}
const datosFicha = { tipo: "SOCIAL", fechaAtencion: "2026-11-13T09:00:00-06:00", profesionalId: "{{profesionalId}}", detalle: {
  historiaViolencia: "Historia sintética de ensayo", diagnosticoSocial: "Diagnóstico sintético",
  riesgosIdentificados: "Descripción textual sintética", planEliminacionRiesgos: "Plan sintético",
  objetivoGeneral: "Objetivo sintético", actividades: "Actividades sintéticas", evaluacion: "Evaluación sintética",
} };
const fichaBase = "/beneficiarias/{{beneficiariaId}}/formularios-area";
const ficha = "/formularios-area/{{socialId}}";
const documento = "/documentos/{{documentoId}}";
const archivoPdf = () => [
  { key: "formularioId", value: "{{socialId}}", type: "text" },
  { key: "categoria", value: "Copia firmada sintética", type: "text" },
  { key: "fechaDocumento", value: "2026-11-13", type: "text" },
  { key: "archivo", type: "file", src: "test/fixtures/documento.pdf", contentType: "application/pdf" },
];

agregar("01 Catálogo y estados", "GET", "/tipos-formulario", 200, null, [
  "const body=pm.response.json(); pm.test('SOCIAL habilitado y estados disponibles',()=>{pm.expect(body.data.some(f=>f.codigo==='SOCIAL')).to.eql(true);pm.expect(body.estados.listo).to.eql(true);});",
]);
items[0].event.unshift({ listen: "prerequest", script: { type: "text/javascript", exec: [
  "['socialId','versionSocial','versionAnterior','documentoId','documentoOriginal','versionDocumento','descartableId','versionDescartable'].forEach(key=>pm.collectionVariables.unset(key));",
] } });
agregar("02 Resumen de Social", "GET", "/trabajo-social/beneficiarias/{{beneficiariaId}}/resumen", 200, null, [
  "pm.test('Resumen conserva fichas, riesgos e historial',()=>{const b=pm.response.json();pm.expect(b.totalFichas).to.be.a('number');pm.expect(b.totalRiesgos).to.eql(null);pm.expect(b.historialReciente).to.be.an('array');pm.expect(b.historialReciente.length).to.be.at.most(5);});",
]);
agregar("03 Listado histórico con total", "GET", "/trabajo-social/beneficiarias/{{beneficiariaId}}/fichas?pagina=1&limite=20", 200, null, [
  "pm.test('Paginación histórica',()=>{const b=pm.response.json();pm.expect(b.datos).to.be.an('array');pm.expect(b.total).to.be.a('number');pm.expect(b.pagina).to.eql(1);});",
]);
agregar("04 Crear borrador Social", "POST", fichaBase, 201, datosFicha, [
  "const form=pm.response.json().data; pm.test('Ficha Social e identificadores de texto',()=>{pm.expect(form.tipo).to.eql('SOCIAL');pm.expect(form.id).to.match(/^[1-9][0-9]*$/);pm.expect(form.ninoId).to.eql(null);});",
  guardar("socialId", "form.id"), guardar("versionSocial", "form.version"), guardar("versionAnterior", "form.version"),
]);
agregar("05 Consultar ficha", "GET", ficha, 200, null, [
  "pm.test('Detalle institucional persistido',()=>{const f=pm.response.json().data;pm.expect(f.id).to.eql(pm.collectionVariables.get('socialId'));pm.expect(f.detalle.historiaViolencia).to.eql('Historia sintética de ensayo');});",
]);
agregar("06 Guardar cambios con versión", "PATCH", ficha, 200, { version: "{{versionSocial}}", motivo: "Corrección sintética en Postman", detalle: { actividades: "Actividades corregidas", dependenciaEconomica: false } }, [
  "const f=pm.response.json().data;pm.test('Cambio y nueva versión',()=>{pm.expect(f.detalle.actividades).to.eql('Actividades corregidas');pm.expect(f.detalle.dependenciaEconomica).to.eql(false);pm.expect(f.version).to.be.above(Number(pm.collectionVariables.get('versionAnterior')));});",
  guardar("versionSocial", "f.version"),
]);
agregar("07 Rechazar versión anterior", "PATCH", ficha, 409, { version: "{{versionAnterior}}", motivo: "Versión anterior de ensayo", detalle: { actividades: "No debe sobrescribir" } }, ["pm.test('Conflicto de versión específico',()=>pm.expect(error.codigo).to.eql('VERSION_DESACTUALIZADA'));"]);
agregar("08 Listado común por cursor", "GET", fichaBase + "?tipo=SOCIAL&limite=1", 200, null, ["pm.test('Contrato de cursor',()=>{const b=pm.response.json();pm.expect(b.data).to.be.an('array');pm.expect(b.page.hasMore).to.be.a('boolean');pm.expect(b).to.have.property('page');});"]);
agregar("09 Rechazar paginación inválida", "GET", fichaBase + "?tipo=SOCIAL&limite=101", 400);
agregar("10 Rechazar niño en ficha Social", "POST", fichaBase, 400, { ...datosFicha, ninoId: "100" });
agregar("11 Rechazar profesional inexistente", "POST", fichaBase, 400, { ...datosFicha, profesionalId: "999999" }, ["pm.test('Señala profesionalId',()=>pm.expect(error.errores.some(e=>e.campo==='profesionalId')).to.eql(true));"]);
agregar("12 Rechazar coordinación fuera de bigint", "POST", fichaBase, 400, { ...datosFicha, detalle: { areaCoordinacionId: "9223372036854775808" } }, ["pm.test('Señala el campo de coordinación',()=>pm.expect(error.errores.some(e=>e.campo==='detalle.areaCoordinacionId')).to.eql(true));"]);
agregar("13 Rechazar campo no permitido", "POST", fichaBase, 400, { ...datosFicha, detalle: { campoInventado: "Texto sintético" } });
agregar("14 PDF rechazado antes de confirmar", "POST", "/beneficiarias/{{beneficiariaId}}/documentos/cargas", 409, archivoPdf(), ["pm.test('Estado no permitido',()=>pm.expect(error.codigo).to.eql('ESTADO_NO_PERMITIDO'));"], true);
agregar("15 Confirmar ficha guardada", "POST", ficha + "/confirmar", 201, { version: "{{versionSocial}}", motivo: "Confirmación inicial de ficha" }, [
  "const f=pm.response.json().data;pm.test('Confirmada',()=>pm.expect(f.estado).to.match(/CONFIRMADO$/));",guardar("versionSocial", "f.version"),
]);
agregar("16 Rechazar edición normal de confirmada", "PATCH", ficha, 409, { version: "{{versionSocial}}", motivo: "Ensayo de edición no permitida", detalle: { evaluacion: "No debe persistir" } });
agregar("17 Contexto de documentos autorizado", "GET", "/beneficiarias/{{beneficiariaId}}/documentos/contexto", 200, null, ["pm.test('Ficha Social en contexto autorizado',()=>pm.expect(pm.response.json().formularios.some(f=>f.id===pm.collectionVariables.get('socialId')&&f.tipo==='SOCIAL')).to.eql(true));"]);
agregar("18 Adjuntar PDF a la ficha", "POST", "/beneficiarias/{{beneficiariaId}}/documentos/cargas", 201, archivoPdf(), [
  "const d=pm.response.json();pm.test('PDF asociado a su ficha',()=>{pm.expect(d.formularioId).to.eql(pm.collectionVariables.get('socialId'));pm.expect(d.mime).to.eql('application/pdf');pm.expect(d).not.to.have.property('objetoPrivado');});",
  guardar("documentoId", "d.id"),guardar("documentoOriginal", "d.id"),guardar("versionDocumento", "d.versionRegistro"),
], true);
agregar("19 Consultar documento", "GET", documento, 200, null, ["pm.test('Asociación conservada',()=>pm.expect(pm.response.json().formularioId).to.eql(pm.collectionVariables.get('socialId')));"]);
agregar("20 Recuperar archivo PDF privado", "GET", documento + "/archivo", 200, null, ["pm.test('Archivo PDF y sin caché',()=>{pm.expect(pm.response.headers.get('Content-Type')).to.include('application/pdf');pm.expect(pm.response.headers.get('Cache-Control')).to.include('no-store');pm.expect(pm.response.text().startsWith('%PDF-')).to.eql(true);});"]);
agregar("21 Crear versión documental con motivo", "POST", "/beneficiarias/{{beneficiariaId}}/documentos/cargas", 201, [...archivoPdf(),
  {key:"documentoAnteriorId",value:"{{documentoOriginal}}",type:"text"},{key:"motivoCambio",value:"Nueva copia sintética de ensayo",type:"text"},
], ["const d=pm.response.json();pm.test('Segunda versión conserva ficha',()=>{pm.expect(d.versionDocumento).to.eql(2);pm.expect(d.formularioId).to.eql(pm.collectionVariables.get('socialId'));});",guardar("documentoId","d.id"),guardar("versionDocumento","d.versionRegistro")], true);
agregar("22 Historial de versiones", "GET", documento + "/versiones", 200, null, ["pm.test('Dos versiones conservadas',()=>{const b=pm.response.json();pm.expect(b.total).to.eql(2);pm.expect(b.datos.every(d=>d.formularioId===pm.collectionVariables.get('socialId'))).to.eql(true);});"]);
agregar("23 Listado de documentos del área", "GET", "/beneficiarias/{{beneficiariaId}}/documentos?pagina=1&limite=20&ultimas=true", 200, null, ["pm.test('Lista documental paginada',()=>{const b=pm.response.json();pm.expect(b.datos).to.be.an('array');pm.expect(b.total).to.be.a('number');});"]);
agregar("24 Anulación lógica de la versión de ensayo", "POST", documento + "/anular", 201, {version:"{{versionDocumento}}",motivo:"Fin del ensayo documental sintético"}, ["pm.test('Anulación conserva metadatos',()=>{const d=pm.response.json();pm.expect(d.anuladoEn).not.to.eql(null);pm.expect(d.formularioId).to.eql(pm.collectionVariables.get('socialId'));});"]);
agregar("25 Descarga de versión anulada rechazada", "GET", documento + "/archivo", 409, null, ["pm.test('Documento anulado',()=>pm.expect(error.codigo).to.eql('DOCUMENTO_ANULADO'));"]);
agregar("26 Crear borrador descartable", "POST", fichaBase, 201, {...datosFicha,detalle:{}}, ["const f=pm.response.json().data;",guardar("descartableId","f.id"),guardar("versionDescartable","f.version")]);
agregar("27 Descartar borrador con motivo", "POST", "/formularios-area/{{descartableId}}/descartar", 201, {version:"{{versionDescartable}}",motivo:"Fin de prueba de borrador sintético"}, ["pm.test('Descarte lógico',()=>pm.expect(pm.response.json().data.estado).to.match(/DESCARTADO$/));"]);
agregar("28 Consulta conserva el descartado", "GET", "/formularios-area/{{descartableId}}", 200, null, ["pm.test('Detalle conservado',()=>{const f=pm.response.json().data;pm.expect(f.id).to.eql(pm.collectionVariables.get('descartableId'));pm.expect(f.estado).to.match(/DESCARTADO$/);});"]);
agregar("29 Beneficiaria inexistente", "GET", "/trabajo-social/beneficiarias/999999/fichas", 404);
agregar("30 Identificador inválido", "GET", "/trabajo-social/beneficiarias/letras/fichas", 400, null, ["pm.test('Identificador inválido',()=>pm.expect(error.codigo).to.eql('IDENTIFICADOR_INVALIDO'));"]);

const collection = {
  info: { name:"Social — fichas ORM y PDF", description:"Ensayo ordenado sobre una base local desechable con beneficiaria 100 y profesional 1. Requiere contexto técnico de Trabajo Social y coordinación para anular únicamente el PDF creado por esta colección. Crea datos sintéticos; no acredita autorización productiva. Seleccionar test/fixtures/documento.pdf en las tres cargas si Postman solicita acceso local. No incluye escrituras de hoja evolutiva.", schema:"https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  variable:[{key:"baseUrl",value:"http://127.0.0.1:3033/api/v1"},{key:"beneficiariaId",value:"100"},{key:"profesionalId",value:"1"}],
  event:[{listen:"prerequest",script:{type:"text/javascript",exec:[
    String.raw`if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(pm.variables.get('baseUrl'))){pm.request.url.update('http://127.0.0.1:1/api/v1/ensayo-bloqueado');postman.setNextRequest(null);throw new Error('Solo se permite el laboratorio local con datos sintéticos.');}`,
  ]}}], item:items,
};
fs.writeFileSync(path.join(root,"postman/Social.postman_collection.json"),JSON.stringify(collection,null,2)+"\n");
console.log(`Colección Social generada: ${items.length} peticiones.`);

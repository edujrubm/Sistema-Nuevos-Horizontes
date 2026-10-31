const fs=require('node:fs');
const routes=[
 ['GET','/trabajo-social/beneficiarias/{id}/resumen','Resumen social'],
 ['GET','/trabajo-social/beneficiarias/{id}/fichas','Fichas sociales'],
 ['GET','/legal/beneficiarias/{id}/fichas','Fichas legales'],
 ['GET','/legal/beneficiarias/{id}/referencias','Listar referencias'],
 ['POST','/legal/beneficiarias/{id}/referencias','Crear referencia','CrearReferencia'],
 ['GET','/legal/referencias/{id}','Consultar referencia'],
 ['PATCH','/legal/referencias/{id}','Editar referencia','EditarReferencia'],
 ['POST','/legal/referencias/{id}/confirmar','Confirmar referencia','Transicion'],
 ['GET','/guarderia/beneficiarias/{id}/hijos','Hijos del expediente'],
 ['GET','/guarderia/hijos/{id}/fichas','Ficha Guardería'],
 ['POST','/beneficiarias/{id}/hoja-evolutiva','Crear entrada','CrearEntrada'],
 ['GET','/beneficiarias/{id}/hoja-evolutiva','Hoja evolutiva'],
 ['PATCH','/entradas-evolutivas/{id}','Corregir entrada','CorregirEntrada'],
 ['GET','/entradas-evolutivas/{id}/revisiones','Revisiones de entrada'],
];
const id={type:'string',pattern:'^[1-9][0-9]{0,18}$',description:'bigint PostgreSQL hasta 9223372036854775807; nunca number'};
const text=(n)=>({type:'string',maxLength:n});
const nullableText={...text(20000),nullable:true};
const date={type:'string',format:'date-time',description:'Instante ISO8601 con zona horaria explícita'};
const object=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});
const detalle=object({destino:nullableText,origen:nullableText,motivoReferencia:nullableText,recomendaciones:nullableText});
const transition={version:{type:'integer',minimum:1},motivo:{...text(2000),pattern:'\\S'}};
const entry={formularioId:id,accion:{...text(200),pattern:'\\S'},contenido:{...text(20000),pattern:'\\S'},fechaAtencion:date,profesionalId:id,planSeguimiento:nullableText,resultado:nullableText};
const {formularioId,...editableEntry}=entry;
const schemas={CrearReferencia:object({fechaAtencion:date,profesionalId:id,detalle},['fechaAtencion','profesionalId']),EditarReferencia:object({...transition,detalle},['version','motivo','detalle']),Transicion:object(transition,['version','motivo']),CrearEntrada:object(entry,['formularioId','accion','contenido','fechaAtencion','profesionalId']),CorregirEntrada:object({...editableEntry,...transition},['version','motivo'])};
const sample={CrearReferencia:{fechaAtencion:'2026-10-26T10:00:00-06:00',profesionalId:'{{profesionalId}}',detalle:{destino:'Institución sintética',motivoReferencia:'Referencia de prueba'}},EditarReferencia:{version:'__REFERENCE_VERSION__',motivo:'Corrección sintética',detalle:{recomendaciones:'Seguimiento sintético'}},Transicion:{version:'__REFERENCE_VERSION__',motivo:'Confirmación sintética'},CrearEntrada:{formularioId:'{{formularioId}}',accion:'Atención sintética',contenido:'Seguimiento de prueba',fechaAtencion:'2026-10-26T11:00:00-06:00',profesionalId:'{{profesionalId}}'},CorregirEntrada:{version:'__ENTRY_VERSION__',motivo:'Corrección sintética',contenido:'Seguimiento corregido'}};
const paths={},items=[];
for(const [method,path,name,schema] of routes){
 const operation={summary:name,description:'Ruta de persona 3 según el PDF; contrato local de la asignación.',parameters:[{name:'id',in:'path',required:true,schema:id}],responses:{[method==='POST'?'201':'200']:{description:'Operación correcta; respuesta camelCase'},400:{description:'Entrada inválida'},404:{description:'Recurso inexistente o fuera del expediente'},409:{description:'Versión, estado o integridad incompatibles'},503:{description:'Laboratorio o catálogo no configurado'}}};
 if(method==='GET'&&!name.includes('Consultar referencia')&&!name.includes('Resumen')){
  operation.parameters.push(...['pagina','limite'].map((p)=>({name:p,in:'query',schema:{type:'integer',minimum:1,maximum:p==='limite'?100:100000,default:p==='limite'?20:1}})));
 }
 if(name==='Hoja evolutiva') operation.parameters.push(...['area','formularioId','hijoId'].map(p=>({name:p,in:'query',schema:p==='area'?{type:'string',description:'Nombre exacto del área, provisional'}:id})));
 if(schema)operation.requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+schema}}}};
 (paths[path]??={})[method.toLowerCase()]=operation;
 let variable=path.includes('/entradas-evolutivas/')?'entradaId':path.startsWith('/legal/referencias/')?'referenciaId':path.startsWith('/guarderia/hijos/')?'hijoId':'beneficiariaId';
 const raw='{{baseUrl}}'+path.replace('{id}','{{'+variable+'}}');
 const request={method,header:schema?[{key:'Content-Type',value:'application/json'}]:[],url:raw};
 if(schema)request.body={mode:'raw',raw:JSON.stringify(sample[schema],null,2).replace('"__REFERENCE_VERSION__"','{{referenciaVersion}}').replace('"__ENTRY_VERSION__"','{{entradaVersion}}'),options:{raw:{language:'json'}}};
 const lines=[`pm.test('HTTP ${method==='POST'?201:200}',()=>pm.response.to.have.status(${method==='POST'?201:200}));`];
 if(method==='GET'&&!name.includes('Consultar referencia')&&!name.includes('Resumen'))lines.push("pm.test('Lista paginada con total',()=>{const d=pm.response.json();pm.expect(d).to.have.all.keys('datos','pagina','limite','total');pm.expect(d.total).to.be.a('number');pm.expect(d.total).to.be.at.least(d.datos.length);});");
 if(path.includes('/legal/')&&['POST','PATCH'].includes(method))lines.push("if(pm.response.code<300){const d=pm.response.json();pm.collectionVariables.set('referenciaId',d.id);pm.collectionVariables.set('referenciaVersion',d.version);}");
 if(schema==='CrearEntrada'||schema==='CorregirEntrada')lines.push("if(pm.response.code<300){const d=pm.response.json();pm.collectionVariables.set('entradaId',d.id);pm.collectionVariables.set('entradaVersion',d.version);}");
 items.push({name,request,event:[{listen:'test',script:{type:'text/javascript',exec:lines}}]});
}
fs.writeFileSync('docs/persona3/openapi.json',JSON.stringify({openapi:'3.0.3',info:{title:'Persona 3 - Ciclo 2',version:'0.1.0-provisional',description:'Solo pruebas locales sin autenticación. No constituye aprobación institucional de estados ni campos obligatorios.'},servers:[{url:'http://127.0.0.1:3003/api/v1'}],paths,components:{schemas}},null,2));
fs.writeFileSync('postman/Persona3.postman_collection.json',JSON.stringify({info:{name:'Persona 3 - Ciclo 2',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:'14 peticiones; datos sintéticos de test/fixtures. Ejecutar en orden.'},variable:Object.entries({baseUrl:'http://127.0.0.1:3003/api/v1',beneficiariaId:'100',hijoId:'100',formularioId:'2',profesionalId:'1'}).map(([key,value])=>({key,value})),item:items},null,2));
console.log('Generadas 14 peticiones Postman y especificación OpenAPI.');
// Extensión autorizada el 27/10: carga PDF por ruta ya definida en el PDF (sección documentos).
const spec=JSON.parse(fs.readFileSync('docs/persona3/openapi.json','utf8'));
spec.info.description='14 rutas P3 exactas del PDF, más carga PDF autorizada posteriormente. IDs y formato JSON todavía pendientes de ratificación. Solo laboratorio local.';
spec.paths['/beneficiarias/{id}/documentos/cargas']={post:{summary:'Adjuntar PDF a la ficha del área',description:'Ruta documental del PDF añadida al alcance por el usuario; funcionamiento propio sin servicio externo de compañeros. Original privado, máximo 20 MiB.',parameters:[{name:'id',in:'path',required:true,schema:id}],requestBody:{required:true,content:{'multipart/form-data':{schema:{type:'object',additionalProperties:false,required:['archivo','formularioId','categoria'],properties:{archivo:{type:'string',format:'binary'},formularioId:id,categoria:{type:'string',maxLength:200}}}}}},responses:{201:{description:'Metadatos del documento asociado; no expone la ruta privada'},400:{description:'PDF o campos inválidos'},403:{description:'Área ajena'},404:{description:'Ficha/expediente no coinciden o niño no inscrito'},413:{description:'Más de 20 MiB'}}}};
spec.paths['/legal/referencias/{id}'].patch.description='Permite corregir borrador o confirmada; exige versión y motivo. Conserva estado e historial.';
spec.paths['/beneficiarias/{id}/hoja-evolutiva'].get.description='Limitada al área activa del servidor, manteniendo filtros por área, formulario e hijo. Legal corresponde solo a la beneficiaria.';
spec.paths['/entradas-evolutivas/{id}/revisiones'].get.description='Solo coordinación del área propia (contexto de laboratorio por ahora). Devuelve autor, fecha, motivo y cambios campo/antes/despues; incluye creación.';
fs.writeFileSync('docs/persona3/openapi.json',JSON.stringify(spec,null,2));
fs.writeFileSync('postman/CargaPDF.postman_collection.json',JSON.stringify({info:{name:'Persona 3 - Carga PDF',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:'Carga PDF propia de nuestra asignación; almacenamiento privado local sin dependencias de compañeros.'},variable:[{key:'baseUrl',value:'http://127.0.0.1:3003/api/v1'},{key:'beneficiariaId',value:'100'},{key:'formularioId',value:'2'}],item:[{name:'Adjuntar PDF a ficha Legal',request:{method:'POST',url:'{{baseUrl}}/beneficiarias/{{beneficiariaId}}/documentos/cargas',body:{mode:'formdata',formdata:[{key:'formularioId',type:'text',value:'{{formularioId}}'},{key:'categoria',type:'text',value:'Documento sintético'},{key:'archivo',type:'file',src:'fixtures/documento.pdf'}]}},event:[{listen:'test',script:{type:'text/javascript',exec:["pm.test('HTTP 201',()=>pm.response.to.have.status(201));","pm.test('Asociado a la ficha',()=>pm.expect(pm.response.json().formularioId).to.eql(pm.variables.get('formularioId')));"]}}]}]},null,2));

// Acuerdos ratificados por el usuario el 29/10.
const contrato=JSON.parse(fs.readFileSync('docs/persona3/openapi.json','utf8'));
contrato.info.version='0.2.0';
contrato.info.description='Asignación P3 autónoma: 14 rutas del PDF y una carga PDF autorizada. Referencia identificada por formulario_area.id; listas con datos/pagina/limite/total; borrador mínimo y confirmación con destino/motivo.';
contrato.components.schemas.CrearReferencia.properties.detalle.description='Opcional al crear borrador; se genera un detalle vacío cuando se omite.';
contrato.components.schemas.ListaPaginada={type:'object',additionalProperties:false,required:['datos','pagina','limite','total'],properties:{datos:{type:'array',items:{type:'object',additionalProperties:true}},pagina:{type:'integer',minimum:1},limite:{type:'integer',minimum:1,maximum:100},total:{type:'integer',minimum:0,description:'Cantidad de resultados que cumplen los filtros, sin LIMIT/OFFSET; puede superar datos.length.'}}};
for(const [method,ruta,nombre] of routes){
 if(method==='GET'&&!nombre.includes('Consultar referencia')&&!nombre.includes('Resumen'))contrato.paths[ruta].get.responses['200'].content={'application/json':{schema:{$ref:'#/components/schemas/ListaPaginada'}}};
}
contrato.paths['/legal/referencias/{id}'].get.description='id es formulario_area.id, representado como texto bigint. La referencia no tiene otro identificador público.';
contrato.paths['/legal/referencias/{id}'].patch.description='Borrador o confirmada: exige versión actual y motivo, conserva historial. En confirmadas no permite vaciar destino ni motivoReferencia.';
contrato.paths['/legal/referencias/{id}/confirmar'].post.description='Valida los datos ya guardados: destino y motivoReferencia no vacíos. Origen y recomendaciones opcionales. Una confirmación fallida no cambia estado, versión ni historial.';
fs.writeFileSync('docs/persona3/openapi.json',JSON.stringify(contrato,null,2));

// Contrato común de errores: todas las operaciones mantienen sus respuestas exitosas.
const {CATALOGO}=require('../src/common/errors/catalogo.ts');
contrato.components.schemas.ErrorApi={type:'object',additionalProperties:false,required:['estado','codigo','mensaje','errores','idSolicitud'],properties:{estado:{type:'integer',minimum:400,maximum:599},codigo:{type:'string',enum:Object.keys(CATALOGO)},mensaje:{type:'string'},errores:{type:'array',items:{type:'object',additionalProperties:false,required:['campo','mensaje'],properties:{campo:{type:'string'},mensaje:{type:'string'}}}},idSolicitud:{type:'string'}}};
for(const item of Object.values(contrato.paths))for(const op of Object.values(item)){
 if(!op.responses)continue;
 for(const estado of ['400','403','404','409','413','415','422','500','503'])op.responses[estado]={description:'Error según CONTRATO_ERRORES_API.md; mensaje público en español.',headers:{'X-Id-Solicitud':{schema:{type:'string'}}},content:{'application/json':{schema:{$ref:'#/components/schemas/ErrorApi'}}}};
}
fs.writeFileSync('docs/persona3/openapi.json',JSON.stringify(contrato,null,2));
const erroresPostman={info:{name:'Persona 3 - Contrato de errores',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},variable:[{key:'baseUrl',value:'http://127.0.0.1:3003/api/v1'}],item:[{name:'Identificador inválido',request:{method:'GET',url:'{{baseUrl}}/legal/beneficiarias/letras/fichas'}},{name:'Ruta inexistente',request:{method:'GET',url:'{{baseUrl}}/ruta-inexistente'}},{name:'JSON mal formado',request:{method:'POST',header:[{key:'Content-Type',value:'application/json'}],url:'{{baseUrl}}/legal/beneficiarias/100/referencias',body:{mode:'raw',raw:'{"incompleto":'}}}],event:[{listen:'test',script:{exec:["pm.test('Error con cinco propiedades',()=>pm.expect(Object.keys(pm.response.json()).sort()).to.eql(['estado','codigo','mensaje','errores','idSolicitud'].sort()));","pm.test('Estado e identificador consistentes',()=>{const d=pm.response.json();pm.expect(d.estado).to.eql(pm.response.code);pm.expect(d.idSolicitud).to.eql(pm.response.headers.get('X-Id-Solicitud'));});"]}}]};
fs.writeFileSync('postman/Errores.postman_collection.json',JSON.stringify(erroresPostman,null,2));

fs.writeFileSync("public/errores-api.js","// Generado desde el catálogo común.\nglobalThis.ERRORES_API = "+JSON.stringify(CATALOGO)+";\n");

const el=id=>document.getElementById(id),value=id=>el(id).value.trim();
let reference=null,entry=null;
const show=(id,data)=>el(id).textContent=JSON.stringify(data,null,2);
async function api(path,method='GET',body){
 const response=await fetch('/api/v1'+path,{method,headers:body instanceof FormData?undefined:body?{'Content-Type':'application/json'}:undefined,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
 const data=await response.json();if(!response.ok)throw Error(Array.isArray(data.message)?data.message.join('; '):data.mensaje||data.message||'No se pudo completar');return data;
}
function action(id,fn){el(id).onclick=async()=>{el(id).disabled=true;try{await fn();el('estado').textContent='Operación correcta';}catch(error){el('estado').textContent=error.message;}finally{el(id).disabled=false;}};}
const beneficiary=()=>encodeURIComponent(value('beneficiaria'));
const row=(parent,text)=>{const p=document.createElement('p');p.textContent=text;parent.append(p);};
function renderReference(data){reference=data;show('referenciaVista',data);el('confirmar').disabled=false;el('corregir').disabled=false;}
action('social',async()=>{
 const [summary,forms]=await Promise.all([api('/trabajo-social/beneficiarias/'+beneficiary()+'/resumen'),api('/trabajo-social/beneficiarias/'+beneficiary()+'/fichas')]);
 const view=el('socialVista');view.replaceChildren();row(view,summary.beneficiaria.nombre+' · Expediente '+summary.expedienteId);row(view,'Fichas: '+summary.totalFichas+' · Última atención: '+(summary.ultimaAtencion||'Sin atención'));
 row(view,'Estado: '+(summary.ultimaFicha?.estadoCodigo||'Sin ficha')+' · Último guardado: '+(summary.ultimaFicha?.actualizadoEn||'Sin guardado'));
 row(view,'Historia: '+(summary.ultimaFicha?.historiaViolencia||'Sin registrar'));row(view,'Diagnóstico: '+(summary.ultimaFicha?.diagnosticoSocial||'Sin registrar'));row(view,'Fichas consultadas: '+forms.datos.length+' de '+forms.total);
 for(const item of summary.historialReciente)row(view,item.accion+' · '+item.profesionalNombre+' · '+item.contenido);
 row(view,'Campos pendientes de soporte en la BD: '+summary.camposSinSoporte.join(', '));
});
action('hijos',async()=>{const data=await api('/guarderia/beneficiarias/'+beneficiary()+'/hijos');const view=el('hijosVista');view.replaceChildren();for(const child of data.datos){const p=document.createElement('p');p.textContent=child.nombre+' · '+(child.inscrito?'Inscrito':'No inscrito');const b=document.createElement('button');b.textContent='Abrir fichas';b.disabled=!child.inscrito;b.onclick=async()=>{try{const d=await api('/guarderia/hijos/'+child.ninoId+'/fichas');const pre=document.createElement('pre');pre.textContent=JSON.stringify(d,null,2);view.append(pre);}catch(e){el('estado').textContent=e.message;}};p.append(b);view.append(p);}});
action('legales',async()=>show('legalesVista',await api('/legal/beneficiarias/'+beneficiary()+'/fichas')));
action('crear',async()=>renderReference(await api('/legal/beneficiarias/'+beneficiary()+'/referencias','POST',{fechaAtencion:new Date().toISOString(),profesionalId:value('profesional'),detalle:{destino:value('destino'),motivoReferencia:value('motivoReferencia')}})));
action('confirmar',async()=>{if(!reference)throw Error('Primero cree una referencia');renderReference(await api('/legal/referencias/'+reference.id+'/confirmar','POST',{version:reference.version,motivo:value('motivoCambio')}));});
action('corregir',async()=>{if(!reference)throw Error('Primero cree una referencia');renderReference(await api('/legal/referencias/'+reference.id,'PATCH',{version:reference.version,motivo:value('motivoCambio'),detalle:{destino:value('destino'),motivoReferencia:value('motivoReferencia')}}));});
action('seguimiento',async()=>{entry=await api('/beneficiarias/'+beneficiary()+'/hoja-evolutiva','POST',{formularioId:value('formulario'),accion:value('accion'),contenido:value('contenido'),fechaAtencion:new Date().toISOString(),profesionalId:value('profesional')});show('evolucionVista',entry);el('historial').disabled=false;});
action('listar',async()=>show('evolucionVista',await api('/beneficiarias/'+beneficiary()+'/hoja-evolutiva')));
action('historial',async()=>{if(!entry)throw Error('Registre un seguimiento primero');show('evolucionVista',await api('/entradas-evolutivas/'+entry.id+'/revisiones'));});
action('subir',async()=>{const file=el('archivo').files[0];if(!file)throw Error('Seleccione un PDF');const body=new FormData();body.set('archivo',file);body.set('formularioId',value('formulario'));body.set('categoria',value('categoria'));show('documentoVista',await api('/beneficiarias/'+beneficiary()+'/documentos/cargas','POST',body));});

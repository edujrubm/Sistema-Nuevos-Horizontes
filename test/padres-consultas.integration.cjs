require("reflect-metadata");require("ts-node").register({transpileOnly:true});
const {test,before,after}=require("node:test"),assert=require("node:assert/strict");
const {DataSource}=require("typeorm");
const {PadreNinoEntity}=require("../src/modules/formularios/guarderia/entities/padre-nino.entity");
const {auditedTransaction}=require("../src/common/database/audited-transaction");
let data,repo,creado,ninosAntes,otrasTablasAntes;
before(async()=>{
 assert.equal(process.env.PADRES_TEST_HOST,"127.0.0.1");assert.match(process.env.PADRES_TEST_DATABASE,/^padres_orm_test_/);
 data=new DataSource({type:"postgres",host:process.env.PADRES_TEST_HOST,port:Number(process.env.PADRES_TEST_PORT),database:process.env.PADRES_TEST_DATABASE,username:process.env.PADRES_TEST_USER,password:process.env.PADRES_TEST_PASSWORD,entities:[PadreNinoEntity],synchronize:false,migrationsRun:false});
 await data.initialize();repo=data.getRepository(PadreNinoEntity);
 ninosAntes=await data.query("SELECT * FROM new_horizons.nino ORDER BY nino_id");
 otrasTablasAntes=await data.query("SELECT * FROM new_horizons.formulario_area ORDER BY id");
});
after(async()=>{if(data?.isInitialized)await data.destroy();});
const escribir=(motivo,fn)=>auditedTransaction(data,motivo,fn);
test("Paternidad: guarda vínculo biológico por ORM y conserva CUI con ceros",async()=>{
 creado=await escribir("Registro ficticio de paternidad",m=>m.getRepository(PadreNinoEntity).save({ninoId:"100",tipoVinculo:"BIOLOGICO",nombre:"Carlos Méndez ficticio",cui:"0000000000067",telefono:"55550067",direccion:"Dirección ficticia"}));
 const row=await repo.findOneByOrFail({id:creado.id});assert.equal(row.ninoId,"100");assert.equal(row.cui,"0000000000067");assert.equal(typeof row.id,"string");assert.equal(row.version,1);assert.ok(row.creadoEn instanceof Date);
});
test("Paternidad: vínculo legal independiente y datos personales opcionales",async()=>{
 const legal=await escribir("Vínculo legal ficticio",m=>m.getRepository(PadreNinoEntity).save({ninoId:"100",tipoVinculo:"LEGAL"}));
 const row=await repo.findOneByOrFail({id:legal.id});assert.equal(row.nombre,null);assert.equal(row.telefono,null);assert.equal(row.tipoVinculo,"LEGAL");
 assert.equal(await repo.countBy({ninoId:"100"}),2);
});
test("Paternidad: permite ambos vínculos y varios hijos sin hacer CUI globalmente único",async()=>{
 await escribir("Misma identidad ficticia",async m=>{
  await m.getRepository(PadreNinoEntity).save({ninoId:"100",tipoVinculo:"LEGAL",cui:"0000000000067"});
  await m.getRepository(PadreNinoEntity).save({ninoId:"200",tipoVinculo:"BIOLOGICO",cui:"0000000000067"});
 });
 assert.equal(await repo.countBy({cui:"0000000000067"}),3);
});
test("Paternidad: PostgreSQL rechaza niño inexistente y tipo no permitido",async()=>{
 for(const input of [{ninoId:"999999",tipoVinculo:"LEGAL"},{ninoId:"100",tipoVinculo:"OTRO"}]){
  const count=await repo.count();await assert.rejects(escribir("Ensayo de integridad",m=>m.getRepository(PadreNinoEntity).save(input)),e=>["23503","23514"].includes(e.code??e.driverError?.code));assert.equal(await repo.count(),count);
 }
});
test("Paternidad: corrección conserva historial, actor, motivo y versión",async()=>{
 await escribir("Corrección ficticia de contacto",m=>m.getRepository(PadreNinoEntity).update({id:creado.id,version:1},{telefono:"55550068"}));
 const row=await repo.findOneByOrFail({id:creado.id});assert.equal(row.version,2);assert.equal(row.telefono,"55550068");
 const audits=await data.query("SELECT operacion,anterior,nuevo,actor_id,motivo FROM new_horizons.revision_registro WHERE tabla='padre_nino' AND registro_id=$1 ORDER BY id",[creado.id]);
 assert.equal(audits.length,2);assert.equal(audits[1].anterior.telefono,"55550067");assert.equal(audits[1].nuevo.telefono,"55550068");assert.equal(audits[1].actor_id,"1");assert.equal(audits[1].motivo,"Corrección ficticia de contacto");
});
test("Paternidad: escrituras con igual versión no se sobrescriben",async()=>{
 const results=await Promise.all(["55550069","55550070"].map(telefono=>escribir("Ensayo ficticio simultáneo",m=>m.getRepository(PadreNinoEntity).update({id:creado.id,version:2},{telefono}))));
 assert.deepEqual(results.map(r=>r.affected).sort(),[0,1]);assert.equal((await repo.findOneByOrFail({id:creado.id})).version,3);
});
test("Paternidad: falta de actor o motivo revierte la operación",async()=>{
 const before=await repo.count();await assert.rejects(repo.save({ninoId:"100",tipoVinculo:"LEGAL"}));assert.equal(await repo.count(),before);
 const row=await repo.findOneByOrFail({id:creado.id});await assert.rejects(escribir("",m=>m.getRepository(PadreNinoEntity).update({id:row.id},{telefono:"No guardar"})));assert.deepEqual(await repo.findOneByOrFail({id:row.id}),row);
});
test("Paternidad: no permite borrar físicamente ni trasladar el registro a otro niño",async()=>{
 await assert.rejects(escribir("Intento ficticio de borrado",m=>m.getRepository(PadreNinoEntity).delete({id:creado.id})));
 await assert.rejects(escribir("Intento ficticio de reasignación",m=>m.getRepository(PadreNinoEntity).update({id:creado.id},{ninoId:"200"})));
 assert.equal((await repo.findOneByOrFail({id:creado.id})).ninoId,"100");
});
test("Paternidad: rollback conserva datos y auditoría, sin afectar otros módulos",async()=>{
 const before=await repo.count();const [audits]=await data.query("SELECT count(*) AS n FROM new_horizons.revision_registro");
 await assert.rejects(escribir("Ensayo ficticio de reversión",async m=>{await m.getRepository(PadreNinoEntity).save({ninoId:"100",tipoVinculo:"LEGAL",nombre:"No debe persistir"});throw Error("Fallo ficticio");}));
 assert.equal(await repo.count(),before);assert.equal((await data.query("SELECT count(*) AS n FROM new_horizons.revision_registro"))[0].n,audits.n);
 assert.deepEqual(await data.query("SELECT * FROM new_horizons.nino ORDER BY nino_id"),ninosAntes);
 assert.deepEqual(await data.query("SELECT * FROM new_horizons.formulario_area ORDER BY id"),otrasTablasAntes);
});

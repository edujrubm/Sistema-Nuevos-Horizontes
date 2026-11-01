-- Semilla exclusiva del laboratorio: no son estados institucionales aprobados.
INSERT INTO new_horizons.estado_formulario(codigo,descripcion) VALUES ('P3_BORRADOR','Sintético'),('P3_CONFIRMADO','Sintético');
BEGIN;
SET LOCAL new_horizons.actor_id='1';
SET LOCAL new_horizons.motivo='Semilla sintética P3';
INSERT INTO new_horizons.beneficiaria(id_beneficiaria,nombre) VALUES(200,'Otro expediente sintético');
INSERT INTO new_horizons.expediente(beneficiaria_id) VALUES(200);
INSERT INTO new_horizons.nino(nino_id,nombre,expediente_id) SELECT 200,'Otro hijo sintético',id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=200;
DO $$
DECLARE t text; fid bigint; ex bigint; ar bigint;
BEGIN
 SELECT id_expediente INTO ex FROM new_horizons.expediente WHERE beneficiaria_id=100;
 FOREACH t IN ARRAY ARRAY['SOCIAL','LEGAL','GUARDERIA','PSICOLOGIA_MUJER','MEDICINA_MUJER'] LOOP
  SELECT area_id INTO ar FROM new_horizons.tipo_formulario WHERE codigo=t;
  INSERT INTO new_horizons.formulario_area(expediente_id,nino_id,area_id,tipo,estado_codigo,fecha_atencion,profesional_id,capturado_por)
  VALUES(ex,CASE WHEN t='GUARDERIA' THEN 100 ELSE NULL END,ar,t,'P3_CONFIRMADO','2026-10-26T09:00:00-06:00',1,1) RETURNING id INTO fid;
  CASE t
   WHEN 'SOCIAL' THEN INSERT INTO new_horizons.ficha_social(formulario_id,historia_violencia) VALUES(fid,'Historia sintética');
   WHEN 'LEGAL' THEN INSERT INTO new_horizons.ficha_legal(formulario_id,diagnostico_juridico) VALUES(fid,'Diagnóstico sintético');
   WHEN 'GUARDERIA' THEN INSERT INTO new_horizons.ficha_guarderia(formulario_id,observaciones) VALUES(fid,'Ficha sintética infantil');
   WHEN 'PSICOLOGIA_MUJER' THEN INSERT INTO new_horizons.psicologia_mujer(formulario_id) VALUES(fid);
   WHEN 'MEDICINA_MUJER' THEN INSERT INTO new_horizons.consulta_medica(formulario_id,tipo) VALUES(fid,t);
  END CASE;
 END LOOP;
END $$;
COMMIT;

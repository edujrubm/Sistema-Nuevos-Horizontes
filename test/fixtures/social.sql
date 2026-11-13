-- Exclusivamente para la base desechable del ensayo de Social.
BEGIN;
SET LOCAL new_horizons.actor_id = '1';
SET LOCAL new_horizons.motivo = 'Preparación sintética de Trabajo Social';
INSERT INTO new_horizons.estado_formulario(codigo,descripcion)
VALUES ('BORRADOR','Borrador de ensayo'),('CONFIRMADO','Confirmado de ensayo')
ON CONFLICT (codigo) DO NOTHING;
UPDATE new_horizons.beneficiaria SET cui='1234567890123',fecha_nac='1990-06-15' WHERE id_beneficiaria=100;

DO $$
DECLARE expediente_prueba bigint; area_social bigint; ficha bigint; indice integer;
BEGIN
  SELECT id_expediente INTO STRICT expediente_prueba FROM new_horizons.expediente WHERE beneficiaria_id=100;
  SELECT area_id INTO STRICT area_social FROM new_horizons.tipo_formulario WHERE codigo='SOCIAL';
  FOR indice IN 1..3 LOOP
    INSERT INTO new_horizons.formulario_area(expediente_id,area_id,tipo,estado_codigo,fecha_atencion,profesional_id,capturado_por)
    VALUES(expediente_prueba,area_social,'SOCIAL',CASE WHEN indice=3 THEN 'DESCARTADO' WHEN indice=1 THEN 'CONFIRMADO' ELSE 'BORRADOR' END,
      CASE WHEN indice=1 THEN '2026-11-14T10:00:00-06:00'::timestamptz
        ELSE '2026-11-13T10:00:00-06:00'::timestamptz END,1,1) RETURNING id INTO ficha;
    INSERT INTO new_horizons.ficha_social(formulario_id,diagnostico_social,fecha_revision)
    VALUES(ficha,'Diagnóstico sintético ' || indice,'2026-11-20');
  END LOOP;
  INSERT INTO new_horizons.beneficiaria(id_beneficiaria,nombre) VALUES(200,'Beneficiaria de aislamiento sintética');
  INSERT INTO new_horizons.expediente(beneficiaria_id) VALUES(200) RETURNING id_expediente INTO expediente_prueba;
  INSERT INTO new_horizons.formulario_area(expediente_id,area_id,tipo,estado_codigo,fecha_atencion,profesional_id,capturado_por)
  VALUES(expediente_prueba,area_social,'SOCIAL','BORRADOR','2026-11-13T11:00:00-06:00',1,1) RETURNING id INTO ficha;
  INSERT INTO new_horizons.ficha_social(formulario_id) VALUES(ficha);
  INSERT INTO new_horizons.beneficiaria(id_beneficiaria,nombre) VALUES(300,'Beneficiaria sin fichas sintética');
  INSERT INTO new_horizons.expediente(beneficiaria_id) VALUES(300);
END $$;

-- Entradas existentes de lectura: no se ensaya ni cambia el flujo de captura.
INSERT INTO new_horizons.entrada_evolutiva(formulario_id,accion,contenido,fecha_atencion,profesional_id,capturado_por)
SELECT f.id,'Acción sintética ' || indice,'Contenido sintético',
  '2026-11-15T10:00:00-06:00'::timestamptz,1,1
FROM new_horizons.formulario_area f
JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id
CROSS JOIN generate_series(1,7) indice
WHERE e.beneficiaria_id=100 AND f.tipo='SOCIAL' AND f.estado_codigo='CONFIRMADO';
INSERT INTO new_horizons.entrada_evolutiva(formulario_id,accion,contenido,fecha_atencion,profesional_id,capturado_por)
SELECT f.id,'Fuera del ámbito Social','Contenido sintético',
  '2026-11-16T10:00:00-06:00',1,1
FROM new_horizons.formulario_area f
JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id
WHERE (e.beneficiaria_id=100 AND f.tipo='LEGAL') OR e.beneficiaria_id=200;
COMMIT;

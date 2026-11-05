-- Exclusivo para desarrollo/ensayo. Todos los registros son sintéticos.
-- Idempotente: puede ejecutarse nuevamente sin duplicar los registros identificados.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

INSERT INTO new_horizons.rol(tipo_rol, descripcion)
SELECT 'TECNICO_PRUEBAS', 'Solo ensayo'
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.rol WHERE tipo_rol = 'TECNICO_PRUEBAS'
);

INSERT INTO new_horizons.empleado(nombre, cui, rol_id)
SELECT 'Actor Técnico Sintético', 'TEST-ACTOR-001', r.id_rol
FROM new_horizons.rol r
WHERE r.tipo_rol = 'TECNICO_PRUEBAS'
  AND NOT EXISTS (
    SELECT 1 FROM new_horizons.empleado WHERE cui = 'TEST-ACTOR-001'
  );

INSERT INTO new_horizons.usuario(nombre_usuario, contrasena_hash, id_empleado)
SELECT 'actor_pruebas_persona1', 'NO_LOGIN_SEED_ONLY', e.id_empleado
FROM new_horizons.empleado e
WHERE e.cui = 'TEST-ACTOR-001'
  AND NOT EXISTS (
    SELECT 1 FROM new_horizons.usuario
    WHERE nombre_usuario = 'actor_pruebas_persona1'
  );

SELECT set_config(
  'new_horizons.actor_id',
  (SELECT id_usuario::text FROM new_horizons.usuario
   WHERE nombre_usuario = 'actor_pruebas_persona1'),
  true
);
SELECT set_config('new_horizons.motivo', 'Carga idempotente de datos sinteticos Persona 1', true);

INSERT INTO new_horizons.pais(nombre)
SELECT dato.nombre
FROM (VALUES ('Guatemala'), ('País Sintético Norte'), ('País Sintético Sur')) dato(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.pais p WHERE p.nombre = dato.nombre
);

INSERT INTO new_horizons.departamento(nombre, pais_id)
SELECT dato.nombre, p.pais_id
FROM (VALUES
  ('Depto Sintético Central', 'Guatemala'),
  ('Depto Sintético Norte', 'País Sintético Norte')
) dato(nombre, pais)
JOIN new_horizons.pais p ON p.nombre = dato.pais
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.departamento d
  WHERE d.nombre = dato.nombre AND d.pais_id = p.pais_id
);

INSERT INTO new_horizons.municipio(nombre, departamento_id)
SELECT dato.nombre, d.departamento_id
FROM (VALUES
  ('Municipio Sintético Uno', 'Depto Sintético Central'),
  ('Municipio Sintético Dos', 'Depto Sintético Central'),
  ('Municipio Sintético Tres', 'Depto Sintético Norte')
) dato(nombre, departamento)
JOIN new_horizons.departamento d ON d.nombre = dato.departamento
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.municipio m
  WHERE m.nombre = dato.nombre AND m.departamento_id = d.departamento_id
);

INSERT INTO new_horizons.ocupacion(nombre)
SELECT dato.nombre FROM (VALUES
  ('Ocupación Sintética A'), ('Ocupación Sintética B'), ('Sin ocupación declarada')
) dato(nombre)
WHERE NOT EXISTS (SELECT 1 FROM new_horizons.ocupacion o WHERE o.nombre = dato.nombre);

INSERT INTO new_horizons.etnia(nombre)
SELECT dato.nombre FROM (VALUES ('Etnia Sintética A'), ('Etnia Sintética B')) dato(nombre)
WHERE NOT EXISTS (SELECT 1 FROM new_horizons.etnia e WHERE e.nombre = dato.nombre);

INSERT INTO new_horizons.parentesco(nombre)
SELECT dato.nombre FROM (VALUES ('Hija/o'), ('Madre'), ('Responsable sintético')) dato(nombre)
WHERE NOT EXISTS (SELECT 1 FROM new_horizons.parentesco p WHERE p.nombre = dato.nombre);

INSERT INTO new_horizons.estado_civil(nombre)
SELECT dato.nombre FROM (VALUES
  ('Soltera - prueba'), ('Casada - prueba'), ('Unida - prueba')
) dato(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.estado_civil c WHERE c.nombre = dato.nombre
);

INSERT INTO new_horizons.nivel_estudio(nombre)
SELECT dato.nombre FROM (VALUES
  ('Primaria completa - prueba'),
  ('Diversificado completo - prueba'),
  ('Universidad incompleta - prueba')
) dato(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.nivel_estudio n WHERE n.nombre = dato.nombre
);

INSERT INTO new_horizons.tipo_acompanante(nombre)
SELECT dato.nombre FROM (VALUES
  ('Familiar - prueba'), ('Responsable - prueba'), ('Sin acompañante - prueba')
) dato(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.tipo_acompanante t WHERE t.nombre = dato.nombre
);

INSERT INTO new_horizons.estado_estudio(nombre)
SELECT dato.nombre FROM (VALUES
  ('Estudia actualmente - prueba'),
  ('No estudia actualmente - prueba')
) dato(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.estado_estudio e WHERE e.nombre = dato.nombre
);

INSERT INTO new_horizons.beneficiaria(cui, nombre, fecha_nac, alfabetismo)
SELECT dato.cui, dato.nombre, dato.fecha_nac::date, dato.alfabetismo
FROM (VALUES
  ('TEST-CUI-P1-001', 'Beneficiaria Sintética Ada', '1991-02-10', true),
  ('TEST-CUI-P1-002', 'Beneficiaria Sintética Beatriz', '1986-07-21', true),
  ('TEST-CUI-P1-003', 'Beneficiaria Sintética Carmen', '1998-11-05', false),
  ('TEST-CUI-P1-004', 'Beneficiaria Sintética Diana', '2001-04-17', true),
  ('TEST-CUI-P1-005', 'Beneficiaria Sintética Elena', '1994-09-30', null)
) dato(cui, nombre, fecha_nac, alfabetismo)
WHERE NOT EXISTS (
  SELECT 1 FROM new_horizons.beneficiaria b WHERE b.cui = dato.cui
);

INSERT INTO new_horizons.expediente(beneficiaria_id)
SELECT b.id_beneficiaria
FROM new_horizons.beneficiaria b
WHERE b.cui LIKE 'TEST-CUI-P1-%'
  AND NOT EXISTS (
    SELECT 1 FROM new_horizons.expediente e
    WHERE e.beneficiaria_id = b.id_beneficiaria
  );

INSERT INTO new_horizons.ficha_inicial(
  correlativo_ficha, lugar, fecha, analisis_riesgo, plan_seguridad,
  entrevista_inicial, seguimiento, observaciones, expediente_id
)
SELECT
  'TEST-FI-' || right(b.cui, 3),
  'Centro de ensayo',
  clock_timestamp(),
  'Contenido sintético para pruebas',
  'Plan sintético para pruebas',
  'Entrevista sintética',
  'Seguimiento sintético',
  'Registro sin datos personales reales',
  e.id_expediente
FROM new_horizons.beneficiaria b
JOIN new_horizons.expediente e ON e.beneficiaria_id = b.id_beneficiaria
WHERE b.cui IN ('TEST-CUI-P1-001', 'TEST-CUI-P1-002', 'TEST-CUI-P1-003')
  AND NOT EXISTS (
    SELECT 1 FROM new_horizons.ficha_inicial f
    WHERE f.correlativo_ficha = 'TEST-FI-' || right(b.cui, 3)
  );

INSERT INTO new_horizons.ficha_inicial_seccion(ficha_inicial_id, seccion, contenido)
SELECT f.id_ficha_inicial, dato.seccion, dato.contenido::jsonb
FROM new_horizons.ficha_inicial f
CROSS JOIN (VALUES
  ('datos-generales', '{"nota":"Contenido sintetico"}'),
  ('riesgo', '{"nivel":"PRUEBA","nota":"Sin valor clinico"}')
) dato(seccion, contenido)
WHERE f.correlativo_ficha LIKE 'TEST-FI-%'
ON CONFLICT (ficha_inicial_id, seccion) DO NOTHING;

INSERT INTO new_horizons.nino(cui, nombre, fecha_nac, reconocido, genero, expediente_id)
SELECT dato.cui, dato.nombre, dato.fecha_nac::date, dato.reconocido, dato.genero, e.id_expediente
FROM (VALUES
  ('TEST-NINO-P1-001', 'Niña Sintética Uno', '2015-03-12', true, 'F', 'TEST-CUI-P1-001'),
  ('TEST-NINO-P1-002', 'Niño Sintético Dos', '2018-08-09', false, 'M', 'TEST-CUI-P1-001'),
  ('TEST-NINO-P1-003', 'Niña Sintética Tres', '2012-12-01', true, 'F', 'TEST-CUI-P1-002')
) dato(cui, nombre, fecha_nac, reconocido, genero, beneficiaria_cui)
JOIN new_horizons.beneficiaria b ON b.cui = dato.beneficiaria_cui
JOIN new_horizons.expediente e ON e.beneficiaria_id = b.id_beneficiaria
WHERE NOT EXISTS (SELECT 1 FROM new_horizons.nino n WHERE n.cui = dato.cui);

COMMIT;

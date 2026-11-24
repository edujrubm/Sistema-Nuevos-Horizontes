-- Datos sintéticos para pruebas locales del módulo Legal.
-- Requiere el esquema, las migraciones y el fixture base de migración.
-- No ejecutar en una base compartida ni en producción.

BEGIN;

SET LOCAL new_horizons.actor_id = '1';
SET LOCAL new_horizons.motivo = 'Preparación sintética de Legal';

INSERT INTO new_horizons.empleado (id_empleado, nombre, rol_id)
VALUES (67, 'Profesional sintético de Legal', 1)
ON CONFLICT (id_empleado) DO NOTHING;
SELECT setval(
  pg_get_serial_sequence('new_horizons.empleado', 'id_empleado'),
  (SELECT max(id_empleado) FROM new_horizons.empleado)
);

INSERT INTO new_horizons.estado_formulario (
  codigo,
  descripcion
)
VALUES
  ('BORRADOR', 'Borrador de prueba'),
  ('CONFIRMADO', 'Confirmado de prueba')
ON CONFLICT (codigo) DO NOTHING;

DO $$
DECLARE
  expediente_prueba bigint;
  area_legal bigint;
  formulario_prueba bigint;
BEGIN
  SELECT id_expediente
  INTO expediente_prueba
  FROM new_horizons.expediente
  WHERE beneficiaria_id = 100;

  IF expediente_prueba IS NULL THEN
    RAISE EXCEPTION
      'Falta el expediente sintético de la beneficiaria 100';
  END IF;

  SELECT area_id
  INTO area_legal
  FROM new_horizons.tipo_formulario
  WHERE codigo = 'LEGAL';

  IF area_legal IS NULL THEN
    RAISE EXCEPTION
      'Falta el tipo de formulario LEGAL';
  END IF;

  INSERT INTO new_horizons.formulario_area (
    expediente_id,
    area_id,
    tipo,
    estado_codigo,
    fecha_atencion,
    profesional_id,
    capturado_por
  )
  VALUES (
    expediente_prueba,
    area_legal,
    'LEGAL',
    'CONFIRMADO',
    '2026-10-26T09:00:00-06:00',
    1,
    1
  )
  RETURNING id INTO formulario_prueba;

  INSERT INTO new_horizons.ficha_legal (
    formulario_id,
    diagnostico_juridico
  )
  VALUES (
    formulario_prueba,
    'Diagnóstico jurídico sintético'
  );
END;
$$;

COMMIT;
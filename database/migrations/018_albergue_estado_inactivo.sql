-- Garantiza el catálogo requerido para cerrar una estancia de Albergue.
-- Es seguro ejecutarlo una vez: no modifica estados existentes.
BEGIN;

INSERT INTO new_horizons.estado_albergue (nombre)
SELECT 'Inactivo'
WHERE NOT EXISTS (
  SELECT 1
  FROM new_horizons.estado_albergue
  WHERE lower(btrim(nombre)) = 'inactivo'
);

COMMIT;

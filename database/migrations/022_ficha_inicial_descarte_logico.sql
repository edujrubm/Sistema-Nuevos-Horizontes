BEGIN;

ALTER TABLE new_horizons.ficha_inicial
  DROP CONSTRAINT IF EXISTS ck_ficha_inicial_estado;

ALTER TABLE new_horizons.ficha_inicial
  ADD CONSTRAINT ck_ficha_inicial_estado
  CHECK (estado IN ('BORRADOR', 'CONFIRMADA', 'DESCARTADA'));

COMMIT;

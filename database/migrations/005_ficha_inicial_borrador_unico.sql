-- Aplicada en la base PostgreSQL de ensayo el 2026-10-28.
-- Garantiza un único borrador de ficha inicial por expediente.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ficha_inicial_borrador_expediente
  ON new_horizons.ficha_inicial (expediente_id)
  WHERE estado = 'BORRADOR';

COMMIT;

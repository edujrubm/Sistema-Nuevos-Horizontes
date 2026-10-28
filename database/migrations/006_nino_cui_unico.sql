-- Aplicada en la base PostgreSQL de ensayo el 2026-10-28.
-- Cierra la carrera de concurrencia entre dos altas con el mismo CUI.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS ux_nino_cui_normalizado
  ON new_horizons.nino (
    regexp_replace(cui, '[^0-9A-Za-z]', '', 'g')
  )
  WHERE cui IS NOT NULL AND length(btrim(cui)) > 0;

COMMIT;

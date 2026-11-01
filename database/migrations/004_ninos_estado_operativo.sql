-- Aplicada en la base PostgreSQL de ensayo el 2026-10-28.
-- Estado lógico para el CRUD ampliado de hijas e hijos.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

ALTER TABLE new_horizons.nino
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inactivado_en timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_inactivacion varchar(500);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_nino_inactivacion_coherente'
  ) THEN
    ALTER TABLE new_horizons.nino
      ADD CONSTRAINT ck_nino_inactivacion_coherente CHECK (
        (activo AND inactivado_en IS NULL AND motivo_inactivacion IS NULL)
        OR
        (NOT activo AND inactivado_en IS NOT NULL
          AND length(btrim(motivo_inactivacion)) > 0)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_nino_expediente_estado
  ON new_horizons.nino (expediente_id, activo, nino_id);

COMMIT;

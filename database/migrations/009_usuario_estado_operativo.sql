-- Prerrequisito operativo para la auditoría y administración de usuarios.
-- Debe aplicarse después de 009_habilitar_usuarios.sql y antes de
-- 010_auditoria_estado_usuarios.sql.

BEGIN;

ALTER TABLE new_horizons.usuario
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS desactivado_en timestamptz,
  ADD COLUMN IF NOT EXISTS desactivado_por bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conrelid = 'new_horizons.usuario'::regclass
      AND conname = 'fk_usuario_desactivado_por'
  ) THEN
    ALTER TABLE new_horizons.usuario
      ADD CONSTRAINT fk_usuario_desactivado_por
      FOREIGN KEY (desactivado_por)
      REFERENCES new_horizons.usuario(id_usuario);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conrelid = 'new_horizons.usuario'::regclass
      AND conname = 'ck_usuario_desactivacion_coherente'
  ) THEN
    ALTER TABLE new_horizons.usuario
      ADD CONSTRAINT ck_usuario_desactivacion_coherente
      CHECK (
        (activo AND desactivado_en IS NULL AND desactivado_por IS NULL)
        OR
        (NOT activo AND desactivado_en IS NOT NULL AND desactivado_por IS NOT NULL)
      );
  END IF;
END $$;

COMMIT;

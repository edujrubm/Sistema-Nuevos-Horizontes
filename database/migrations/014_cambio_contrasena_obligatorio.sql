BEGIN;

-- Indica si el usuario debe cambiar su contraseña
-- antes de acceder a las funcionalidades del sistema.

ALTER TABLE new_horizons.usuario
ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN new_horizons.usuario.debe_cambiar_contrasena IS
'TRUE cuando el usuario tiene una contraseña temporal y debe establecer una nueva contraseña antes de acceder al sistema.';

COMMIT;

BEGIN;

-- Garantizar una única cuenta de usuario por empleado.
-- La restricción aplica tanto a cuentas activas como inactivas.

ALTER TABLE new_horizons.usuario
ADD CONSTRAINT uq_usuario_id_empleado
UNIQUE (id_empleado);

COMMIT;
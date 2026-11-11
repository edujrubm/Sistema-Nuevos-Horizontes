-- Exclusivo de la demostración LOCAL con las fixtures sintéticas. No aplicar en la BD del grupo.
BEGIN;
SET LOCAL new_horizons.actor_id='1';
SET LOCAL new_horizons.motivo='Preparación de demostración sintética de Persona 4';
UPDATE new_horizons.beneficiaria SET cui='9999999999901' WHERE id_beneficiaria=100 AND cui IS NULL;
INSERT INTO new_horizons.estado_albergue(nombre)
SELECT nombre FROM (VALUES ('Activo'),('Inactivo')) s(nombre)
WHERE NOT EXISTS(SELECT 1 FROM new_horizons.estado_albergue e WHERE e.nombre=s.nombre);
COMMIT;

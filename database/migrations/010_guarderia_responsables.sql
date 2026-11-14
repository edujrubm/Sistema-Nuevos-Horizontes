-- Alcance local autorizado por Eduardo: responsables adicionales de Guardería.
-- No altera tablas existentes ni implementa paternidad o hoja evolutiva.
BEGIN;
CREATE TABLE new_horizons.guarderia_responsable (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 formulario_id bigint NOT NULL REFERENCES new_horizons.ficha_guarderia(formulario_id),
 nombre text NOT NULL CHECK(length(btrim(nombre)) BETWEEN 1 AND 200),
 cui text NOT NULL CHECK(length(btrim(cui)) BETWEEN 1 AND 20),
 relacion text NOT NULL CHECK(length(btrim(relacion)) BETWEEN 1 AND 200),
 telefono text NOT NULL CHECK(length(btrim(telefono)) BETWEEN 1 AND 25),
 creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
 actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX ix_guarderia_responsable_formulario ON new_horizons.guarderia_responsable(formulario_id,id);
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.guarderia_responsable
 FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.guarderia_responsable
 FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.guarderia_responsable
 FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.guarderia_responsable
 FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
COMMIT;

-- Paternidad por niño. Estructura autorizada por Eduardo; probar primero en local.
-- No altera registros de niños, ficha inicial, formularios ni autorizaciones de traslado.
BEGIN;
CREATE TABLE new_horizons.padre_nino (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nino_id bigint NOT NULL REFERENCES new_horizons.nino(nino_id),
 tipo_vinculo text NOT NULL CHECK(tipo_vinculo IN ('BIOLOGICO','LEGAL')),
 nombre text,
 cui text,
 telefono text,
 direccion text,
 creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
 actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
 version integer NOT NULL DEFAULT 1 CHECK(version>0)
);
-- El equipo aún no ha definido un máximo de personas por tipo de vínculo.
CREATE INDEX ix_padre_nino_vinculo ON new_horizons.padre_nino(nino_id,tipo_vinculo,id);
CREATE TRIGGER versionar BEFORE UPDATE ON new_horizons.padre_nino
 FOR EACH ROW EXECUTE FUNCTION new_horizons.preparar_version();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.padre_nino
 FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.padre_nino
 FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
-- Una corrección modifica datos, no traslada una identidad entre expedientes.
CREATE FUNCTION new_horizons.proteger_origen_padre_nino() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.nino_id IS DISTINCT FROM OLD.nino_id THEN
  RAISE EXCEPTION 'No se permite trasladar datos de paternidad entre niños';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.padre_nino
 FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen_padre_nino();
COMMENT ON TABLE new_horizons.padre_nino IS 'Datos de paternidad por niño; no concede autorización de recogida o traslado.';
COMMENT ON COLUMN new_horizons.padre_nino.tipo_vinculo IS 'BIOLOGICO o LEGAL. No determina permisos ni sustituye validación institucional de documentos.';
COMMIT;

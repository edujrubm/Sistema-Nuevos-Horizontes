-- EXPERIMENTO LOCAL. Requiere migraciones 003..008_documentos_integracion.
-- No aplicado a GitHub ni al servidor del grupo. Ejecutar una vez sobre la copia local.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('nuevos_horizontes_local_008'));

CREATE TABLE new_horizons.riesgo_social (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 codigo text NOT NULL UNIQUE CHECK(length(btrim(codigo))>0),
 nombre text NOT NULL CHECK(length(btrim(nombre))>0)
);
-- Opciones literales del mockup Social; no se mezclan con el catálogo clínico de admisión.
INSERT INTO new_horizons.riesgo_social(codigo,nombre) VALUES
 ('VIVIENDA_INSEGURA','Vivienda insegura'),('DEPENDENCIA_ECONOMICA','Dependencia económica'),
 ('SIN_RED_APOYO','Ausencia de red de apoyo'),('RIESGO_HIJOS','Riesgo para hijas o hijos');
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.riesgo_social FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.riesgo_social FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TABLE new_horizons.ficha_social_riesgo (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 formulario_id bigint NOT NULL REFERENCES new_horizons.ficha_social(formulario_id),
 riesgo_social_id bigint NOT NULL REFERENCES new_horizons.riesgo_social(id),
 seleccionado boolean NOT NULL DEFAULT true,
 UNIQUE(formulario_id,riesgo_social_id)
);
CREATE INDEX ix_social_riesgo_catalogo ON new_horizons.ficha_social_riesgo(riesgo_social_id);

ALTER TABLE new_horizons.familiar_declarado ADD CONSTRAINT uq_familiar_local_form UNIQUE(id,formulario_id);
CREATE TABLE new_horizons.autorizacion_traslado_guarderia (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 formulario_id bigint NOT NULL REFERENCES new_horizons.ficha_guarderia(formulario_id),
 familiar_declarado_id bigint NOT NULL,
 puede_llevar boolean NOT NULL,
 puede_recoger boolean NOT NULL,
 activo boolean NOT NULL DEFAULT true,
 CONSTRAINT fk_autorizacion_mismo_form FOREIGN KEY(familiar_declarado_id,formulario_id)
   REFERENCES new_horizons.familiar_declarado(id,formulario_id),
 CONSTRAINT ck_autorizacion_permiso CHECK(NOT activo OR puede_llevar OR puede_recoger),
 UNIQUE(formulario_id,familiar_declarado_id)
);
CREATE INDEX ix_autorizacion_familiar ON new_horizons.autorizacion_traslado_guarderia(familiar_declarado_id,formulario_id);

ALTER TABLE new_horizons.ficha_inicial ADD CONSTRAINT uq_ficha_inicial_local_expediente UNIQUE(id_ficha_inicial,expediente_id);
ALTER TABLE new_horizons.formulario_area ADD COLUMN ficha_inicial_id bigint,
 ADD CONSTRAINT fk_form_ficha_mismo_exp FOREIGN KEY(ficha_inicial_id,expediente_id)
 REFERENCES new_horizons.ficha_inicial(id_ficha_inicial,expediente_id);
CREATE INDEX ix_form_ficha_inicial ON new_horizons.formulario_area(ficha_inicial_id,expediente_id);
-- Metadatos de asignación. No implementa sesiones ni permisos definitivos.
CREATE TABLE new_horizons.asignacion_caso_area (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 expediente_id bigint NOT NULL REFERENCES new_horizons.expediente(id_expediente),
 area_id bigint NOT NULL REFERENCES new_horizons.area(id_area),
 usuario_id bigint NOT NULL REFERENCES new_horizons.usuario(id_usuario),
 asignado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
 activo boolean NOT NULL DEFAULT true,
 UNIQUE(expediente_id,area_id,usuario_id)
);
CREATE INDEX ix_asignacion_usuario_area ON new_horizons.asignacion_caso_area(usuario_id,area_id) WHERE activo;
CREATE INDEX ix_asignacion_area ON new_horizons.asignacion_caso_area(area_id);

-- Propuesta local para el selector de cierre del mockup Social. Sin cambiar otros estados.
INSERT INTO new_horizons.estado_formulario(codigo,descripcion) VALUES('CERRADA','Ficha Social cerrada: propuesta local');
CREATE FUNCTION new_horizons.local_validar_cierre_social() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.estado_codigo='CERRADA' AND (NEW.tipo<>'SOCIAL' OR NOT EXISTS(
  SELECT 1 FROM new_horizons.ficha_social d WHERE d.formulario_id=NEW.id AND d.fecha_cierre IS NOT NULL
  AND d.fecha_cierre >= (NEW.fecha_atencion AT TIME ZONE 'America/Guatemala')::date
  AND length(btrim(coalesce(d.resultados_alcanzados,'')))>0))
 THEN RAISE EXCEPTION 'Cierre social incompleto'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER local_cierre_social BEFORE INSERT OR UPDATE ON new_horizons.formulario_area
 FOR EACH ROW EXECUTE FUNCTION new_horizons.local_validar_cierre_social();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['ficha_social_riesgo','autorizacion_traslado_guarderia','asignacion_caso_area'] LOOP
  EXECUTE format('CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.%I FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar()',t);
  EXECUTE format('CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.%I FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['ficha_social_riesgo','autorizacion_traslado_guarderia'] LOOP
  EXECUTE format('CREATE TRIGGER tocar_cabecera AFTER INSERT OR UPDATE ON new_horizons.%I FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera()',t);
 END LOOP;
END $$;
COMMIT;

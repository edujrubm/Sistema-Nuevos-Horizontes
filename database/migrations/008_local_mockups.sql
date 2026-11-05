-- EXPERIMENTO LOCAL. Base: SQL 01+02, migraciones 003..007.
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

CREATE TABLE new_horizons.estado_revision_documento (
 codigo text PRIMARY KEY, descripcion text NOT NULL
);
INSERT INTO new_horizons.estado_revision_documento VALUES('BORRADOR','Pendiente de revisión'),('REVISADO','Revisado');
ALTER TABLE new_horizons.documento_area
 ADD COLUMN nombre_documento text CHECK(nombre_documento IS NULL OR length(btrim(nombre_documento))>0),
 ADD COLUMN estado_revision_codigo text NOT NULL DEFAULT 'BORRADOR' REFERENCES new_horizons.estado_revision_documento(codigo),
 ADD COLUMN revisado_por bigint REFERENCES new_horizons.usuario(id_usuario),
 ADD COLUMN revisado_en timestamptz,
 ADD COLUMN version_registro integer NOT NULL DEFAULT 1 CHECK(version_registro>0),
 ADD CONSTRAINT ck_revision_documental CHECK(
  (estado_revision_codigo='BORRADOR' AND revisado_por IS NULL AND revisado_en IS NULL)
  OR (estado_revision_codigo='REVISADO' AND revisado_por IS NOT NULL AND revisado_en IS NOT NULL)),
 ADD CONSTRAINT uq_documento_form_local UNIQUE(id,formulario_id),
 ADD CONSTRAINT fk_documento_previo_mismo_form FOREIGN KEY(documento_anterior_id,formulario_id)
  REFERENCES new_horizons.documento_area(id,formulario_id),
 ADD CONSTRAINT uq_documento_sucesor_local UNIQUE(documento_anterior_id);
ALTER TABLE new_horizons.documento_area ADD CONSTRAINT ck_documento_pdf_local CHECK(mime='application/pdf'), ADD CONSTRAINT ck_documento_limite_local CHECK(tamano_bytes<=20971520);
CREATE INDEX ix_documento_form_revision ON new_horizons.documento_area(formulario_id,estado_revision_codigo);
CREATE FUNCTION new_horizons.local_proteger_documento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previo new_horizons.documento_area;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (NEW.formulario_id,NEW.objeto_privado,NEW.mime,NEW.tamano_bytes,NEW.sha256,NEW.version_documento,NEW.documento_anterior_id,NEW.cargado_por,NEW.cargado_en)
   IS DISTINCT FROM (OLD.formulario_id,OLD.objeto_privado,OLD.mime,OLD.tamano_bytes,OLD.sha256,OLD.version_documento,OLD.documento_anterior_id,OLD.cargado_por,OLD.cargado_en)
  THEN RAISE EXCEPTION 'Contenido documental inmutable'; END IF;
  NEW.version_registro=OLD.version_registro+1;
 ELSE
  IF NEW.documento_anterior_id IS NULL AND NEW.version_documento<>1 THEN RAISE EXCEPTION 'Primera version documental invalida'; END IF;
  IF NEW.documento_anterior_id IS NOT NULL THEN
   SELECT * INTO previo FROM new_horizons.documento_area WHERE id=NEW.documento_anterior_id FOR UPDATE;
   IF NOT FOUND OR previo.formulario_id<>NEW.formulario_id OR previo.anulado_en IS NOT NULL
     OR NEW.version_documento<>previo.version_documento+1 THEN RAISE EXCEPTION 'Cadena documental incompatible'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER local_documento_reglas BEFORE INSERT OR UPDATE ON new_horizons.documento_area
 FOR EACH ROW EXECUTE FUNCTION new_horizons.local_proteger_documento();

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
CREATE FUNCTION new_horizons.local_json_seguro(j jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT jsonb_object_agg(key,CASE WHEN (key='id' OR key LIKE '%\_id' ESCAPE '\') AND value <> 'null'::jsonb THEN to_jsonb(value #>> '{}') ELSE value END)
 FROM jsonb_each(j)
$$;
COMMIT;

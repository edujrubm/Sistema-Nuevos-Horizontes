-- Propuesta de migración operativa; aplicar manualmente tras 007, previa copia y revisión.

BEGIN;
-- Prevalidar datos históricos antes de añadir las restricciones. No se corrigen ni borran en silencio.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM new_horizons.documento_area d LEFT JOIN new_horizons.documento_area p ON p.id=d.documento_anterior_id
 WHERE d.mime<>'application/pdf' OR d.tamano_bytes>20971520 OR d.tamano_bytes<=0
 OR (d.documento_anterior_id IS NULL AND d.version_documento<>1)
 OR (d.documento_anterior_id IS NOT NULL AND (p.id IS NULL OR p.formulario_id<>d.formulario_id OR d.version_documento<>p.version_documento+1)))
 THEN RAISE EXCEPTION 'Documentos históricos incompatibles: revisar formato, tamaño y cadena de versiones antes de migrar'; END IF;
END $$;

CREATE TABLE new_horizons.estado_revision_documento (

 codigo text PRIMARY KEY, descripcion text NOT NULL

);

INSERT INTO new_horizons.estado_revision_documento VALUES('BORRADOR','Pendiente de revisiÃ³n'),('REVISADO','Revisado');

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



CREATE FUNCTION new_horizons.local_json_seguro(j jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$

 SELECT jsonb_object_agg(key,CASE WHEN (key='id' OR key LIKE '%\_id' ESCAPE '\') AND value <> 'null'::jsonb THEN to_jsonb(value #>> '{}') ELSE value END)

 FROM jsonb_each(j)

$$;

COMMIT;

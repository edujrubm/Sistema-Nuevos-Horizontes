-- Retira exclusivamente el flujo de revisión suprimido por la decisión D-13.
-- Aplicación manual tras respaldo y revisión del encargado. No elimina PDFs.
BEGIN;

LOCK TABLE new_horizons.documento_area IN ACCESS EXCLUSIVE MODE;

-- Conserva evidencia histórica fuera del modelo operativo y de las respuestas API.
CREATE TABLE new_horizons.archivo_revision_documental (
  origen text PRIMARY KEY,
  datos jsonb NOT NULL,
  archivado_en timestamptz NOT NULL DEFAULT clock_timestamp()
);
COMMENT ON TABLE new_horizons.archivo_revision_documental IS
  'Archivo histórico de la revisión retirada; no concede permisos ni define estados de PDF.';

INSERT INTO new_horizons.archivo_revision_documental (origen, datos)
SELECT 'documento:' || id::text,
  jsonb_build_object('documento_id', id::text,
    'estado_revision_codigo', estado_revision_codigo,
    'revisado_por', revisado_por::text, 'revisado_en', revisado_en)
FROM new_horizons.documento_area;

INSERT INTO new_horizons.archivo_revision_documental (origen, datos)
SELECT 'estado:' || codigo, to_jsonb(e)
FROM new_horizons.estado_revision_documento e;

-- PostgreSQL retira también el CHECK, FK e índice dependientes de estas columnas.
-- Sin CASCADE: una dependencia externa inesperada aborta y revierte la transacción.
ALTER TABLE new_horizons.documento_area
  DROP COLUMN estado_revision_codigo,
  DROP COLUMN revisado_por,
  DROP COLUMN revisado_en;
DROP TABLE new_horizons.estado_revision_documento;

REVOKE ALL ON new_horizons.archivo_revision_documental FROM PUBLIC;
COMMIT;

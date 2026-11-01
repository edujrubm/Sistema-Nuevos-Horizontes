-- Campos aprobables de los mockups de Persona 3.
-- Migración aditiva: no reemplaza los scripts 001/002 ni impone obligatoriedad
-- sobre borradores. Los catálogos de riesgos, autorizaciones de traslado,
-- revisión documental, estado CERRADA y vínculo a ficha inicial quedan fuera
-- hasta contar con decisión institucional expresa.

BEGIN;

ALTER TABLE new_horizons.ficha_social
  ADD COLUMN IF NOT EXISTS tipo_vivienda text,
  ADD COLUMN IF NOT EXISTS composicion_familiar text,
  ADD COLUMN IF NOT EXISTS redes_apoyo text,
  ADD COLUMN IF NOT EXISTS dependencia_economica boolean,
  ADD COLUMN IF NOT EXISTS responsable_plan text,
  ADD COLUMN IF NOT EXISTS fecha_revision date,
  ADD COLUMN IF NOT EXISTS area_coordinacion_id bigint REFERENCES new_horizons.area(id_area),
  ADD COLUMN IF NOT EXISTS resultados_alcanzados text,
  ADD COLUMN IF NOT EXISTS fecha_cierre date,
  ADD COLUMN IF NOT EXISTS observaciones text;

CREATE INDEX IF NOT EXISTS ix_ficha_social_area_coordinacion
  ON new_horizons.ficha_social(area_coordinacion_id);

ALTER TABLE new_horizons.ficha_legal
  ADD COLUMN IF NOT EXISTS relacion_partes text,
  ADD COLUMN IF NOT EXISTS normativa_aplicable text,
  ADD COLUMN IF NOT EXISTS objetivo_legal text,
  ADD COLUMN IF NOT EXISTS tipo_juicio text,
  ADD COLUMN IF NOT EXISTS estado_proceso text,
  ADD COLUMN IF NOT EXISTS proxima_actuacion_fecha date,
  ADD COLUMN IF NOT EXISTS actuaciones_realizadas text,
  ADD COLUMN IF NOT EXISTS acuerdos_proximos_pasos text,
  ADD COLUMN IF NOT EXISTS observaciones text;

ALTER TABLE new_horizons.referencia_legal
  ADD COLUMN IF NOT EXISTS medio_entrega text;

ALTER TABLE new_horizons.ficha_guarderia
  ADD COLUMN IF NOT EXISTS observaciones_familiares text,
  ADD COLUMN IF NOT EXISTS indicaciones_salud text;

ALTER TABLE new_horizons.documento_area
  ADD COLUMN IF NOT EXISTS fecha_documento date,
  ADD COLUMN IF NOT EXISTS descripcion text;

COMMIT;

-- Aplicada en la base PostgreSQL de ensayo el 2026-10-28.
-- No editar después de aplicada; cualquier corrección requiere una migración nueva.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

ALTER TABLE new_horizons.beneficiaria
  ADD COLUMN IF NOT EXISTS creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE new_horizons.nino
  ADD COLUMN IF NOT EXISTS creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE new_horizons.ficha_inicial
  ADD COLUMN IF NOT EXISTS estado varchar(20) NOT NULL DEFAULT 'BORRADOR',
  ADD COLUMN IF NOT EXISTS creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD COLUMN IF NOT EXISTS confirmada_en timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE new_horizons.expediente
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inactivado_en timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_inactivacion varchar(500);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_beneficiaria_version_positiva'
  ) THEN
    ALTER TABLE new_horizons.beneficiaria
      ADD CONSTRAINT ck_beneficiaria_version_positiva CHECK (version > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_nino_version_positiva'
  ) THEN
    ALTER TABLE new_horizons.nino
      ADD CONSTRAINT ck_nino_version_positiva CHECK (version > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_ficha_inicial_estado'
  ) THEN
    ALTER TABLE new_horizons.ficha_inicial
      ADD CONSTRAINT ck_ficha_inicial_estado
      CHECK (estado IN ('BORRADOR', 'CONFIRMADA'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_ficha_inicial_version_positiva'
  ) THEN
    ALTER TABLE new_horizons.ficha_inicial
      ADD CONSTRAINT ck_ficha_inicial_version_positiva CHECK (version > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'new_horizons'::regnamespace
      AND conname = 'ck_expediente_inactivacion_coherente'
  ) THEN
    ALTER TABLE new_horizons.expediente
      ADD CONSTRAINT ck_expediente_inactivacion_coherente CHECK (
        (activo AND inactivado_en IS NULL AND motivo_inactivacion IS NULL)
        OR
        (NOT activo AND inactivado_en IS NOT NULL AND length(btrim(motivo_inactivacion)) > 0)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS new_horizons.ficha_inicial_seccion (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ficha_inicial_id bigint NOT NULL
    REFERENCES new_horizons.ficha_inicial(id_ficha_inicial),
  seccion varchar(60) NOT NULL,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(contenido) = 'object'),
  creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (ficha_inicial_id, seccion)
);

CREATE OR REPLACE FUNCTION new_horizons.auditar() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE actor bigint; razon text; reg text;
BEGIN
  actor := nullif(current_setting('new_horizons.actor_id', true), '')::bigint;
  razon := nullif(btrim(current_setting('new_horizons.motivo', true)), '');
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Se requiere SET LOCAL new_horizons.actor_id';
  END IF;
  IF TG_OP = 'UPDATE' AND razon IS NULL THEN
    RAISE EXCEPTION 'Se requiere motivo de correccion';
  END IF;
  reg := coalesce(
    to_jsonb(NEW)->>'id',
    to_jsonb(NEW)->>'id_expediente',
    to_jsonb(NEW)->>'id_beneficiaria',
    to_jsonb(NEW)->>'id_ficha_inicial',
    to_jsonb(NEW)->>'nino_id',
    to_jsonb(NEW)->>'formulario_id'
  );
  IF reg IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar el registro auditado de %', TG_TABLE_NAME;
  END IF;
  INSERT INTO new_horizons.revision_registro(
    tabla, registro_id, operacion, anterior, nuevo, actor_id, motivo
  ) VALUES (
    TG_TABLE_NAME, reg, TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) END,
    to_jsonb(NEW), actor, razon
  );
  RETURN NEW;
END $$;

DO $$
DECLARE tabla text;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'beneficiaria', 'nino', 'ficha_inicial', 'ficha_inicial_seccion'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('new_horizons.%I', tabla)::regclass
        AND tgname = 'versionar'
        AND NOT tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER versionar BEFORE UPDATE ON new_horizons.%I '
        'FOR EACH ROW EXECUTE FUNCTION new_horizons.preparar_version()', tabla
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('new_horizons.%I', tabla)::regclass
        AND tgname = 'auditoria'
        AND NOT tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.%I '
        'FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar()', tabla
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('new_horizons.%I', tabla)::regclass
        AND tgname = 'sin_borrado'
        AND NOT tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.%I '
        'FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado()', tabla
      );
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS ix_beneficiaria_nombre
  ON new_horizons.beneficiaria (lower(nombre), id_beneficiaria);
CREATE INDEX IF NOT EXISTS ix_ficha_inicial_estado
  ON new_horizons.ficha_inicial (estado, id_ficha_inicial);
CREATE INDEX IF NOT EXISTS ix_ficha_seccion_ficha
  ON new_horizons.ficha_inicial_seccion (ficha_inicial_id, seccion);

COMMIT;

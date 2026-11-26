-- Centraliza la normalización de opciones Otra/Otros fuera del JSON de la ficha.
BEGIN;

CREATE TABLE new_horizons.valor_otro_ficha_inicial (
  id bigserial PRIMARY KEY,
  seccion varchar(60) NOT NULL CHECK (length(btrim(seccion)) > 0),
  campo varchar(80) NOT NULL CHECK (length(btrim(campo)) > 0),
  valor_normalizado varchar(2000) NOT NULL
    CHECK (length(btrim(valor_normalizado)) > 0),
  etiqueta_reporteria varchar(200)
    CHECK (etiqueta_reporteria IS NULL OR length(btrim(etiqueta_reporteria)) > 0),
  actualizado_por bigint REFERENCES new_horizons.usuario(id_usuario),
  creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_valor_otro_ficha
    UNIQUE (seccion, campo, valor_normalizado)
);

CREATE INDEX ix_valor_otro_ficha_etiqueta
  ON new_horizons.valor_otro_ficha_inicial(etiqueta_reporteria)
  WHERE etiqueta_reporteria IS NOT NULL;

CREATE FUNCTION new_horizons.normalizar_valor_otro(valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        btrim(
          translate(
            lower(
              translate(
                regexp_replace(valor, U&'[\0300-\036F]', '', 'g'),
                U&'\200B\200C\200D\FEFF',
                ''
              )
            ),
            'áàäâãåéèëêíìïîóòöôõúùüûñç',
            'aaaaaaeeeeiiiiooooouuuunc'
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      '[.[:space:]]+$',
      '',
      'g'
    ),
    ''
  )
$$;

CREATE FUNCTION new_horizons.registrar_valores_otros_ficha()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_campo text;
  v_campos text[];
  v_normalizado text;
BEGIN
  v_campos := CASE NEW.seccion
    WHEN 'identificacion' THEN ARRAY['otroTipoDocumento']
    WHEN 'residencia' THEN ARRAY['otroDetalleResidencial']
    WHEN 'datos-generales' THEN ARRAY['otraEtnia', 'otroNivelEscolaridad']
    WHEN 'salud' THEN ARRAY['otraDiscapacidad']
    WHEN 'agresores' THEN ARRAY['otroTipoDocumento']
    WHEN 'tipos-violencia' THEN ARRAY['otra']
    WHEN 'objetos-agresion' THEN ARRAY['otra']
    WHEN 'situaciones-riesgo' THEN
      ARRAY['otraSituacion', 'otroPeriodo', 'otroVinculoAgresor']
    ELSE ARRAY[]::text[]
  END;

  FOREACH v_campo IN ARRAY v_campos LOOP
    v_normalizado := new_horizons.normalizar_valor_otro(
      NEW.contenido ->> v_campo
    );
    IF v_normalizado IS NOT NULL THEN
      INSERT INTO new_horizons.valor_otro_ficha_inicial(
        seccion,
        campo,
        valor_normalizado
      )
      VALUES (NEW.seccion, v_campo, v_normalizado)
      ON CONFLICT (seccion, campo, valor_normalizado) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registrar_valores_otros_ficha
AFTER INSERT OR UPDATE OF contenido
ON new_horizons.ficha_inicial_seccion
FOR EACH ROW
EXECUTE FUNCTION new_horizons.registrar_valores_otros_ficha();

-- Migra los valores anteriores y conserva una etiqueta administrativa ya
-- asignada. DISTINCT ON evita actualizar dos veces la misma clave normalizada.
WITH campos(seccion, campo) AS (
  VALUES
    ('identificacion', 'otroTipoDocumento'),
    ('residencia', 'otroDetalleResidencial'),
    ('datos-generales', 'otraEtnia'),
    ('datos-generales', 'otroNivelEscolaridad'),
    ('salud', 'otraDiscapacidad'),
    ('agresores', 'otroTipoDocumento'),
    ('tipos-violencia', 'otra'),
    ('objetos-agresion', 'otra'),
    ('situaciones-riesgo', 'otraSituacion'),
    ('situaciones-riesgo', 'otroPeriodo'),
    ('situaciones-riesgo', 'otroVinculoAgresor')
), fuente AS (
  SELECT DISTINCT ON (s.seccion, c.campo, normalizado)
    s.seccion,
    c.campo,
    normalizado,
    NULLIF(btrim(s.contenido ->> (c.campo || 'EtiquetaReporteria')), '')
      AS etiqueta
  FROM new_horizons.ficha_inicial_seccion s
  JOIN campos c ON c.seccion = s.seccion
  CROSS JOIN LATERAL (
    SELECT new_horizons.normalizar_valor_otro(s.contenido ->> c.campo)
      AS normalizado
  ) n
  WHERE normalizado IS NOT NULL
  ORDER BY s.seccion, c.campo, normalizado,
    (NULLIF(btrim(s.contenido ->> (c.campo || 'EtiquetaReporteria')), '')
      IS NOT NULL) DESC,
    s.id DESC
)
INSERT INTO new_horizons.valor_otro_ficha_inicial(
  seccion,
  campo,
  valor_normalizado,
  etiqueta_reporteria
)
SELECT seccion, campo, normalizado, etiqueta
FROM fuente
ON CONFLICT (seccion, campo, valor_normalizado) DO UPDATE
SET etiqueta_reporteria = COALESCE(
  EXCLUDED.etiqueta_reporteria,
  valor_otro_ficha_inicial.etiqueta_reporteria
);

-- Las claves técnicas antiguas no se usan desde esta migración. Se eliminan al
-- volver a guardar la sección, dentro de la transacción auditada habitual.

COMMIT;

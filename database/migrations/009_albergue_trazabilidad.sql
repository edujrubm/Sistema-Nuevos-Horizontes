-- Complemento operativo de Persona 4. No reescribe ni inventa autores/horas históricos.
BEGIN;
CREATE TABLE new_horizons.evento_albergue (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 estancia_id bigint NOT NULL REFERENCES new_horizons.activos_albergue,
 tipo text NOT NULL CHECK(tipo IN ('INGRESO','SALIDA_TEMPORAL','RETORNO','EGRESO','NACIMIENTO')),
 fecha timestamptz NOT NULL DEFAULT clock_timestamp(),
 registrado_por bigint NOT NULL REFERENCES new_horizons.usuario,
 motivo text NOT NULL CHECK(length(btrim(motivo))>0),
 movimiento_id bigint REFERENCES new_horizons.movimiento_albergue,
 nino_id bigint REFERENCES new_horizons.nino
);
CREATE INDEX ix_evento_albergue_fecha ON new_horizons.evento_albergue(fecha DESC,id DESC);
CREATE INDEX ix_evento_albergue_estancia ON new_horizons.evento_albergue(estancia_id,id);
COMMIT;

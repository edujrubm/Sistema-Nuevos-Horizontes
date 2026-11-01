-- AMPLIACION del DDL 01_new_horizons_postgresql.sql entregado por el usuario.
-- Ejecutar una sola vez sobre ese esquema; no recrea tablas existentes.
-- Revision estatica realizada. Pendiente de ejecutar en PostgreSQL de ensayo.
-- Decision de modelo: cada beneficiaria tiene un expediente contenedor.
-- ficha_inicial y formulario_area pertenecen al mismo expediente; formulario_area se mantiene como cabecera comun.
BEGIN;
SET LOCAL TIME ZONE 'UTC';
-- Contenedor único de todos los registros institucionales de una beneficiaria.
CREATE TABLE new_horizons.expediente (
  id_expediente bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  beneficiaria_id bigint NOT NULL UNIQUE REFERENCES new_horizons.beneficiaria(id_beneficiaria),
  creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  UNIQUE(id_expediente,beneficiaria_id)
);

-- Crear un expediente para cada beneficiaria ya registrada.
INSERT INTO new_horizons.expediente(beneficiaria_id)
SELECT id_beneficiaria FROM new_horizons.beneficiaria;

-- Incorporar los hijos al expediente y retirar la relación directa anterior con beneficiaria.
ALTER TABLE new_horizons.nino ADD COLUMN expediente_id bigint;
UPDATE new_horizons.nino n
SET expediente_id=ex.id_expediente
FROM new_horizons.expediente ex
WHERE ex.beneficiaria_id=n.beneficiaria_id;
ALTER TABLE new_horizons.nino ALTER COLUMN expediente_id SET NOT NULL;
ALTER TABLE new_horizons.nino DROP CONSTRAINT fk_21_nino;
ALTER TABLE new_horizons.nino DROP COLUMN beneficiaria_id;
ALTER TABLE new_horizons.nino
  ADD CONSTRAINT fk_nino_expediente FOREIGN KEY(expediente_id)
  REFERENCES new_horizons.expediente(id_expediente);
ALTER TABLE new_horizons.nino
  ADD CONSTRAINT uq_nino_expediente_formularios UNIQUE(nino_id,expediente_id);

-- Incorporar las fichas iniciales existentes al expediente de su beneficiaria.
ALTER TABLE new_horizons.ficha_inicial ADD COLUMN expediente_id bigint;
UPDATE new_horizons.ficha_inicial fi
SET expediente_id=ex.id_expediente
FROM new_horizons.expediente ex
WHERE ex.beneficiaria_id=fi.beneficiaria_id;
ALTER TABLE new_horizons.ficha_inicial ALTER COLUMN expediente_id SET NOT NULL;
ALTER TABLE new_horizons.ficha_inicial DROP CONSTRAINT fk_32_ficha_inicial;
ALTER TABLE new_horizons.ficha_inicial DROP COLUMN beneficiaria_id;
ALTER TABLE new_horizons.ficha_inicial
  ADD CONSTRAINT fk_ficha_expediente FOREIGN KEY(expediente_id)
  REFERENCES new_horizons.expediente(id_expediente);
-- No se cambian tipos, longitudes, geografia ni claves de las tablas originales.
-- Reusar areas existentes por nombre sin depender de IDs numericos fijos.
DO $$
BEGIN
 IF EXISTS(SELECT lower(btrim(nombre_area)) FROM new_horizons.area
 WHERE lower(btrim(nombre_area)) IN ('psicología','trabajo social','medicina','legal','guardería')
 GROUP BY lower(btrim(nombre_area)) HAVING count(*)>1)
 THEN RAISE EXCEPTION 'Areas ambiguas: conciliar duplicados antes de ampliar'; END IF;
END $$;
INSERT INTO new_horizons.area(nombre_area)
SELECT x.nombre FROM (VALUES ('Psicología'),('Trabajo Social'),('Medicina'),('Legal'),('Guardería')) x(nombre)
WHERE NOT EXISTS(SELECT 1 FROM new_horizons.area a WHERE lower(btrim(a.nombre_area))=lower(x.nombre));

CREATE TABLE new_horizons.tipo_formulario (
  codigo text PRIMARY KEY,
  area_id bigint NOT NULL REFERENCES new_horizons.area,
  descripcion text NOT NULL,
  UNIQUE(codigo,area_id)
);

INSERT INTO new_horizons.tipo_formulario SELECT 'PSICOLOGIA_MUJER', id_area, 'psicologia_mujer' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Psicología');
INSERT INTO new_horizons.tipo_formulario SELECT 'PSICOLOGIA_NINEZ', id_area, 'psicologia_ninez' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Psicología');
INSERT INTO new_horizons.tipo_formulario SELECT 'SOCIAL', id_area, 'ficha_social' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Trabajo Social');
INSERT INTO new_horizons.tipo_formulario SELECT 'MEDICINA_NINEZ', id_area, 'consulta_medica' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Medicina');
INSERT INTO new_horizons.tipo_formulario SELECT 'MEDICINA_ADOLESCENTE', id_area, 'consulta_medica' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Medicina');
INSERT INTO new_horizons.tipo_formulario SELECT 'MEDICINA_MUJER', id_area, 'consulta_medica' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Medicina');
INSERT INTO new_horizons.tipo_formulario SELECT 'LEGAL', id_area, 'ficha_legal' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Legal');
INSERT INTO new_horizons.tipo_formulario SELECT 'REFERENCIA_LEGAL', id_area, 'referencia_legal' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Legal');
INSERT INTO new_horizons.tipo_formulario SELECT 'GUARDERIA', id_area, 'ficha_guarderia' FROM new_horizons.area WHERE lower(btrim(nombre_area))=lower('Guardería');
CREATE TABLE new_horizons.estado_formulario (
  codigo text PRIMARY KEY,
  descripcion text NOT NULL
);

-- Estados institucionales sin seed: aprobar y cargar antes de insertar formularios.
CREATE TABLE new_horizons.formulario_area (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  expediente_id bigint NOT NULL,
  nino_id bigint,
  area_id bigint NOT NULL REFERENCES new_horizons.area,
  tipo text NOT NULL,
  estado_codigo text NOT NULL REFERENCES new_horizons.estado_formulario,
  fecha_atencion timestamptz NOT NULL,
  profesional_id bigint NOT NULL REFERENCES new_horizons.empleado,
  capturado_por bigint NOT NULL REFERENCES new_horizons.usuario,
  creado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  motivo_cambio text,
  identidad_al_atender jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(identidad_al_atender)='object'),
  firma_documento_id bigint,
  FOREIGN KEY(expediente_id) REFERENCES new_horizons.expediente(id_expediente),
  FOREIGN KEY(nino_id,expediente_id) REFERENCES new_horizons.nino(nino_id,expediente_id),
  FOREIGN KEY(tipo,area_id) REFERENCES new_horizons.tipo_formulario(codigo,area_id),
  UNIQUE(id,tipo),
  UNIQUE(id,nino_id,area_id),
  CHECK(tipo NOT IN ('PSICOLOGIA_NINEZ','MEDICINA_NINEZ','GUARDERIA') OR nino_id IS NOT NULL),
  CHECK(tipo NOT IN ('PSICOLOGIA_MUJER','MEDICINA_MUJER','MEDICINA_ADOLESCENTE','SOCIAL','LEGAL','REFERENCIA_LEGAL') OR nino_id IS NULL)
);

CREATE TABLE new_horizons.psicologia_mujer (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'PSICOLOGIA_MUJER' CHECK(tipo IN ('PSICOLOGIA_MUJER')),
  motivo_consulta text,
  historia_problema_actual text,
  antecedentes_patologicos text,
  antecedentes_no_patologicos text,
  historia_familiar text,
  pruebas_auxiliares text,
  criterios_diagnosticos text,
  eje_i text,
  eje_ii text,
  eje_iii text,
  eje_iv text,
  eje_v text,
  plan_terapeutico text,
  observaciones text,
  numero_hermanos integer CHECK(numero_hermanos>=0),
  orden_entre_hermanos integer CHECK(orden_entre_hermanos>0),
  hijos_vivos_reportados integer CHECK(hijos_vivos_reportados>=0),
  hijos_fallecidos_reportados integer CHECK(hijos_fallecidos_reportados>=0),
  referida_por text,
  fecha_referencia date,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.psicologia_ninez (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'PSICOLOGIA_NINEZ' CHECK(tipo IN ('PSICOLOGIA_NINEZ')),
  motivo_consulta text,
  historia_problema_actual text,
  antecedentes_patologicos text,
  antecedentes_no_patologicos text,
  historia_familiar text,
  pruebas_auxiliares text,
  criterios_diagnosticos text,
  eje_i text,
  eje_ii text,
  eje_iii text,
  eje_iv text,
  eje_v text,
  plan_terapeutico text,
  observaciones text,
  antecedentes_personales text,
  enfermedades_madre_embarazo text,
  tipo_embarazo text,
  condiciones_parto text,
  movimientos_generales text,
  desde_cuando_enuresis text,
  desde_cuando_encopresis text,
  problemas_habla_detalle text,
  con_quien_duerme text,
  motivo_temor_oscuridad text,
  miedo_lugar_detalle text,
  actitud_madre text,
  actitud_padre text,
  relacion_entre_padres text,
  reaccion_negacion text,
  frecuencia_berrinches text,
  respuesta_padres_berrinches text,
  juguetes_preferidos text,
  juegos_preferidos text,
  estrategias_obediencia_madre text,
  castigos_utilizados text,
  reaccion_castigos text,
  acontecimientos_importantes text,
  otras_personas_casa boolean,
  hijo_deseado boolean,
  colabora_actividades_domesticas boolean,
  enuresis boolean,
  encopresis boolean,
  problemas_habla boolean,
  obedece_ordenes_sencillas boolean,
  resistencia_dormir boolean,
  misma_cama boolean,
  temor_oscuridad boolean,
  miedo_lugar boolean,
  gusta_abrazo_padres boolean,
  gestacion_semanas numeric(7,2) CHECK(gestacion_semanas>=0),
  sostuvo_cabeza_meses numeric(7,2) CHECK(sostuvo_cabeza_meses>=0),
  gateo_meses numeric(7,2) CHECK(gateo_meses>=0),
  se_sento_meses numeric(7,2) CHECK(se_sento_meses>=0),
  se_paro_meses numeric(7,2) CHECK(se_paro_meses>=0),
  primeros_pasos_meses numeric(7,2) CHECK(primeros_pasos_meses>=0),
  horas_sueno numeric(4,2) CHECK(horas_sueno BETWEEN 0 AND 24),
  numero_hermanos integer CHECK(numero_hermanos>=0),
  orden_entre_hermanos integer CHECK(orden_entre_hermanos>0),
  referida_por text,
  fecha_referencia date,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.psicologia_examen_mental (
  formulario_id bigint PRIMARY KEY REFERENCES new_horizons.formulario_area,
  apariencia text,
  actitud text,
  lenguaje text,
  percepcion text,
  humor text,
  inteligencia text,
  orientacion_espacial text,
  orientacion_temporal text,
  contenido_pensamiento text,
  curso_pensamiento text,
  control_impulsos text,
  insight text
);

CREATE TABLE new_horizons.datos_generales_atencion (
  formulario_id bigint PRIMARY KEY REFERENCES new_horizons.formulario_area,
  sexo_registrado text,
  religion text,
  nacimiento_lugar_descripcion text,
  escolaridad_id bigint REFERENCES new_horizons.nivel_estudio,
  ocupacion_id bigint REFERENCES new_horizons.ocupacion,
  estado_civil_id bigint REFERENCES new_horizons.estado_civil,
  residencia_id bigint REFERENCES new_horizons.residencia,
  telefono_contacto text
);

CREATE TABLE new_horizons.familiar_declarado (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  formulario_id bigint NOT NULL REFERENCES new_horizons.formulario_area,
  vinculo text NOT NULL CHECK(vinculo IN ('MADRE','PADRE','CONYUGE','HIJO','CONVIVIENTE','RESPONSABLE')),
  nombre text,
  cui text,
  fecha_nac date,
  edad_referida_texto text,
  ocupacion_id bigint REFERENCES new_horizons.ocupacion,
  religion text,
  direccion text,
  telefono text,
  parentesco_id bigint REFERENCES new_horizons.parentesco,
  beneficiaria_vinculada_id bigint REFERENCES new_horizons.beneficiaria,
  nino_vinculado_id bigint REFERENCES new_horizons.nino,
  CHECK(NOT(beneficiaria_vinculada_id IS NOT NULL AND nino_vinculado_id IS NOT NULL))
);

CREATE TABLE new_horizons.ficha_social (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'SOCIAL' CHECK(tipo IN ('SOCIAL')),
  historia_violencia text,
  diagnostico_social text,
  riesgos_identificados text,
  plan_eliminacion_riesgos text,
  objetivo_general text,
  actividades text,
  evaluacion text,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.consulta_medica (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL  CHECK(tipo IN ('MEDICINA_NINEZ','MEDICINA_ADOLESCENTE','MEDICINA_MUJER')),
  nombre_responsable_declarado text,
  motivo_consulta text,
  historia_enfermedad_actual text,
  esquema_vacunacion text,
  condiciones_nacer text,
  antecedentes_patologicos text,
  antecedentes_importancia text,
  antecedentes_ginecologicos text,
  examen_fisico_general text,
  cabeza text,
  torax text,
  abdomen text,
  genitales text,
  ginecologico text,
  extremidades text,
  impresion_clinica text,
  tratamiento text,
  laboratorios_examenes text,
  referencia text,
  proxima_cita_indicaciones text,
  frecuencia_cardiaca_lpm numeric(6,2) CHECK(frecuencia_cardiaca_lpm>0),
  frecuencia_respiratoria_rpm numeric(6,2) CHECK(frecuencia_respiratoria_rpm>0),
  temperatura_c numeric(5,2),
  talla_cm numeric(7,2) CHECK(talla_cm>0),
  peso_kg numeric(7,3) CHECK(peso_kg>0),
  presion_sistolica_mmhg numeric(6,2) CHECK(presion_sistolica_mmhg>0),
  presion_diastolica_mmhg numeric(6,2) CHECK(presion_diastolica_mmhg>0),
  proxima_cita timestamptz,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.ficha_legal (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'LEGAL' CHECK(tipo IN ('LEGAL')),
  demandado_agresor_id bigint REFERENCES new_horizons.agresor,
  demandado_nombre_declarado text,
  diagnostico_juridico text,
  plan_tratamiento text,
  referencia text,
  inicio_proceso_descripcion text,
  juzgado text,
  numero_juicio text,
  juez_oficial text,
  diligenciamiento text,
  inicio_proceso_fecha date,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.referencia_legal (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'REFERENCIA_LEGAL' CHECK(tipo IN ('REFERENCIA_LEGAL')),
  destino text,
  origen text,
  motivo_referencia text,
  recomendaciones text,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.ficha_guarderia (
  formulario_id bigint PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'GUARDERIA' CHECK(tipo IN ('GUARDERIA')),
  numero_ficha text,
  fecha_ingreso date,
  etnia_id bigint REFERENCES new_horizons.etnia,
  situacion_socioeconomica text,
  condicion_vivienda text,
  lugar_estudio text,
  telefono_escuela text,
  enfermedad_detalle text,
  tratamiento text,
  observaciones text,
  padece_enfermedad boolean,
  escolaridad_id bigint REFERENCES new_horizons.nivel_estudio,
  FOREIGN KEY(formulario_id,tipo) REFERENCES new_horizons.formulario_area(id,tipo)
);

CREATE TABLE new_horizons.entrada_evolutiva (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  formulario_id bigint NOT NULL REFERENCES new_horizons.formulario_area,
  accion text NOT NULL CHECK(length(btrim(accion))>0),
  contenido text NOT NULL CHECK(length(btrim(contenido))>0),
  plan_seguimiento text,
  resultado text,
  fecha_atencion timestamptz NOT NULL,
  registrado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  profesional_id bigint NOT NULL REFERENCES new_horizons.empleado,
  capturado_por bigint NOT NULL REFERENCES new_horizons.usuario,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  motivo_cambio text,
  actualizado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  origen_sistema text,
  origen_id text,
  CHECK((origen_sistema IS NULL)=(origen_id IS NULL)),
  UNIQUE(origen_sistema,origen_id)
);

CREATE TABLE new_horizons.documento_area (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  formulario_id bigint NOT NULL REFERENCES new_horizons.formulario_area,
  categoria text NOT NULL,
  objeto_privado text NOT NULL UNIQUE,
  mime text NOT NULL,
  tamano_bytes bigint NOT NULL CHECK(tamano_bytes>0),
  sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
  version_documento integer NOT NULL CHECK(version_documento>0),
  documento_anterior_id bigint REFERENCES new_horizons.documento_area,
  cargado_por bigint NOT NULL REFERENCES new_horizons.usuario,
  cargado_en timestamptz NOT NULL DEFAULT clock_timestamp(),
  anulado_en timestamptz,
  anulado_por bigint REFERENCES new_horizons.usuario,
  motivo_anulacion text,
  CHECK((anulado_en IS NULL AND anulado_por IS NULL AND motivo_anulacion IS NULL) OR (anulado_en IS NOT NULL AND anulado_por IS NOT NULL AND length(btrim(motivo_anulacion))>0))
);

ALTER TABLE new_horizons.formulario_area ADD CONSTRAINT fk_firma FOREIGN KEY(firma_documento_id) REFERENCES new_horizons.documento_area(id);
CREATE TABLE new_horizons.estancia_nino (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activo_albergue_id bigint NOT NULL REFERENCES new_horizons.activos_albergue,
  nino_id bigint NOT NULL REFERENCES new_horizons.nino,
  fecha_ingreso timestamptz NOT NULL,
  fecha_egreso timestamptz,
  registrado_por bigint NOT NULL REFERENCES new_horizons.usuario,
  CHECK(fecha_egreso IS NULL OR fecha_egreso>=fecha_ingreso)
);

CREATE UNIQUE INDEX uq_estancia_nino_activa ON new_horizons.estancia_nino(nino_id) WHERE fecha_egreso IS NULL;
CREATE TABLE new_horizons.movimiento_nino (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  estancia_nino_id bigint NOT NULL REFERENCES new_horizons.estancia_nino,
  tipo text NOT NULL CHECK(tipo IN ('SALIDA_TEMPORAL','RETORNO')),
  fecha timestamptz NOT NULL DEFAULT clock_timestamp(),
  destino text,
  responsable text,
  registrado_por bigint NOT NULL REFERENCES new_horizons.usuario
);

CREATE TABLE new_horizons.revision_registro (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla text NOT NULL,
  registro_id text NOT NULL,
  operacion text NOT NULL,
  anterior jsonb,
  nuevo jsonb,
  actor_id bigint NOT NULL REFERENCES new_horizons.usuario,
  motivo text,
  registrado_en timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE FUNCTION new_horizons.auditar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor bigint; razon text; reg text;
BEGIN
 actor := nullif(current_setting('new_horizons.actor_id',true),'')::bigint;
 razon := nullif(btrim(current_setting('new_horizons.motivo',true)), '');
 IF actor IS NULL THEN RAISE EXCEPTION 'Se requiere SET LOCAL new_horizons.actor_id'; END IF;
 IF TG_OP='UPDATE' AND razon IS NULL THEN RAISE EXCEPTION 'Se requiere motivo de correccion'; END IF;
 reg := coalesce(to_jsonb(NEW)->>'id',to_jsonb(NEW)->>'id_expediente',to_jsonb(NEW)->>'formulario_id');
 INSERT INTO new_horizons.revision_registro(tabla,registro_id,operacion,anterior,nuevo,actor_id,motivo)
 VALUES(TG_TABLE_NAME,reg,TG_OP,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW),actor,razon);
 RETURN NEW;
END $$;
CREATE FUNCTION new_horizons.preparar_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.version:=OLD.version+1; NEW.actualizado_en:=clock_timestamp(); RETURN NEW;
END $$;
CREATE FUNCTION new_horizons.proteger_cabecera() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.expediente_id,NEW.nino_id,NEW.area_id,NEW.tipo)
 IS DISTINCT FROM (OLD.expediente_id,OLD.nino_id,OLD.area_id,OLD.tipo)
 THEN RAISE EXCEPTION 'No se permite cambiar el expediente, sujeto, area o tipo'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_cabecera BEFORE UPDATE ON new_horizons.formulario_area FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_cabecera();
CREATE FUNCTION new_horizons.tocar_cabecera() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE new_horizons.formulario_area SET motivo_cambio=nullif(current_setting('new_horizons.motivo',true),'') WHERE id=NEW.formulario_id;
 RETURN NEW;
END $$;
CREATE FUNCTION new_horizons.impedir_borrado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Borrado fisico no permitido'; END $$;

CREATE FUNCTION new_horizons.proteger_identidad_expediente() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.id_expediente IS DISTINCT FROM OLD.id_expediente
    OR NEW.beneficiaria_id IS DISTINCT FROM OLD.beneficiaria_id THEN
  RAISE EXCEPTION 'No se permite reasignar la identidad de un expediente';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_identidad_expediente BEFORE UPDATE ON new_horizons.expediente
FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_identidad_expediente();

CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.expediente FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.expediente FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.formulario_area FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.formulario_area FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.datos_generales_atencion FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.datos_generales_atencion FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.familiar_declarado FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.familiar_declarado FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.psicologia_examen_mental FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.psicologia_examen_mental FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.psicologia_mujer FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.psicologia_mujer FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.psicologia_ninez FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.psicologia_ninez FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.ficha_social FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.ficha_social FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.consulta_medica FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.consulta_medica FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.ficha_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.ficha_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.referencia_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.referencia_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.ficha_guarderia FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.ficha_guarderia FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.entrada_evolutiva FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.entrada_evolutiva FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.documento_area FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.documento_area FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.estancia_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.estancia_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE ON new_horizons.movimiento_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.auditar();
CREATE TRIGGER sin_borrado BEFORE DELETE ON new_horizons.movimiento_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();
CREATE TRIGGER versionar BEFORE UPDATE ON new_horizons.expediente FOR EACH ROW EXECUTE FUNCTION new_horizons.preparar_version();
CREATE TRIGGER versionar BEFORE UPDATE ON new_horizons.formulario_area FOR EACH ROW EXECUTE FUNCTION new_horizons.preparar_version();
CREATE TRIGGER versionar BEFORE UPDATE ON new_horizons.entrada_evolutiva FOR EACH ROW EXECUTE FUNCTION new_horizons.preparar_version();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.datos_generales_atencion FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.familiar_declarado FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.psicologia_examen_mental FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.psicologia_mujer FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.psicologia_ninez FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.ficha_social FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.consulta_medica FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.ficha_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.referencia_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.ficha_guarderia FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.entrada_evolutiva FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE TRIGGER version_cabecera AFTER INSERT OR UPDATE ON new_horizons.documento_area FOR EACH ROW EXECUTE FUNCTION new_horizons.tocar_cabecera();
CREATE FUNCTION new_horizons.validar_formulario() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fid bigint; f new_horizons.formulario_area; correcto boolean;
BEGIN
 IF TG_TABLE_NAME='formulario_area' THEN fid:=NEW.id; ELSE fid:=NEW.formulario_id; END IF;
 SELECT * INTO f FROM new_horizons.formulario_area WHERE id=fid;
 CASE f.tipo

 WHEN 'PSICOLOGIA_MUJER' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.psicologia_mujer WHERE formulario_id=fid) INTO correcto;
 WHEN 'PSICOLOGIA_NINEZ' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.psicologia_ninez WHERE formulario_id=fid) INTO correcto;
 WHEN 'SOCIAL' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.ficha_social WHERE formulario_id=fid) INTO correcto;
 WHEN 'MEDICINA_NINEZ' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.consulta_medica WHERE formulario_id=fid) INTO correcto;
 WHEN 'MEDICINA_ADOLESCENTE' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.consulta_medica WHERE formulario_id=fid) INTO correcto;
 WHEN 'MEDICINA_MUJER' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.consulta_medica WHERE formulario_id=fid) INTO correcto;
 WHEN 'LEGAL' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.ficha_legal WHERE formulario_id=fid) INTO correcto;
 WHEN 'REFERENCIA_LEGAL' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.referencia_legal WHERE formulario_id=fid) INTO correcto;
 WHEN 'GUARDERIA' THEN SELECT EXISTS(SELECT 1 FROM new_horizons.ficha_guarderia WHERE formulario_id=fid) INTO correcto;
 ELSE correcto:=false; END CASE;
 IF NOT correcto THEN RAISE EXCEPTION 'Falta detalle para formulario %',fid; END IF;
 RETURN NULL; END $$;
CREATE CONSTRAINT TRIGGER detalle_obligatorio AFTER INSERT OR UPDATE ON new_horizons.formulario_area DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION new_horizons.validar_formulario();
CREATE FUNCTION new_horizons.validar_examen() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM new_horizons.formulario_area WHERE id=NEW.formulario_id AND tipo IN ('PSICOLOGIA_MUJER','PSICOLOGIA_NINEZ')) THEN
 RAISE EXCEPTION 'Examen mental solo para Psicologia'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER examen_tipo BEFORE INSERT OR UPDATE ON new_horizons.psicologia_examen_mental FOR EACH ROW EXECUTE FUNCTION new_horizons.validar_examen();
CREATE FUNCTION new_horizons.validar_estancia_nino() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM new_horizons.activos_albergue a JOIN new_horizons.expediente ex ON ex.beneficiaria_id=a.beneficiaria_id JOIN new_horizons.nino n ON n.expediente_id=ex.id_expediente
 WHERE a.activo_albergue_id=NEW.activo_albergue_id AND n.nino_id=NEW.nino_id
 AND (NEW.fecha_ingreso AT TIME ZONE 'America/Guatemala')::date>=a.fecha_ingreso AND (a.fecha_egreso IS NULL OR (NEW.fecha_egreso IS NOT NULL AND (NEW.fecha_egreso AT TIME ZONE 'America/Guatemala')::date<=a.fecha_egreso)))
 THEN RAISE EXCEPTION 'Estancia infantil incompatible con expediente o estancia principal'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER estancia_infantil BEFORE INSERT OR UPDATE ON new_horizons.estancia_nino FOR EACH ROW EXECUTE FUNCTION new_horizons.validar_estancia_nino();

CREATE VIEW new_horizons.v_hoja_evolutiva AS
SELECT e.*, f.expediente_id, ex.beneficiaria_id, f.nino_id, f.area_id
FROM new_horizons.entrada_evolutiva e JOIN new_horizons.formulario_area f ON f.id=e.formulario_id
JOIN new_horizons.expediente ex ON ex.id_expediente=f.expediente_id;
CREATE VIEW new_horizons.v_identidad_formulario AS
SELECT f.id AS formulario_id,f.expediente_id,ex.beneficiaria_id,f.nino_id,
 CASE WHEN f.nino_id IS NULL THEN b.nombre ELSE n.nombre END AS nombre,
 CASE WHEN f.nino_id IS NULL THEN b.cui ELSE n.cui END AS cui,
 CASE WHEN f.nino_id IS NULL THEN b.fecha_nac ELSE n.fecha_nac END AS fecha_nac,
 CASE WHEN (CASE WHEN f.nino_id IS NULL THEN b.fecha_nac ELSE n.fecha_nac END) IS NULL THEN NULL
 ELSE extract(year from age((f.fecha_atencion AT TIME ZONE 'America/Guatemala')::date,
 CASE WHEN f.nino_id IS NULL THEN b.fecha_nac ELSE n.fecha_nac END))::integer END AS edad_a_la_atencion
FROM new_horizons.formulario_area f
JOIN new_horizons.expediente ex ON ex.id_expediente=f.expediente_id
JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=ex.beneficiaria_id
LEFT JOIN new_horizons.nino n ON n.nino_id=f.nino_id;
CREATE INDEX ix_formulario_expediente ON new_horizons.formulario_area(expediente_id,area_id,fecha_atencion);
CREATE INDEX ix_ficha_expediente ON new_horizons.ficha_inicial(expediente_id);
CREATE INDEX ix_nino_expediente ON new_horizons.nino(expediente_id);
CREATE INDEX ix_formulario_nino ON new_horizons.formulario_area(nino_id,area_id,fecha_atencion) WHERE nino_id IS NOT NULL;
CREATE INDEX ix_evolucion_fecha ON new_horizons.entrada_evolutiva(formulario_id,fecha_atencion);
CREATE INDEX ix_revision_recurso ON new_horizons.revision_registro(tabla,registro_id,registrado_en);
CREATE TRIGGER revision_inmutable BEFORE UPDATE OR DELETE ON new_horizons.revision_registro FOR EACH ROW EXECUTE FUNCTION new_horizons.impedir_borrado();

-- El vinculo de un registro con su formulario no se reasigna por edicion.
CREATE FUNCTION new_horizons.proteger_origen() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.formulario_id IS DISTINCT FROM OLD.formulario_id THEN
 RAISE EXCEPTION 'No se permite trasladar registros entre formularios'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.datos_generales_atencion FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.familiar_declarado FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.psicologia_examen_mental FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.psicologia_mujer FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.psicologia_ninez FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.ficha_social FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.consulta_medica FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.ficha_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.referencia_legal FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.ficha_guarderia FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.entrada_evolutiva FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();
CREATE TRIGGER origen_inmutable BEFORE UPDATE ON new_horizons.documento_area FOR EACH ROW EXECUTE FUNCTION new_horizons.proteger_origen();

CREATE FUNCTION new_horizons.validar_firma() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.firma_documento_id IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM new_horizons.documento_area WHERE id=NEW.firma_documento_id AND formulario_id=NEW.id)
 THEN RAISE EXCEPTION 'La firma debe pertenecer al mismo formulario'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER firma_del_formulario AFTER INSERT OR UPDATE ON new_horizons.formulario_area
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION new_horizons.validar_firma();
CREATE FUNCTION new_horizons.validar_familiar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b bigint;
BEGIN
 SELECT ex.beneficiaria_id INTO b FROM new_horizons.formulario_area f JOIN new_horizons.expediente ex ON ex.id_expediente=f.expediente_id WHERE f.id=NEW.formulario_id;
 IF NEW.beneficiaria_vinculada_id IS NOT NULL AND NEW.beneficiaria_vinculada_id<>b THEN
 RAISE EXCEPTION 'Beneficiaria familiar ajena al expediente'; END IF;
 IF NEW.nino_vinculado_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM new_horizons.nino n JOIN new_horizons.expediente ex ON ex.id_expediente=n.expediente_id WHERE n.nino_id=NEW.nino_vinculado_id AND ex.beneficiaria_id=b) THEN
 RAISE EXCEPTION 'Hijo familiar ajeno al expediente'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER familiar_expediente BEFORE INSERT OR UPDATE ON new_horizons.familiar_declarado FOR EACH ROW EXECUTE FUNCTION new_horizons.validar_familiar();
-- La coherencia fecha_egreso >= fecha_ingreso ya existe en el DDL original.
CREATE UNIQUE INDEX uq_estancia_beneficiaria_activa ON new_horizons.activos_albergue(beneficiaria_id) WHERE fecha_egreso IS NULL;

COMMIT;




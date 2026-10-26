# Correspondencia de formularios y persistencia

La fuente es Formularios.docx. Los encabezados, instrucciones de pantalla y firmas no se convierten automáticamente en columnas. Las siguientes correspondencias preservan sus bloques, campos repetibles y diferencias entre variantes.

## Campos generales repetidos

| Campo en formulario | Fuente o destino | Regla |
|---|---|---|
| Nombre, actora, nombre de la referida | beneficiaria.nombre o nino.nombre | Elegir sujeto por ID, no crear identidad desde cada formulario. |
| DPI/CUI | beneficiaria.cui o nino.cui | Texto; conservar ceros; nunca clave primaria. |
| Fecha de nacimiento | beneficiaria.fecha_nac o nino.fecha_nac | Fecha civil. |
| Edad | Vista v_identidad_formulario | Calculada a fecha_atencion, también para impresiones históricas. |
| Lugar de nacimiento | Geografía de origen de beneficiaria y datos_generales_atencion.nacimiento_lugar_descripcion | Para niño el diagrama no tiene geografía propia: conservar descripción sin inventar claves. |
| Sexo | nino.genero y datos_generales_atencion.sexo_registrado | Confirmar equivalencia institucional; no asumir identidad entre conceptos. |
| Estado civil | beneficiaria.estado_civil_id; contexto en datos_generales_atencion.estado_civil_id | Reutilizar catálogo. |
| Ocupación | beneficiaria.ocupacion_id; contexto en datos_generales_atencion.ocupacion_id | Reutilizar catálogo. |
| Religión | datos_generales_atencion.religion | Campo nuevo; catálogo futuro si se aprueba. |
| Dirección actual | beneficiaria.residencia_id → residencia | Niño puede usar residencia familiar sin atribuirle un domicilio propio no verificado. |
| Teléfono | residencia.num_celular; datos_generales_atencion.telefono_contacto | Diferenciar contacto familiar y contacto observado. |
| Escolaridad | beneficiaria.nivel_estudio_id o datos_generales_atencion.escolaridad_id | Niño usa contexto propio; no copiar escolaridad de madre. |
| Fecha del formulario | formulario_area.fecha_atencion | fecha de atención distinta de captura automática. |
| Número de proceso de madre | Consulta de ficha_inicial por beneficiaria | No se persiste en formulario_area. Si existen varias fichas, la Asociación debe definir cuál se muestra. |
| Firma | formulario_area.profesional_id y firma_documento_id → documento_area | Autoría profesional y evidencia de firma separadas. |

## Psicología mujer

| Bloque de origen | Persistencia |
|---|---|
| Datos generales y número/orden de hermanos | Identidad compartida y psicologia_mujer.numero_hermanos/orden_entre_hermanos. |
| Cónyuge: nombre, edad, religión, ocupación | familiar_declarado con vínculo CONYUGE; enlazar identidad solo si está verificada. |
| Número de hijos, vivos, muertos | hijos_vivos_reportados + hijos_fallecidos_reportados; total derivado cuando ambos son conocidos. |
| Nombres y edades de hijos | nino y edad calculada; hijos mencionados sin alta institucional en familiar_declarado, evitando duplicados. |
| Quién refirió y fecha | referida_por, fecha_referencia. No se confunde con los catálogos de canal de referencia inicial. |
| Motivo, historia actual, antecedentes patológicos/no patológicos e historia familiar | Columnas explícitas de psicologia_mujer. |
| Examen mental | psicologia_examen_mental. |
| Pruebas, criterios diagnósticos, ejes I–V, plan y observaciones | Columnas explícitas de psicologia_mujer. |
| Notas evolutivas | entrada_evolutiva, una fila por atención; no un texto que se reemplaza. |

## Psicología niña o niño

| Bloque de origen | Persistencia |
|---|---|
| Datos del niño | nino + datos_generales_atencion; ficha y beneficiaria como contexto familiar. |
| Madre: nombre, edad y ocupación | beneficiaria vinculada; valores históricos en fotografía/familiar_declarado si corresponde. |
| Padre: nombre, edad y ocupación | familiar_declarado PADRE; no reutilizar agresor automáticamente. |
| Hermanos y lugar que ocupa | numero_hermanos, orden_entre_hermanos. |
| Otras personas en casa, quiénes | otras_personas_casa y filas familiar_declarado CONVIVIENTE. |
| Referencia, motivo, historia, antecedentes personales, patológicos y no patológicos | Columnas explícitas de psicologia_ninez. |
| Embarazo y parto: deseado, enfermedades, tipo, tiempo y condiciones | hijo_deseado, enfermedades_madre_embarazo, tipo_embarazo, gestacion_semanas, condiciones_parto. Las condiciones se conservan narrativas para no perder opciones. |
| Sostener cabeza, gatear, sentarse, pararse y primeros pasos | Cinco columnas de edad en meses; valores desconocidos son NULL. |
| Movimientos generales y colaboración doméstica | movimientos_generales y colabora_actividades_domesticas. |
| Enuresis, encopresis y desde cuándo | Booleanos y textos desde_cuando correspondientes. |
| Problemas al hablar, cuáles, órdenes sencillas | problemas_habla, problemas_habla_detalle, obedece_ordenes_sencillas. |
| Resistencia al dormir, horas, con quién, misma cama, oscuridad y por qué, temor de ir a un lugar | Columnas de sueño y miedo; miedo_lugar_detalle conserva el lugar y explicación. |
| Actitudes de madre/padre, relación entre padres y abrazos | actitud_madre, actitud_padre, relacion_entre_padres, gusta_abrazo_padres. |
| Reacción al negarle algo, berrinches y respuesta parental | reaccion_negacion, frecuencia_berrinches, respuesta_padres_berrinches. |
| Juguetes, juegos, obediencia, castigos, reacción y acontecimientos | Columnas explícitas del bloque de personalidad. |
| Historia familiar, examen mental, pruebas, criterios, ejes, plan, notas, observaciones y firma | Mismo patrón de mujer, conservando datos clínicos en la variante infantil. |

## Examen mental compartido de Psicología

| Campo fuente | Columna de psicologia_examen_mental |
|---|---|
| Apariencia | apariencia |
| Actitud | actitud |
| Lenguaje | lenguaje |
| Percepción | percepcion |
| Humor | humor |
| Inteligencia | inteligencia |
| Orientación espacial | orientacion_espacial |
| Orientación temporal | orientacion_temporal |
| Contenido del pensamiento | contenido_pensamiento |
| Curso del pensamiento | curso_pensamiento |
| Control de impulsos | control_impulsos |
| Insight | insight |

## Trabajo Social

| Campo fuente | Persistencia |
|---|---|
| Nombre, DPI, fecha | Identidad del expediente y fecha_atencion. |
| Historia de vida de la problemática de violencia | ficha_social.historia_violencia. No reemplaza entrevista inicial. |
| Diagnóstico social | diagnostico_social. |
| Riesgos identificados | riesgos_identificados; valoración social propia, no sobrescribe ficha_inicial.analisis_riesgo. |
| Plan de eliminación de riesgos | plan_eliminacion_riesgos. |
| Objetivo general, actividades, evaluación | objetivo_general, actividades, evaluacion. |
| Ficha de seguimiento social: nombre, DPI, fecha, seguimiento | entrada_evolutiva vinculada a la ficha social; identidad derivada y fecha_atencion/contenido. No otra copia narrativa. |
| Firma | Profesional y documento de firma de la ficha; firma de seguimiento podrá vincularse mediante documento categorizado del formulario. |

## Medicina y sus tres variantes

| Campo fuente | Persistencia en consulta_medica o cabecera |
|---|---|
| Fecha, nombre, nacimiento, edad | Cabecera e identidad compartida. El formulario mujer también usa nacimiento maestro para edad. |
| Nombre del responsable | nombre_responsable_declarado; datos adicionales en familiar_declarado RESPONSABLE si se capturan. |
| Motivo de consulta o referencia | motivo_consulta. |
| HEA | historia_enfermedad_actual; equivalencia propuesta a confirmar. |
| Esquemas de vacunación, condiciones al nacer | esquema_vacunacion, condiciones_nacer; niñez y adolescente. |
| Antecedentes patológicos | antecedentes_patologicos; niñez y adolescente. |
| Antecedentes de importancia | antecedentes_importancia; mujer. |
| Antecedentes ginecológicos | antecedentes_ginecologicos; adolescente y mujer. |
| E/F | examen_fisico_general; confirmar abreviatura. |
| FC, FR, T° | frecuencia_cardiaca_lpm, frecuencia_respiratoria_rpm, temperatura_c; unidades propuestas. |
| Talla, peso, W | talla_cm y peso_kg; confirmar unidad original de W/peso antes de convertir datos. |
| P/A | presion_sistolica_mmhg y presion_diastolica_mmhg; confirmar significado y unidad. |
| Cabeza, tórax, abdomen, genitales, ginecológico, extremidades | Columnas narrativas independientes; ginecologico para mujer. |
| IC, impresión clínica | impresion_clinica; equivalencia de IC pendiente de confirmación. |
| Tratamiento | tratamiento. |
| Laboratorios/exámenes suplementarios, laboratorio a realizar | laboratorios_examenes; el texto fuente no separa solicitud de resultado. |
| Referencia | referencia; narrativa, no es una hoja de referencia legal. |
| Próxima cita | proxima_cita_indicaciones y proxima_cita si existe fecha estructurada. |
| Firma | Cabecera/documento; no se inventa firma para mujer si no figura en esa variante. |

Las columnas compartidas admiten NULL. El backend ofrece solo los campos de la variante correspondiente; todavía no hay CHECK clínico que prohíba todos los campos ajenos por variante. No se establecen umbrales clínicos ni validaciones diagnósticas.

## Legal

| Campo fuente | Persistencia |
|---|---|
| Fecha y actora | Cabecera y beneficiaria. |
| Demandado | demandado_agresor_id solo si se verifica que corresponde a un agresor; demandado_nombre_declarado conserva la declaración. |
| Diagnóstico jurídico, plan y referencia | ficha_legal.diagnostico_juridico, plan_tratamiento, referencia. |
| Inicio del proceso | inicio_proceso_descripcion; inicio_proceso_fecha opcional cuando se conoce fecha. |
| Juzgado, juicio No., juez/oficial | juzgado, numero_juicio (texto), juez_oficial. |
| Diligenciamiento | diligenciamiento del documento base; actuaciones posteriores como entradas evolutivas. No duplicar una misma actuación en ambos lugares. |
| Hoja de referencia: fecha, a, de | Nueva cabecera REFERENCIA_LEGAL, referencia_legal.destino/origen. |
| Nombre, DPI, edad de referida | Identidad derivada. |
| Motivo y recomendaciones | referencia_legal.motivo_referencia/recomendaciones. |
| Firma | Profesional y evidencia documental. |

## Guardería

| Campo fuente | Persistencia |
|---|---|
| No. de ficha | ficha_guarderia.numero_ficha; correlativo propio separado del número de proceso de madre. |
| Fecha de ingreso | fecha_ingreso, independiente del ingreso al Albergue. |
| Nombre, edad, nacimiento del niño | nino e identidad derivada. |
| Etnia | ficha_guarderia.etnia_id: propia del niño, no inferida desde madre. |
| Dirección y teléfono | Contexto de atención y residencia familiar validada. |
| Responsable que trae/lleva: nombre, DPI, parentesco, teléfono | familiar_declarado RESPONSABLE con cui, parentesco_id y telefono. Admite varias personas autorizadas; permisos de retiro requieren definición adicional. |
| Situación socioeconómica y condición de vivienda | situacion_socioeconomica, condicion_vivienda. |
| No. de proceso de madre | Consulta de `ficha_inicial` mediante el mismo `expediente_id`; no existe una relación directa desde Guardería. |
| Estado civil y ocupación de madre | beneficiaria.estado_civil_id/ocupacion_id y fotografía histórica cuando corresponda. |
| Datos madre/padre: nombre, dirección, DPI y teléfono | Madre reutiliza beneficiaria; padre/familiares en familiar_declarado con esos campos. |
| Escolaridad, escuela, teléfono | escolaridad_id, lugar_estudio, telefono_escuela. |
| Enfermedad sí/no, cuál, tratamiento, observaciones | padece_enfermedad, enfermedad_detalle, tratamiento, observaciones. No actualizan automáticamente la salud de madre. |

## Albergue

| Elemento fuente | Persistencia o cálculo |
|---|---|
| Buscar por CUI | beneficiaria.cui; el resultado devuelve el ID institucional. |
| Datos encontrados y lista de hijos | beneficiaria/nino ya existentes, no recaptura. |
| Seleccionar hijos que ingresan | estancia_nino ligada a activos_albergue. |
| Fecha/hora de ingreso y egreso | activos_albergue.fecha_ingreso/fecha_egreso; hija/hijo con fechas propias. |
| Salida: destino, responsable, fecha y hora | movimiento_albergue.destino/trabajador_asignado/salida. El responsable exacto sigue pendiente. |
| Retorno | movimiento_albergue.entrada de la salida abierta; historial conservado. |
| En sitio, con salida, concurrencia | Proyecciones sobre estancias abiertas y salida sin retorno; no otra tabla de nombres. |
| Movimientos individuales del niño | movimiento_nino; alternancia y bloqueo a implementar en servicio transaccional. |
| Agregar hijo | En ficha inicial; excepción confirmada: nacimiento durante estancia activa, con vínculos creados en una transacción. |
| Dar de alta | Egreso definitivo, conforme a decisiones posteriores que resuelven la ambigüedad del adjunto. |
| Botones, menús, ventanas emergentes y ajustes | Son interfaz, no columnas. |

## Inventario completo de columnas de detalle

Los tipos, nulabilidad y unidades siguientes son propuestas técnicas. Todos los campos narrativos permanecen como texto; no se convierte un diagnóstico en catálogo sin definición institucional. El CSV contiene las mismas 142 columnas.

### psicologia_mujer

Variantes: PSICOLOGIA_MUJER.

| Campo | Tipo SQL |
|---|---|
| `motivo_consulta` | `text` |
| `historia_problema_actual` | `text` |
| `antecedentes_patologicos` | `text` |
| `antecedentes_no_patologicos` | `text` |
| `historia_familiar` | `text` |
| `pruebas_auxiliares` | `text` |
| `criterios_diagnosticos` | `text` |
| `eje_i` | `text` |
| `eje_ii` | `text` |
| `eje_iii` | `text` |
| `eje_iv` | `text` |
| `eje_v` | `text` |
| `plan_terapeutico` | `text` |
| `observaciones` | `text` |
| `numero_hermanos` | `integer CHECK(numero_hermanos>=0)` |
| `orden_entre_hermanos` | `integer CHECK(orden_entre_hermanos>0)` |
| `hijos_vivos_reportados` | `integer CHECK(hijos_vivos_reportados>=0)` |
| `hijos_fallecidos_reportados` | `integer CHECK(hijos_fallecidos_reportados>=0)` |
| `referida_por` | `text` |
| `fecha_referencia` | `date` |

### psicologia_ninez

Variantes: PSICOLOGIA_NINEZ.

| Campo | Tipo SQL |
|---|---|
| `motivo_consulta` | `text` |
| `historia_problema_actual` | `text` |
| `antecedentes_patologicos` | `text` |
| `antecedentes_no_patologicos` | `text` |
| `historia_familiar` | `text` |
| `pruebas_auxiliares` | `text` |
| `criterios_diagnosticos` | `text` |
| `eje_i` | `text` |
| `eje_ii` | `text` |
| `eje_iii` | `text` |
| `eje_iv` | `text` |
| `eje_v` | `text` |
| `plan_terapeutico` | `text` |
| `observaciones` | `text` |
| `antecedentes_personales` | `text` |
| `enfermedades_madre_embarazo` | `text` |
| `tipo_embarazo` | `text` |
| `condiciones_parto` | `text` |
| `movimientos_generales` | `text` |
| `desde_cuando_enuresis` | `text` |
| `desde_cuando_encopresis` | `text` |
| `problemas_habla_detalle` | `text` |
| `con_quien_duerme` | `text` |
| `motivo_temor_oscuridad` | `text` |
| `miedo_lugar_detalle` | `text` |
| `actitud_madre` | `text` |
| `actitud_padre` | `text` |
| `relacion_entre_padres` | `text` |
| `reaccion_negacion` | `text` |
| `frecuencia_berrinches` | `text` |
| `respuesta_padres_berrinches` | `text` |
| `juguetes_preferidos` | `text` |
| `juegos_preferidos` | `text` |
| `estrategias_obediencia_madre` | `text` |
| `castigos_utilizados` | `text` |
| `reaccion_castigos` | `text` |
| `acontecimientos_importantes` | `text` |
| `otras_personas_casa` | `boolean` |
| `hijo_deseado` | `boolean` |
| `colabora_actividades_domesticas` | `boolean` |
| `enuresis` | `boolean` |
| `encopresis` | `boolean` |
| `problemas_habla` | `boolean` |
| `obedece_ordenes_sencillas` | `boolean` |
| `resistencia_dormir` | `boolean` |
| `misma_cama` | `boolean` |
| `temor_oscuridad` | `boolean` |
| `miedo_lugar` | `boolean` |
| `gusta_abrazo_padres` | `boolean` |
| `gestacion_semanas` | `numeric(7,2) CHECK(gestacion_semanas>=0)` |
| `sostuvo_cabeza_meses` | `numeric(7,2) CHECK(sostuvo_cabeza_meses>=0)` |
| `gateo_meses` | `numeric(7,2) CHECK(gateo_meses>=0)` |
| `se_sento_meses` | `numeric(7,2) CHECK(se_sento_meses>=0)` |
| `se_paro_meses` | `numeric(7,2) CHECK(se_paro_meses>=0)` |
| `primeros_pasos_meses` | `numeric(7,2) CHECK(primeros_pasos_meses>=0)` |
| `horas_sueno` | `numeric(4,2) CHECK(horas_sueno BETWEEN 0 AND 24)` |
| `numero_hermanos` | `integer CHECK(numero_hermanos>=0)` |
| `orden_entre_hermanos` | `integer CHECK(orden_entre_hermanos>0)` |
| `referida_por` | `text` |
| `fecha_referencia` | `date` |

### ficha_social

Variantes: SOCIAL.

| Campo | Tipo SQL |
|---|---|
| `historia_violencia` | `text` |
| `diagnostico_social` | `text` |
| `riesgos_identificados` | `text` |
| `plan_eliminacion_riesgos` | `text` |
| `objetivo_general` | `text` |
| `actividades` | `text` |
| `evaluacion` | `text` |

### consulta_medica

Variantes: MEDICINA_NINEZ, MEDICINA_ADOLESCENTE, MEDICINA_MUJER.

| Campo | Tipo SQL |
|---|---|
| `nombre_responsable_declarado` | `text` |
| `motivo_consulta` | `text` |
| `historia_enfermedad_actual` | `text` |
| `esquema_vacunacion` | `text` |
| `condiciones_nacer` | `text` |
| `antecedentes_patologicos` | `text` |
| `antecedentes_importancia` | `text` |
| `antecedentes_ginecologicos` | `text` |
| `examen_fisico_general` | `text` |
| `cabeza` | `text` |
| `torax` | `text` |
| `abdomen` | `text` |
| `genitales` | `text` |
| `ginecologico` | `text` |
| `extremidades` | `text` |
| `impresion_clinica` | `text` |
| `tratamiento` | `text` |
| `laboratorios_examenes` | `text` |
| `referencia` | `text` |
| `proxima_cita_indicaciones` | `text` |
| `frecuencia_cardiaca_lpm` | `numeric(6,2) CHECK(frecuencia_cardiaca_lpm>0)` |
| `frecuencia_respiratoria_rpm` | `numeric(6,2) CHECK(frecuencia_respiratoria_rpm>0)` |
| `temperatura_c` | `numeric(5,2)` |
| `talla_cm` | `numeric(7,2) CHECK(talla_cm>0)` |
| `peso_kg` | `numeric(7,3) CHECK(peso_kg>0)` |
| `presion_sistolica_mmhg` | `numeric(6,2) CHECK(presion_sistolica_mmhg>0)` |
| `presion_diastolica_mmhg` | `numeric(6,2) CHECK(presion_diastolica_mmhg>0)` |
| `proxima_cita` | `timestamptz` |

### ficha_legal

Variantes: LEGAL.

| Campo | Tipo SQL |
|---|---|
| `demandado_agresor_id` | `bigint REFERENCES nh.agresor` |
| `demandado_nombre_declarado` | `text` |
| `diagnostico_juridico` | `text` |
| `plan_tratamiento` | `text` |
| `referencia` | `text` |
| `inicio_proceso_descripcion` | `text` |
| `juzgado` | `text` |
| `numero_juicio` | `text` |
| `juez_oficial` | `text` |
| `diligenciamiento` | `text` |
| `inicio_proceso_fecha` | `date` |

### referencia_legal

Variantes: REFERENCIA_LEGAL.

| Campo | Tipo SQL |
|---|---|
| `destino` | `text` |
| `origen` | `text` |
| `motivo_referencia` | `text` |
| `recomendaciones` | `text` |

### ficha_guarderia

Variantes: GUARDERIA.

| Campo | Tipo SQL |
|---|---|
| `numero_ficha` | `text` |
| `fecha_ingreso` | `date` |
| `etnia_id` | `bigint REFERENCES nh.etnia` |
| `situacion_socioeconomica` | `text` |
| `condicion_vivienda` | `text` |
| `lugar_estudio` | `text` |
| `telefono_escuela` | `text` |
| `enfermedad_detalle` | `text` |
| `tratamiento` | `text` |
| `observaciones` | `text` |
| `padece_enfermedad` | `boolean` |
| `escolaridad_id` | `bigint REFERENCES nh.nivel_estudio` |




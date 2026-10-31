# Nuevos Horizontes: diferencias entre mockups y base de datos

**Para:** encargado de base de datos.  
**Fecha:** 29 de octubre de 2026.  
**Áreas revisadas:** Trabajo Social, Legal, referencias legales, Guardería, sus seguimientos y los documentos asociados.

## Qué se solicita revisar

Comprobar las diferencias siguientes en la BD que utiliza el grupo y decidir cuáles se incorporan. Se propone nombre, tabla y tipo para cada dato. **No se ejecutó ningún cambio ni se modificaron los SQL originales.**

La comparación se hizo contra los archivos SQL recibidos, no contra una lectura del servidor desplegado. Si la BD ya tiene una columna o relación equivalente, conservarla y documentar la correspondencia: no crear duplicados.

### Fuentes concretas

- `01_new_horizons_postgresql.sql` y `02_ampliacion_formularios.sql`, copias usadas por el backend de persona 3.
- Dentro de `2026-10-16.zip`: `mockup_modulo_trabajo_social.html`, `mockup_modulo_legal.html`, `mockup_referencia_legal.html`, `mockup_modulo_guarderia.html` y `mockup_documentos_area.html`.
- Las decisiones directas del usuario prevalecen sobre los ejemplos del mockup. Los nombres y datos ficticios de las vistas no son registros a cargar.

**Acuerdos que esta revisión respeta:**

- Legal lleva procesos de la beneficiaria, no de los hijos.
- El número interno de una referencia es el ID de su formulario; no se pidió otro correlativo.
- Un borrador permite textos incompletos. Para confirmar referencia son obligatorios destino y motivo; origen y recomendaciones son opcionales.
- Las referencias confirmadas pueden corregirse con motivo e historial, conservando sus datos obligatorios.
- El seguimiento se registra después de confirmar la ficha; la acción se escribe libremente.
- Una ficha GUARDERIA confirmada acredita inscripción. No hace falta una tabla nueva de matrícula para esta regla.
- Se cargan PDF ya preparados; no hay cámara ni conversión de imágenes.
- El funcionamiento de nuestras APIs no depende del código o almacenamiento de compañeros. La revisión de este esquema no implica duplicar la base ni cambiar unilateralmente sus tablas.

### Cómo leer las propuestas

- **Falta:** no se encontró un campo equivalente en los SQL revisados.
- **Parcial:** existe algo relacionado, pero no guarda toda la diferencia que muestra la vista.
- **Decidir:** depende del significado acordado o de conservar una función visual todavía no aprobada.
- Todas las tablas mencionadas pertenecen al esquema `new_horizons`.
- `text`: texto libre; `boolean`: sí/no, con null cuando se desconoce; `date`: fecha sin hora; `timestamptz`: fecha y hora; `bigint`: identificador relacionado con otra tabla.
- Las columnas nuevas de contenido se proponen inicialmente **opcionales**, para conservar borradores e información histórica. No poner `NOT NULL` general donde solo se exige un dato al confirmar.

## 1. Trabajo Social

El SQL ya tiene `ficha_social`, pero únicamente guarda historia, diagnóstico, riesgos narrados, plan de reducción de riesgos, objetivo, actividades y evaluación. La vista muestra más datos separados.

| ID | Dato visible en el mockup | Hallazgo | Campo propuesto | Tabla donde iría | Tipo | Justificación sencilla |
|---|---|---|---|---|---|---|
| S01 | Tipo de vivienda: propia, alquilada, prestada, temporal | Falta en Social. `residencia` no tiene ese dato; urbano/rural no significa propiedad de la vivienda. | `tipo_vivienda` | `ficha_social` | `text` | Saber en qué condiciones habita la familia. Las opciones definitivas se validan antes de restringirlas. |
| S02 | Composición familiar, redactada en un cuadro de texto | Parcial: hay hijos y familiares, pero no una descripción social del hogar. | `composicion_familiar` | `ficha_social` | `text` | Guardar el contexto del hogar sin crear personas duplicadas. |
| S03 | Redes familiares y comunitarias | Falta. | `redes_apoyo` | `ficha_social` | `text` | Registrar con quién puede contar la beneficiaria. |
| S04 | Dependencia económica: sí/no | Falta como respuesta separada. Un riesgo escrito no equivale a este dato. | `dependencia_economica` | `ficha_social` | `boolean`, admite null | Distinguir sí, no y desconocido. |
| S05 | Responsable del plan | Parcial: `formulario_area.profesional_id` indica quién atiende, no necesariamente quién ejecuta el plan. | `responsable_plan` | `ficha_social` | `text` | El responsable puede ser una persona o una entidad. Si se confirma que siempre es personal institucional, usar en su lugar `responsable_plan_id bigint` hacia `empleado`. No crear ambos por defecto. |
| S06 | Fecha de revisión del plan | Falta; no es la fecha de atención ni la del último guardado. | `fecha_revision` | `ficha_social` | `date` | Saber cuándo revisar los acuerdos. |
| S07 | Coordinación con otra área | Falta la relación elegida. `formulario_area.area_id` es el área dueña, no la receptora de la coordinación. | `area_coordinacion_id` | `ficha_social` | `bigint`, referencia a `area.id_area` | Identificar el área con la que se coordina. El mockup permite seleccionar una sola. |
| S08 | Resultados alcanzados | Parcial: `evaluacion` existe, pero la vista presenta evaluación y resultados en casillas distintas. | `resultados_alcanzados` | `ficha_social` | `text` | No mezclar la evaluación con los resultados. |
| S09 | Fecha de cierre | Falta; el cierre como etapa todavía debe validarse. | `fecha_cierre` | `ficha_social` | `date`, opcional | Guardar una fecha de cierre si se conserva esa casilla; no sustituirla por la última actualización. |
| S10 | Observaciones de cierre | Falta una observación propia de la ficha social. La observación de ficha inicial es de otro registro. | `observaciones` | `ficha_social` | `text` | Conservar notas adicionales de Social. |
| S11 | Riesgos marcados con casillas y contador «2 señalados» | Parcial: `riesgos_identificados text` conserva un relato, pero no identifica cada opción seleccionada. | Ver tablas propuestas T01 y T02 | `riesgo_social` y `ficha_social_riesgo` | Tablas relacionadas | Permitir seleccionar y contar riesgos sin interpretar un párrafo. |

**Aclaraciones importantes de Social:**

- **Historia de vida y situación actual:** primero acordar que corresponde a `ficha_social.historia_violencia`. El texto de la vista es más amplio que el nombre de la columna. Si se pretende guardar dos relatos distintos, entonces proponer otro campo; no duplicarlo solo por el título visual.
- **Estado «Cerrada»:** `formulario_area.estado_codigo` y el catálogo `estado_formulario` ya existen. No falta otra columna de estado. Lo pendiente es decidir si ese tercer estado del mockup se conserva, porque los acuerdos actuales solo definen borrador y confirmado. No sembrar `CERRADA` automáticamente por verlo en la vista.
- **Referencia de ingreso:** si solo indica que proviene de la ficha inicial del expediente, se consulta esa ficha, sin un texto duplicado. Si debe señalar una ficha inicial concreta cuando hay varias, revisar el vínculo opcional de la sección 7.
- **Coordinación con varias áreas:** la vista actual es de selección única. Solo si se aprueba selección múltiple, sustituir S07 por una tabla de relación `ficha_social_area_coordinacion(formulario_id bigint, area_id bigint)`, con clave conjunta. No implementar las dos opciones a la vez.
- **Catálogo de riesgos:** ya existe `situacion_riesgo` para ficha inicial. El encargado debe confirmar si tiene exactamente el mismo significado y opciones. Si sí, reutilizarlo con una relación propia de la ficha social; si no, usar T01. No compartir un catálogo por semejanza de nombre ni crear otro innecesariamente.

## 2. Ficha Legal

El SQL ya tiene `ficha_legal` para diagnóstico, plan, demandado, juzgado, número de juicio y diligenciamiento. Los siguientes datos de la vista no tienen una correspondencia completa.

| ID | Dato visible en el mockup | Hallazgo | Campo propuesto | Tabla donde iría | Tipo | Justificación sencilla |
|---|---|---|---|---|---|---|
| L01 | Relación entre las partes | Parcial: un agresor vinculado puede tener `parentesco_id`, pero un demandado escrito manualmente no lo tiene; tampoco está definido como relación histórica de esta ficha. | `relacion_partes` | `ficha_legal` | `text` | Guardar cómo se relacionan la actora y el demandado en este caso. Si la relación ya puede derivarse correctamente del agresor vinculado, reutilizarla según la regla acordada. |
| L02 | Normativa o vía aplicable | Falta. | `normativa_aplicable` | `ficha_legal` | `text` | Registrar la base o vía jurídica utilizada. |
| L03 | Objetivo del plan legal | Parcial: hay `plan_tratamiento`, pero la vista separa objetivo y acciones. | `objetivo_legal` | `ficha_legal` | `text` | Diferenciar lo que se busca de las acciones para lograrlo. |
| L04 | Tipo de juicio | Falta. `numero_juicio` es un identificador, no el tipo. | `tipo_juicio` | `ficha_legal` | `text` | Indicar de qué clase de juicio se trata. |
| L05 | Estado del proceso | Falta. El estado de un proceso judicial no es el estado borrador/confirmado del formulario. | `estado_proceso` | `ficha_legal` | `text` | Registrar la situación del proceso sin confundirla con el guardado de la ficha. |
| L06 | Próxima actuación | Falta. En el HTML es una casilla de fecha. | `proxima_actuacion_fecha` | `ficha_legal` | `date` | Guardar cuándo corresponde la siguiente actuación. Si después se requiere hora, cambiar la propuesta a `timestamptz`. |
| L07 | Actuaciones realizadas | Falta un apartado propio; `diligenciamiento` es otra casilla de la vista. | `actuaciones_realizadas` | `ficha_legal` | `text` | Conservar el relato de las actuaciones. |
| L08 | Acuerdos y próximos pasos | Falta. | `acuerdos_proximos_pasos` | `ficha_legal` | `text` | Separar los acuerdos del resultado de diligenciamiento. |
| L09 | Observaciones | Falta una columna propia de la ficha legal. | `observaciones` | `ficha_legal` | `text` | Guardar notas adicionales sin mezclar otros apartados. |

**No se propone crear tablas de procesos ni audiencias por este mockup:** muestra una ficha con campos de proceso y un texto de actuaciones. Que aparezca la palabra «Historial» no demuestra que haya una lista nueva de actuaciones con fecha/autor independientes. Si el grupo aprueba ese flujo repetible, se revisa entonces una tabla propia; no forma parte de esta propuesta mínima.

**Número de proceso:** antes de crear `numero_proceso`, aclarar el significado de la casilla. Si es el número judicial, usar `ficha_legal.numero_juicio`. Si es el número institucional, consultar el correlativo de ficha inicial que corresponda. No guardar ambos como si fueran el mismo dato.

## 3. Referencia Legal

| ID | Dato visible en el mockup | Hallazgo | Campo propuesto | Tabla donde iría | Tipo | Justificación sencilla |
|---|---|---|---|---|---|---|
| R01 | Medio de entrega: impresión física o entrega institucional | Falta. | `medio_entrega` | `referencia_legal` | `text`, opcional | Registrar cómo se entrega, si el grupo conserva esta característica. No implica implementar impresión ni nuevos permisos ahora. |

**Ya cubierto:** destino, origen, motivo y recomendaciones están en `referencia_legal`. Fecha y profesional están en `formulario_area`. Persona, CUI y nacimiento se obtienen de su identidad/expediente, y la edad se calcula para la fecha correspondiente.

**No agregar `numero_referencia`:** el usuario confirmó que se usa `formulario_area.id` como identificador de la referencia. Si más adelante se pide un número imprimible diferente, será otra decisión; no se asume ahora.

## 4. Guardería

La información de madre, padre y otros familiares puede guardarse con `familiar_declarado`, sin crear perfiles independientes para cada adulto. Lo que falta es diferenciar sus autorizaciones de traslado y algunos textos de la ficha.

| ID | Dato visible en el mockup | Hallazgo | Campo o relación propuesta | Tabla donde iría | Tipo | Justificación sencilla |
|---|---|---|---|---|---|---|
| G01 | Persona que lleva, persona que recoge y personas adicionales autorizadas | Parcial: `familiar_declarado` guarda personas, parentesco y contacto, pero no distingue quién tiene permiso para llevar o recoger. | Ver T03: `familiar_declarado_id`, `puede_llevar`, `puede_recoger` | Nueva `autorizacion_traslado_guarderia` | Tabla con identificadores y booleanos | Una misma persona puede llevar, recoger o ambas cosas; pueden existir varias autorizadas. |
| G02 | Observaciones familiares | Parcial: existe `ficha_guarderia.observaciones`, pero la vista tiene una casilla familiar y otra de observaciones generales. | `observaciones_familiares` | `ficha_guarderia` | `text` | Separar notas sobre la familia de las notas generales. |
| G03 | Indicaciones relevantes de salud | Parcial: hay enfermedad, tratamiento y observaciones, pero esta es otra casilla de la vista. | `indicaciones_salud` | `ficha_guarderia` | `text` | Conservar cuidados concretos sin mezclarlos con el tratamiento. |

**No duplicar estos datos:**

- Tipo de vivienda puede corresponder a `ficha_guarderia.condicion_vivienda`; no agregar otra columna solo por el título.
- Madre: consultar la beneficiaria vinculada al expediente; si se conserva una declaración histórica, usar `familiar_declarado` con vínculo `MADRE` y la referencia de persona cuando corresponda.
- Padre: usar `familiar_declarado` con vínculo `PADRE`; ya admite nombre, CUI, dirección y teléfono.
- Parentesco y teléfono de responsables ya están en `familiar_declarado`. No copiar esos datos a la tabla de autorizaciones propuesta.
- Estado civil y ocupación de la madre se consultan del perfil de beneficiaria; no son nuevos campos del niño. Una captura histórica debe seguir una regla explícita, no sobrescribir el perfil desde Guardería.
- Número de ficha inicial y número de proceso de la madre: el contexto entregado de Guardería identifica este último con la ficha inicial. Usar `ficha_inicial.correlativo_ficha`, no el número judicial de Legal.
- El SQL también tiene `ficha_guarderia.numero_ficha`: no copiar ahí automáticamente el correlativo de admisión si pretende representar un número propio de Guardería.
- Si hace falta vincular una ficha inicial concreta, revisar sección 7. El expediente puede tener varias fichas iniciales.
- No crear `inscrito boolean` ni una tabla de matrícula para lo acordado actualmente: se deriva de la existencia de una ficha GUARDERIA confirmada.

## 5. Documentos PDF de nuestras áreas

Se comparó el mockup documental común porque también describe los documentos asociados a nuestras fichas. Sus ejemplos de Psicología no agregan desarrollo clínico de esa área a nuestra asignación.

| ID | Dato visible en el mockup | Hallazgo | Campo propuesto | Tabla donde iría | Tipo | Justificación sencilla |
|---|---|---|---|---|---|---|
| D01 | Nombre con que aparece el documento en la lista y en sus versiones | Decidir: `categoria` puede servir si la etiqueta es solo el tipo; no existe un nombre independiente. | `nombre_documento` | `documento_area` | `text`, opcional | Permitir distinguir documentos del mismo tipo si se necesita un título propio. No es obligatorio añadirlo si la vista solo muestra la categoría. |
| D02 | Fecha del documento | Falta como fecha propia. `cargado_en` indica cuándo se subió, no cuándo se emitió. | `fecha_documento` | `documento_area` | `date` | Un documento emitido ayer puede cargarse hoy. |
| D03 | Descripción | Falta. | `descripcion` | `documento_area` | `text` | Explicar brevemente qué contiene el PDF. |
| D04 | Borrador/revisado y contador de pendientes de revisión | Falta un estado de revisión propio del documento. La anulación y la versión no lo sustituyen. | `estado_revision_codigo`, con catálogo T04 si se aprueba este flujo | `documento_area` y `estado_revision_documento` | `text` relacionado con catálogo | Distinguir un documento pendiente de revisión de uno revisado. |

**Precisiones para no añadir columnas innecesarias:**

- «Vigente» puede calcularse como la última versión válida de su cadena; no equivale al estado de revisión. No crear un booleano `vigente` sin una necesidad aprobada.
- Tamaño, tipo PDF, categoría, número de versión, fecha de carga, usuario y anulación ya se guardan.
- Espacio utilizado, cantidad de documentos activos y número de versiones se calculan desde los registros; no crear columnas para esos contadores.
- El motivo de un cambio puede registrarse en `revision_registro.motivo` al guardar la versión. No es imprescindible otra columna de motivo si ese mecanismo se utiliza correctamente.
- El nombre original del archivo no está persistido. No es una casilla independiente del mockup: añadir `nombre_original text` solo si el grupo quiere conservarlo aparte del título. No usarlo como ruta del archivo.
- El archivo se guarda fuera de la tabla y `objeto_privado` guarda su referencia. No se propone una columna `bytea` para almacenar PDFs en PostgreSQL.
- Antes de aprobar D04, confirmar que realmente se conserva la revisión documental. No crear por defecto un nuevo flujo ni copiar los estados de formulario al documento.

## 6. Tablas nuevas propuestas, con sus campos

### T01. `riesgo_social` — catálogo, solo si no se reutiliza uno equivalente aprobado

| Campo | Tipo propuesto | Relación/regla | Explicación sencilla |
|---|---|---|---|
| `id_riesgo_social` | `bigint GENERATED ALWAYS AS IDENTITY` | Clave primaria | Número interno del riesgo. |
| `codigo` | `text` | Único | Identificar la misma opción aunque cambie su etiqueta. |
| `nombre` | `text` | Texto no vacío | Nombre que ve la persona usuaria. |

Las opciones del mockup son candidatas, no un catálogo institucional ya aprobado. Si `situacion_riesgo` es equivalente, reutilizarlo y no crear T01.

### T02. `ficha_social_riesgo` — riesgos seleccionados de una ficha

| Campo | Tipo propuesto | Relación/regla | Explicación sencilla |
|---|---|---|---|
| `formulario_id` | `bigint` | Referencia a `ficha_social.formulario_id` | Indica a qué ficha social pertenece la selección. |
| `riesgo_social_id` | `bigint` | Referencia a `riesgo_social.id_riesgo_social` | Indica qué riesgo se marcó. Si se reutiliza el catálogo existente, ajustar esta referencia y su nombre. |

Clave primaria conjunta de ambos campos para no marcar dos veces la misma opción. `count(*)` permite mostrar «2 señalados». Conservar `ficha_social.riesgos_identificados` para el relato libre o los textos históricos; no tratar de convertirlos automáticamente en selecciones.

### T03. `autorizacion_traslado_guarderia` — permisos de cada responsable

| Campo | Tipo propuesto | Relación/regla | Explicación sencilla |
|---|---|---|---|
| `id` | `bigint GENERATED ALWAYS AS IDENTITY` | Clave primaria | Identifica la autorización. |
| `formulario_id` | `bigint` | Referencia a `ficha_guarderia.formulario_id` | La autorización pertenece a esa ficha del niño. |
| `familiar_declarado_id` | `bigint` | Referencia a `familiar_declarado.id` | Reutiliza el nombre, CUI, parentesco y teléfono ya guardados. |
| `puede_llevar` | `boolean` | Valor explícito | Puede llevar al niño. |
| `puede_recoger` | `boolean` | Valor explícito | Puede recoger al niño. |

Evitar duplicar la misma persona en la misma ficha; exigir al menos un permiso verdadero. Verificar que el familiar declarado pertenezca al mismo formulario. Esto puede asegurarse con una clave foránea compuesta, previa clave única equivalente en `familiar_declarado`. No basta comprobar por separado que existen la ficha y la persona.

No se proponen fechas de caducidad, revocaciones ni una agenda de traslados porque el mockup revisado no las define. Si se necesitan, deben acordarse aparte.

### T04. `estado_revision_documento` — solo si se conserva la revisión documental

| Campo | Tipo propuesto | Relación/regla | Explicación sencilla |
|---|---|---|---|
| `codigo` | `text` | Clave primaria | Código del estado documental. |
| `descripcion` | `text` | Texto no vacío | Nombre que se muestra en pantalla. |

`documento_area.estado_revision_codigo text` referenciaría este catálogo. Definir opciones y transiciones antes de cargar datos. No agregar «pendiente/revisado» como reglas institucionales confirmadas solo por los ejemplos visuales.

## 7. Relaciones y funciones que necesitan una decisión, no una columna por defecto

| Elemento del mockup | Situación actual | Propuesta si se necesita | Tipo/ubicación | Justificación sencilla |
|---|---|---|---|---|
| Identificar la ficha inicial concreta de la que viene una atención | Todas pertenecen al expediente, pero `formulario_area` no señala una ficha inicial específica. Puede haber varias. | `ficha_inicial_id` | `bigint` opcional en `formulario_area`, relacionado con `ficha_inicial.id_ficha_inicial` | Evitar elegir arbitrariamente una admisión cuando hay varias. Si basta con consultar el expediente, no hace falta. |
| Casos «asignados» que aparecen en las vistas | Hay roles/permisos y profesional del formulario, pero no una asignación explícita por usuario, área y expediente en los SQL revisados. | `asignacion_caso_area`, únicamente al definir la autorización por caso | Tabla futura con `id bigint`, `expediente_id bigint`, `area_id bigint`, `usuario_id bigint`, `asignado_en timestamptz`; referencias a las tablas correspondientes | Diferenciar tener un rol de tener ese caso asignado. No implementarla en esta revisión: seguridad definitiva está diferida. |
| Varias áreas de coordinación de Social | El mockup solo permite una. | `ficha_social_area_coordinacion` si se cambia a selección múltiple | Tabla conjunta `formulario_id bigint`, `area_id bigint`, referencias a ficha social y área | Guardar varias elecciones sin una lista de nombres concatenados. No crearla junto con S07 por defecto. |

Si se agrega `ficha_inicial_id`, exigir que esa ficha inicial sea del **mismo expediente** que el formulario. Una referencia por ID aislado no impide relacionar la admisión de otra beneficiaria. El encargado puede asegurar esto con una clave compuesta y la unicidad necesaria en la tabla referenciada.

La tabla futura de asignación no define por sí sola todos los permisos ni su vigencia/revocación. Es una propuesta de ubicación, no un modelo de seguridad terminado ni una autorización para adelantar ese ciclo.

## 8. Datos de la vista que YA existen o se calculan

Esta sección evita crear columnas duplicadas.

| Dato visible | Dónde se obtiene | ¿Agregar campo? |
|---|---|---|
| Beneficiaria, nombre y CUI | `expediente.beneficiaria_id` → `beneficiaria` | No. Enmascarar el CUI según la vista autorizada. |
| Fecha de nacimiento y edad | `beneficiaria.fecha_nac` o `nino.fecha_nac`; edad calculada para la fecha pertinente | No agregar edad almacenada ni sustituir una fecha desconocida por una edad inventada. |
| Identidad al momento de la atención | `formulario_area.identidad_al_atender` y la vista `v_identidad_formulario` existente | No crear otra identidad paralela; definir el contenido del registro histórico. |
| Fecha de atención y profesional | `formulario_area.fecha_atencion`, `profesional_id` → `empleado` | No. |
| Borrador/confirmado, versión y último guardado | `formulario_area.estado_codigo`, `version`, `actualizado_en` | No. Códigos reales de catálogo según instalación; no crear columnas por página. |
| Ocupación del perfil | `beneficiaria.ocupacion_id` → `ocupacion`; contexto declarado de atención en `datos_generales_atencion.ocupacion_id` cuando aplique | No otra columna en cada ficha por mostrar el mismo dato. |
| Diagnóstico, plan, objetivo, actividades y evaluación de Social | `ficha_social.diagnostico_social`, `plan_eliminacion_riesgos`, `objetivo_general`, `actividades`, `evaluacion` | No. |
| Actora y demandado de Legal | Actora desde beneficiaria; demandado desde `ficha_legal.demandado_agresor_id` o `demandado_nombre_declarado` | No duplicar perfiles. Ver L01 para la relación contextual. |
| Situación jurídica, acciones propuestas y referencia necesaria | `ficha_legal.diagnostico_juridico`, `plan_tratamiento`, `referencia` | No, si esos son los significados acordados. |
| Inicio de proceso, juzgado, juez/oficial y diligenciamiento | `ficha_legal.inicio_proceso_fecha`, `inicio_proceso_descripcion`, `juzgado`, `juez_oficial`, `diligenciamiento` | No. |
| Número interno de referencia, destino, origen, motivo y recomendaciones | `referencia_legal.formulario_id`, `destino`, `origen`, `motivo_referencia`, `recomendaciones` | No. |
| Hijo de Guardería y fecha de ingreso | `formulario_area.nino_id`, `nino` y `ficha_guarderia.fecha_ingreso` | No. |
| Etnia y escolaridad del niño | `ficha_guarderia.etnia_id`, `escolaridad_id` | No. |
| Dirección | Perfil/residencia que corresponda al sujeto; `datos_generales_atencion.residencia_id` para contexto de atención, `familiar_declarado.direccion` para familiares | No un texto nuevo por cada pantalla sin definir primero de quién es la dirección. |
| Centro y teléfono escolar | `ficha_guarderia.lugar_estudio`, `telefono_escuela` | No. |
| Enfermedad, tratamiento y observaciones generales | `ficha_guarderia.enfermedad_detalle`, `padece_enfermedad`, `tratamiento`, `observaciones` | No. Ver G02/G03 para las casillas adicionales separadas. |
| Madre, padre y responsables declarados | `familiar_declarado`, con sus vínculos y referencias de persona cuando correspondan | No nuevas tablas de padre/madre solo por aparecer en la ficha. |
| Acción, detalle de atención, plan y resultado del seguimiento | `entrada_evolutiva.accion`, `contenido`, `plan_seguimiento`, `resultado` | No. La acción es texto libre por decisión del usuario. |
| Fecha automática de registro y capturista | `entrada_evolutiva.registrado_en`, `capturado_por` | No una segunda fecha «de Guatemala»; se presenta el instante en esa zona horaria. |
| Área del seguimiento | `entrada_evolutiva.formulario_id` → `formulario_area.area_id` | No duplicar el área en cada entrada. |
| Creación, correcciones, autor, fecha y motivo | `revision_registro` | No nueva tabla para la lista de campos cambiados: se obtiene de anterior/nuevo. |
| PDF, categoría, tamaño, checksum, versión y anulación | `documento_area` | No nueva tabla de archivos completa por área. Ver D01–D04 para los metadatos que faltan. |
| Documentos relacionados con una ficha Legal | `documento_area.formulario_id` | No una lista de rutas dentro de `ficha_legal`. |
| Total de resultados, progreso por páginas y contadores | Consultas de la API y estado de la interfaz | No columnas para `total`, «página actual», «2 señalados» o «9 MB». |

## 9. Reglas simples para revisar las propuestas

1. Confirmar en la BD real si el dato ya existe. Si está, indicar su tabla/campo o relación en este documento.
2. Elegir una sola solución por dato: no crear simultáneamente campos alternativos ni guardar la misma información en dos lugares editables.
3. No convertir columnas narrativas en listas/catálogos sin un acuerdo. Mantener el texto histórico y no clasificarlo automáticamente.
4. No poner obligatorios todos los campos nuevos: los borradores e históricos pueden estar incompletos.
5. No poner `NOT NULL` general en `referencia_legal.destino` y `motivo_referencia` solo porque se exigen al confirmar: un borrador puede no tenerlos. La validación depende del estado y también debe mantenerse al corregir una confirmada.
6. Al agregar columnas a detalles existentes, verificar que continúen su auditoría y el incremento de versión de cabecera. Los triggers existentes capturan filas, pero las pruebas deben comprobar las columnas nuevas.
7. Las tablas nuevas necesitan auditoría, identificación correcta del registro, motivo de cambio cuando aplique y protección del historial; no heredan automáticamente los triggers de otras tablas.
8. Probar claves foráneas y que las personas/documentos/relaciones sean del mismo formulario o expediente. Para cadenas de documentos, revisar también que una versión anterior no pertenezca a otra ficha.
9. Expresar cambios aprobados en una migración nueva; no editar los SQL ya aplicados ni ejecutar esta revisión directamente como si fuera una migración.
10. Esta revisión de BD no agrega rutas a nuestra asignación ni implementa funcionalidades de otros integrantes.

## 10. Respuesta solicitada al encargado de BD

Para cada fila con ID, responder una de estas opciones:

- **Ya existe:** tabla y columna/relación exactas.
- **Se agrega:** nombre y tipo definitivos.
- **Se ajusta el mockup:** el dato no forma parte del alcance aprobado.
- **Pendiente de validar:** indicar con quién se confirma su significado.

Ejemplos:

```text
S03: se agrega ficha_social.redes_apoyo, tipo text, opcional.
L04: se agrega ficha_legal.tipo_juicio, tipo text, opcional.
G01: se reutiliza familiar_declarado y se agrega la relación de autorizaciones propuesta.
D04: pendiente; todavía no aprobamos revisión documental.
```

## Anexo: identificación de los SQL comparados

SHA-256 de las copias revisadas:

- `01_new_horizons_postgresql.sql`: `49c49b0a17ae4833c21c6dac9cd06fcaf31954f5159283d03668ccde421552aa`
- `02_ampliacion_formularios.sql`: `5392b9971e32e744a2ee40f2c4e7ce81035d7102ff48f61af258d7bedd7c7a25`

Se excluyeron los parches 03/04 del prototipo anterior: no son parte de esta comparación de la base común vigente.

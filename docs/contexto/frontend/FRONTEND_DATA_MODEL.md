# Relación del frontend con el modelo de datos unificado v2

## Alcance de este análisis

El diagrama unificado `D_diagrama_unificado.pdf` y `02_ampliacion_formularios.sql` actualizan el inventario de tablas y campos. La ampliación declara revisión estática y permanece pendiente de ejecución en PostgreSQL de ensayo. La Hoja de Requerimientos V3 define qué debe poder hacer el sistema y el proyecto define React para frontend y un monolito modular NestJS con MVC y PostgreSQL para backend. El PDF no prueba que exista una base implementada, ni permite verificar por sí solo claves, restricciones, tipos SQL o relaciones completas. Antes de fijar los contratos de API se deberá revisar el esquema SQL o las migraciones reales.

El frontend consumirá recursos de API orientados a tareas. No tendrá acceso directo a PostgreSQL ni reproducirá las tablas como formularios automáticos.

## Correspondencia por flujo

| Flujo de interfaz | Tablas y campos visibles en el diagrama | Requisitos que amplían el flujo | Brecha visible |
|---|---|---|---|
| Perfil de beneficiaria | `beneficiaria` (`id_beneficiaria`, `cui`, `nombre`, `fecha_nac`, salud, alfabetismo y claves de catálogos); `residencia`; `etnia`, `estado_civil`, `ocupacion`, `nivel_estudio`, `pais`, `departamento`, `municipio` | RF-BE1 a RF-BE9, RF-VA1 a RF-VA3 | La base usa `cui`; la interfaz lo etiqueta DPI/CUI. El identificador interno, la ausencia de CUI, el estado activo/inactivo, las coincidencias y las correcciones históricas requieren contrato explícito. |
| Ficha inicial | `ficha_inicial` (`expediente_id`, `correlativo_ficha`, `lugar`, `fecha`, `analisis_riesgo`, `plan_seguridad`, `entrevista_inicial`, `seguimiento`, `observaciones`); tablas puente de violencia, riesgo y referencias | RF-FA1 a RF-FA12 y apartado 5 | Borrador, versión de formulario y catálogos, entrevistador distinto del capturista, edad histórica y varios campos del formulario físico necesitan representación adicional. |
| Agresores y familia | `agresor`, `agresores_ficha_inicial`, `agresiones`, `agresor_agresiones`, `objeto_agresor`, `agresor_objeto`, `parentesco`, `nino` (`nino_id`, `cui`, `nombre`, `fecha_nac`, `reconocido`, `genero`, `expediente_id`) | FI-AG, FI-HI, FI-HI-VINC, RF-AL7 y RF-AL8 | Hijas e hijos se originan y vinculan en la ficha inicial. El modelo actual usa `fecha_nac` y no incorpora edad declarada; RF-AL7 debe alinearse con esta decisión. V2 añade `estancia_nino` y `movimiento_nino`; el alta excepcional todavía exige el flujo transaccional de aplicación. |
| Atención previa y derivaciones | `apoyo_recibido`, `referencia`, `referencia_interna`, `referencia_externa` y tablas puente de `ficha_inicial` | FI-AP, FI-IN, FI-EX, RF-ED9 | La referencia interna debe distinguirse de un acceso autorizado al contenido del área destino y del hecho de haber recibido atención. |
| Hojas evolutivas | `entrada_evolutiva`, `formulario_area`, `v_hoja_evolutiva`, `revision_registro` | RF-HE1 a RF-HE8 | V2 incorpora acción, contenido, fechas, profesional, capturista, versión, motivo y origen idempotente; la anulación explícita sigue pendiente. |
| Psicología | `formulario_area`, `psicologia_mujer`, `psicologia_ninez`, `psicologia_examen_mental` | `Formularios.md`; permisos por área | V2 modela ambas variantes, examen, versión y firma documental; obligatoriedad al confirmar sigue pendiente. |
| Trabajo Social | `formulario_area`, `ficha_social`, `entrada_evolutiva` | `Formularios.md`; permisos por área | V2 modela ficha y evolución; faltan reglas definitivas de completitud. |
| Medicina | `formulario_area`, `consulta_medica` | `Formularios.md`; permisos por área | V2 distingue tres tipos sobre un detalle común y define unidades; falta validación clínica aprobada. |
| Legal | `formulario_area`, `ficha_legal`, `referencia_legal` | `Formularios.md`; permisos por área | V2 cubre ficha, proceso, diligenciamiento, referencia, versión y firma documental. |
| Guardería | `formulario_area`, `ficha_guarderia`, `familiar_declarado`, `nino` | `Formularios.md`; roles de Guardería | V2 exige un hijo del mismo expediente y modela ficha; completitud y duplicados funcionales siguen en servicio. |
| Albergue | `activos_albergue`, `estado_albergue`, `movimiento_albergue`, `estancia_nino`, `movimiento_nino` | RF-AL1 a RF-AL10, RF-SA1 a RF-SA7, RN-AL1 y RN-AL2 | V2 impide estancias activas duplicadas de beneficiaria o hijo y valida el vínculo familiar; la secuencia salida/retorno infantil y el alta de nacimiento siguen requiriendo lógica transaccional. |
| Documentos y expediente | `expediente`, `formulario_area`, `documento_area`, `revision_registro` | RF-ED1 a RF-ED12 | V2 contiene expediente, metadatos, encadenamiento de versiones y anulación; faltan contrato API, estado de procesamiento y unicidad de la cadena documental. |
| Usuarios y permisos | `usuario` (`id_usuario`, `nombre_usuario`, `contrasena_hash`, `id_empleado`, `token_hash`), `empleado` (`rol_id`, `supervisor`), `rol`, `permisos`, `recursos`, `rol_permisos_por_recurso`, `area` | RF-GU1 a RF-GU12, RF-AR1 a RF-AR5, RN-AU1 a RN-AU4 | `empleado.rol_id` representa un rol único mientras la V3 permite múltiples asignaciones de rol y ámbito; no se observan sesiones revocables, permisos excepcionales ni bitácora. `token_hash` no demuestra revocación o sesión vigente. |
| Reportes | `entrada_evolutiva`, `formulario_area`, `expediente`, Albergue y vistas v2 | RF-RE1 a RF-RE10 | Ya existe una entrada de acción contable; todavía deben aprobarse unidad, filtros, estados y tratamiento de correcciones/anulaciones. |

## Relaciones que el frontend debe respetar

- Una beneficiaria conserva identidad institucional y un `expediente` único. `ficha_inicial`, `nino` y `formulario_area` se relacionan mediante `expediente_id`; fichas y estancias conservan identificadores propios.
- `beneficiaria.ocupacion_id` selecciona un registro del catálogo `ocupacion`; el frontend no debe sustituirlo por texto libre.
- La residencia utiliza `residencia.pais_residencia_id`, `departamento_residencia_id` y `municipio_residencia_id`. El origen utiliza `beneficiaria.pais_origen_id`, `departamento_origen_id` y `municipio_origen_id`. Los combos respetan `departamento.pais_id` y `municipio.departamento_id`.
- La fecha de nacimiento se conserva en `beneficiaria.fecha_nac`; no se agrega un campo independiente de edad declarada al contrato actual.
- Una ficha inicial puede relacionarse con agresores, tipos de violencia, situaciones de riesgo y referencias mediante las tablas puente del diagrama.
- Una hija o hijo se registra desde la ficha inicial y las áreas reutilizan ese vínculo. Si ingresa al Albergue, la estancia apunta al mismo registro. Un nacimiento durante una estancia activa se agrega desde Albergue y se incorpora automáticamente al expediente y a la relación de la ficha inicial.
- Cada área mantiene una hoja evolutiva o bitácora propia por beneficiaria. Psicología conserva su hoja evolutiva psicológica y Trabajo Social vincula sus seguimientos con la ficha social.
- Cada entrada de hoja evolutiva registra la acción realizada en `hoja_evolutiva.accion`; este valor se solicita al crear la entrada y se muestra en el historial.
- Una salida temporal modifica la presencia de una estancia abierta, pero conserva la reserva del espacio. El egreso definitivo cierra la estancia.
- Solo puede existir una estancia con estado `ACTIVO` por CUI. El backend aplica esta restricción y rechaza un segundo ingreso.
- `area` identifica la unidad responsable; `rol`, `permisos` y `recursos` expresan acciones. Las restricciones por caso y contenido son adicionales.

Estas relaciones expresan la intención de los requisitos. Las claves foráneas y cardinalidades finales deben confirmarse con el esquema SQL.

## Relaciones familiares confirmadas

- Hijas e hijos se crean y relacionan con la beneficiaria dentro de la ficha inicial.
- Las áreas que atienden a una hija o hijo seleccionan el registro originado en la ficha inicial.
- La prevención de duplicados busca primero por CUI y después muestra coincidencias por beneficiaria vinculada, nombre y fecha de nacimiento o edad. El sistema no fusiona registros automáticamente.
- La excepción es un nacimiento durante una estancia activa: Albergue permite agregarlo y el servidor crea el vínculo correspondiente con el expediente y la ficha inicial.
- Los datos de madre, padre, cónyuge y responsables permanecen como datos del formulario mientras no se apruebe un perfil independiente para ellos.

## Modelos de vista y contratos por acordar

| Recurso de frontend | Datos mínimos esperados de la API | Origen conceptual |
|---|---|---|
| `BeneficiarySummary` | identificador interno, nombre permitido, estado, coincidencias limitadas | `beneficiaria` y RF-BE |
| `BeneficiaryProfile` | identidad, residencia, datos generales y bloques autorizados | `beneficiaria`, `residencia` y catálogos |
| `AdmissionForm` | ficha, apartados, versión, estado de borrador, capturista y entrevistador | `ficha_inicial` y relaciones |
| `EvolutionEntry` | autor, área, atención, captura, acción, contenido vigente e historial permitido | `hoja_evolutiva` ampliada |
| `AreaFormSummary` | persona, área, tipo, fecha de atención, estado, versión y acciones permitidas | modelo de formularios de área pendiente |
| `AreaFormDetail` | cabecera autorizada, secciones, autor, capturista, firma definida e historial | formularios institucionales y modelo pendiente |
| `DocumentSummary` | documento, formulario, área, versión, anulación y acciones permitidas | `documento_area` v2; contrato lógico pendiente |
| `ShelterStay` | persona, ingreso, egreso, espacio reservado, presencia y movimientos | `activos_albergue` y `movimiento_albergue` ampliados |
| `SessionCapabilities` | cuenta, asignaciones vigentes, acciones y ámbitos efectivos | `usuario`, `empleado`, `rol` y modelo de asignaciones pendiente |
| `ReportResult` | filtros, período, unidad de conteo, total, desglose y permisos de exportación | agregaciones que deben definirse con PV9 |
| `ConsolidatedProgressReport` — pendiente | Propuesta de fecha, período, proceso, identidad autorizada, edad calculada, antecedentes, diagnóstico, conteos por acción y área, entradas evolutivas, plan, alcances, seguimiento y resultados | Posibles fuentes: `beneficiaria`, `ficha_inicial`, `hoja_evolutiva.accion`, `area` y formularios; contrato no aprobado |

Estos nombres son tipos de interfaz propuestos, no nombres de tablas ni endpoints aprobados. No se debe codificar una respuesta de API a partir de campos inferidos del PDF sin contrastarla con el backend.

`ConsolidatedProgressReport` es únicamente una propuesta pendiente. Si se aprueba, deberá ser una proyección de consulta sin copias editables; los conteos se calcularían en el backend agrupando por acción, área y período y conservarían trazabilidad al origen.

## Brechas que conviene resolver antes de integrar cada módulo

1. Identidad: identificador institucional inmutable, tratamiento de ausencia de CUI y eventual reemplazo de un código temporal.
2. Seguridad: asignaciones múltiples de rol y ámbito, permisos por caso, autorizaciones excepcionales, sesiones y auditoría.
3. Ficha: cobertura de los 19 apartados y del bloque de riesgo, campos repetibles, borradores y versiones históricas.
4. Documentos: v2 incorpora expediente, metadatos, checksum, versiones encadenadas y anulación; faltan contrato lógico, procesamiento de carga y política de almacenamiento.
5. Atención: autoría, fecha de atención y captura, correcciones, anulaciones y unidad de conteo para reportes.
6. Albergue: espacios, capacidad histórica, estancias individuales, salidas temporales, retornos, egresos y menores.
7. Formularios de área: entidades, variantes, obligatoriedad, catálogos, firma, versiones y relación entre seguimientos y hoja evolutiva.

Cada brecha se convierte en una decisión de modelo y contrato antes de conectar el frontend con datos reales. Las propuestas institucionales PV1 a PV10 deben conservar su estado pendiente hasta su aprobación.





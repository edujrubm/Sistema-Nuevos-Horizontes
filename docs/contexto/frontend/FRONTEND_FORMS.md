# Formularios y pestañas del frontend

## Propósito y reglas de interpretación

Este documento organiza el inventario institucional `Formularios.md` y lo relaciona con los requisitos, la matriz de permisos y el diagrama preliminar. La fuente define contenido funcional y bocetos; no confirma por sí sola obligatoriedad, catálogos, tipos de campo, validaciones o contratos de API.

Cada formulario pertenece a un flujo y a un área. Las pestañas dividen formularios extensos en secciones; no crean expedientes separados ni duplican la identidad de la persona.

Todo formulario de área debe conservar beneficiaria o niña/niño, área, tipo de formulario, fecha de atención, fecha y hora de captura, autor profesional, capturista cuando sea distinto, estado, versión e historial. La firma se realizará sobre la impresión física y no bloqueará modificaciones posteriores; toda modificación conserva trazabilidad.

Los bloques “Datos generales” son cabeceras de identificación. Deben reutilizar el perfil autorizado cuando el dato ya existe, sin crear copias editables independientes. Fecha de atención, responsable y motivo sí pueden pertenecer al formulario.

## Ficha inicial institucional

Es una sola ficha de admisión, presentada mediante pestañas:

La cabecera conserva **lugar de atención**, **fecha de entrevista** y **número de historia de vida o ficha**. La captura digital debe cubrir los 19 apartados institucionales y el bloque de situación de riesgo, aunque la interfaz los distribuya en más páginas para evitar desplazamientos largos. Cada página puede agrupar uno o más apartados en tarjetas de sección; esas tarjetas son solo organización visual y pertenecen al mismo borrador.

| Pestaña | Contenido | Datos preliminares | Requisitos |
|---|---|---|---|
| Identificación | Nombre, documento o ausencia, fecha de nacimiento, origen geográfico, nacionalidad y acompañante | `beneficiaria`, `ficha_inicial`, geografía | FI-EN, FI-ID, FI-ID-DOC, RF-BE2, RF-BE5, RF-BE6, RF-FA9 |
| Residencia y contacto | Direcciones, teléfonos, persona enlace y área residencial | `residencia`, geografía | FI-RE, FI-RE-AREA, RF-FA10 |
| Datos generales | Estado civil, etnia, ocupación o estudio, alfabetismo, escolaridad y salud | `beneficiaria` y catálogos | FI-DG, FI-ESC, FI-SAL |
| Agresores y familia | Agresores, hijas e hijos y violencia sexual | `agresor`, tablas puente, `nino` | FI-AG, FI-HI, FI-HI-VINC, FI-VS |
| Hechos y riesgo | Motivo, violencia, objetos, riesgo, duración, vínculo y agresión a familiares | violencia, objetos, riesgo, `agresiones` | FI-MV, FI-TV, FI-GO, FI-RI, FI-TA, FI-PA |
| Referencias y apoyo | Origen, apoyo previo y derivaciones | referencias y apoyos | FI-OR, FI-AP, FI-IN, FI-EX |
| Entrevista y cierre | Último episodio, plan, evaluación, seguimiento, observaciones y entrevistador | `ficha_inicial` | FI-HV, FI-PS, FI-EA, FI-SE, FI-OB, FI-ENT, RF-FA1, RF-FA12 |

### Inventario detallado de la ficha inicial

1. **Identificación:** nombre; DPI/CUI o inscripción; país de emisión; fecha de nacimiento; país, departamento y municipio de origen; nacionalidad; y, cuando sea menor de edad, persona acompañante, parentesco y DPI/CUI. No se captura una edad declarada separada.
2. **Residencia y contacto:** país, departamento y municipio de residencia como selecciones independientes; dirección actual; teléfono de casa y celular; dirección alternativa; persona enlace, relación y teléfonos; clasificación urbana o rural; colonia, barrio popular, asentamiento, zona, aldea, caserío, cantón u otro.
3. **Datos generales:** estado civil; etnia; ocupación seleccionada del catálogo `ocupacion`; estudio actual; lugar, dirección y teléfono de trabajo o estudio; persona de contacto y cargo; lectura y escritura.
4. **Escolaridad y salud:** nivel de escolaridad; enfermedad permanente; enfermedad indicada; tratamiento y otros padecimientos.
5. **Grupo familiar y personas agresoras:** por cada persona agresora, nombre, edad, DPI/CUI o pasaporte, ocupación, trabajo, horario, dirección, residencia, teléfonos e ingreso mensual. Hijas e hijos se registran por sexo, reconocimiento, nombre y edad, manteniendo el vínculo con la beneficiaria. En violencia sexual se registra si la persona agresora es conocida o desconocida, nombre y relación o parentesco.
6. **Motivo de la visita:** relato textual desde la perspectiva de la mujer.
7. **Violencia identificada:** física, psicológica, verbal, sexual, patrimonial, económica, trata, violación, amenaza de muerte, misoginia, femicidio u otra. Debe admitir selección múltiple.
8. **Objeto o medio de agresión:** manos, pies, arma blanca, brazos, arma de fuego, objeto, todas u otra opción. Debe admitir selección múltiple y una descripción cuando se elija “Otra”.
9. **Situación de riesgo:** convivencia actual con la persona agresora; agresiones frecuentes; hospitalización; consumo de alcohol o drogas por la persona agresora; embarazo y tiempo; separación; participación de la persona agresora en agrupaciones ilícitas; y otras situaciones.
10. **Tiempo de agresión:** varios días, meses, años u otro período declarado.
11. **Vínculo con quien agrede:** padre, esposo, conviviente, compañero, exesposo, padrastro, hijo, familia del cónyuge, hermano, exconviviente, tío, abuelo, novio, exnovio u otro. También se registra si agrede a otros integrantes de la familia, a quién y de qué forma.
12. **Origen de la referencia:** institución o medio que remitió a la beneficiaria. Debe permitir las opciones institucionales y “Otra”.
13. **Apoyo previo:** si recibió apoyo, lugar, tipo, fecha y si trae denuncia.
14. **Referencia interna:** Psicología, Legal, Albergue temporal, Trabajo Social, Medicina, grupos de autoayuda o apoyo, u otra.
15. **Referencia externa:** institución de destino, incluyendo las opciones institucionales y “Otra”.
16. **Historia del último episodio violento:** relato para análisis de riesgo.
17. **Plan de seguimiento inmediato:** plan de seguridad acordado.
18. **Evaluación del estado actual:** entrevista inicial.
19. **Seguimiento y observaciones:** anotaciones de seguimiento, observaciones y nombre de quien entrevista.

Las listas anteriores describen la cobertura funcional; los catálogos definitivos y la obligatoriedad de cada campo continúan sujetos a aprobación. Las opciones “Otra” u “Otro” habilitan texto descriptivo. Los conjuntos de violencia, medios, riesgo, referencia y derivación son multiselección. Las derivaciones internas y externas se presentan como grupos de casillas. Los relatos amplios deben usar áreas de texto y nunca almacenarse en URL, telemetría o almacenamiento web.

Los selectores geográficos respetan las entidades `pais`, `departamento` y `municipio`: primero se elige país, luego se filtran sus departamentos y finalmente los municipios del departamento. La residencia persiste sus relaciones mediante `pais_residencia_id`, `departamento_residencia_id` y `municipio_residencia_id`; el origen utiliza las relaciones geográficas correspondientes de `beneficiaria`. No se guarda una ubicación combinada como texto cuando existe el catálogo.

El Digitalizador de ficha inicial registra y confirma esta ficha conforme a sus capacidades. El cambio de pestaña conserva valores; un borrador no cuenta como atención confirmada.

Las hijas e hijos se registran y relacionan con la beneficiaria desde la ficha inicial. Los formularios de Psicología, Medicina, Trabajo Social, Guardería o Albergue que necesiten información de una hija o hijo seleccionan ese registro existente y no crean otro.

## Psicología

Hay variantes para **Mujeres** y **Niña(o)**. Ambas contienen motivo, historia del problema, antecedentes, historia familiar, examen mental, pruebas auxiliares, criterios diagnósticos, evaluación multiaxial, plan terapéutico, notas evolutivas, observaciones y firma.

### Mujeres

1. **Identificación y referencia:** cabecera general, datos familiares, referente y fecha.
2. **Motivo e historia:** motivo, problema actual, antecedentes e historia familiar.
3. **Examen y evaluación:** examen mental, pruebas, criterios y evaluación multiaxial.
4. **Plan y seguimiento:** plan terapéutico, nueva nota, historial, observaciones y firma.

Los datos de cónyuge e hijos deben distinguir texto histórico de perfiles familiares vinculados.

### Niña o niño

1. **Identificación y familia:** datos generales, madre, padre, hermanos y hogar.
2. **Referencia y antecedentes:** referencia, motivo, historia y antecedentes.
3. **Desarrollo:** embarazo y parto, psicomotricidad, esfínteres, lenguaje y sueño.
4. **Personalidad e historia familiar:** relaciones, reacciones, juegos, disciplina y acontecimientos.
5. **Examen y evaluación:** examen mental, pruebas, criterios y evaluación multiaxial.
6. **Plan y seguimiento:** plan, nueva nota, historial, observaciones y firma.

Los campos condicionales deben conservar información previa. La edad no ocultará preguntas hasta aprobar reglas institucionales.

## Trabajo Social

### Ficha social

Pestañas: **Identificación**, **Historia de violencia**, **Diagnóstico y riesgos**, **Plan de intervención** y **Cierre**. Incluye historia de vida, diagnóstico social, riesgos, plan de eliminación de riesgos, objetivo, actividades, evaluación y firma.

### Seguimiento social

Formulario breve con identificación, fecha y seguimiento. Cada seguimiento crea un registro cronológico asociado a la ficha social y a la hoja evolutiva del área; no reemplaza la ficha social ni registros anteriores.

## Medicina

Existen variantes para **Niños/as**, **Mujeres adolescentes** y **Mujeres**. El flujo clínico debe indicar la variante; el cliente no debe inferirla silenciosamente solo por edad.

| Variante | Secciones |
|---|---|
| Niños/as | Identificación y responsable; motivo y HEA; vacunación y nacimiento; antecedentes; examen y signos; anotaciones; impresión clínica, tratamiento, laboratorios, referencia, próxima cita y firma |
| Mujeres adolescentes | Contenido anterior más antecedentes ginecológicos |
| Mujeres | Identificación; motivo o referencia y HEA; antecedentes de importancia y ginecológicos; examen y signos; anotaciones, impresión clínica, tratamiento, laboratorio, cita, referencia y firma |

Las abreviaturas `HEA`, `E/F`, `P/A`, `FC`, `FR`, `T°`, `IC` y `W` requieren validación médica. También deben aprobarse unidades, formatos y reglas de los signos y medidas. El cliente no calcula diagnósticos.

## Área Legal

### Ficha legal

Pestañas: **Partes y fecha**, **Diagnóstico y plan**, **Proceso judicial** y **Diligenciamiento y cierre**. Incluye actora, demandado, diagnóstico jurídico, plan, referencia, inicio, juzgado, juicio, juez u oficial y diligenciamiento.

### Hoja de referencia

Incluye fecha, destino, origen, persona referida, DPI/CUI, edad, motivo, recomendaciones y firma. Emitir una referencia no autoriza consultar el contenido del área receptora.

## Guardería

La ficha registra a una niña o niño y su responsable:

1. **Ingreso e identificación:** número, fecha, nombre, edad, nacimiento, etnia y dirección.
2. **Responsable de traslado:** persona que lleva y recoge, DPI/CUI, parentesco y teléfono.
3. **Situación familiar:** vivienda, número de proceso de la madre, estado civil y ocupación.
4. **Madre y padre:** nombres, direcciones, DPI/CUI y teléfonos.
5. **Escolaridad y salud:** escolaridad, centro, teléfono, enfermedad, tratamiento y observaciones.

La niña o niño se selecciona de los registros vinculados en la ficha inicial. Coordinador de área con ámbito Guardería y Trabajadora de Guardería operan solo en casos asignados. El “número de proceso de la madre” corresponde al número de la ficha inicial.

## Hoja evolutiva por área

Cada área mantiene su propia hoja evolutiva o bitácora para la beneficiaria. Una hoja contiene entradas cronológicas del área; no existe una única hoja compartida que mezcle todas las áreas.

Cada nueva entrada debe indicar obligatoriamente la **acción realizada**. La interfaz presenta este dato junto con el contenido, la fecha, el área y la autoría; el contrato lo relaciona con `hoja_evolutiva.accion`. La fecha de registro se completa automáticamente con la fecha vigente en `America/Guatemala` y no se edita manualmente en el formulario. El backend registra la fecha y hora autoritativas al confirmar. Agregar un seguimiento sin acción seleccionada o descrita produce un error de validación y no se confirma.

Como propuesta pendiente de confirmación, la acción realizada puede seleccionarse de la lista observada en el consolidado: atención inicial, técnica de escucha activa, atención personalizada, atención legal, referencia interna o externa, plan de tratamiento, coordinación entre áreas, información sobre derechos, ambiente de confidencialidad, llenado de ficha y apertura de expediente. Esta lista sirve para diseñar `hoja_evolutiva.accion`, pero todavía no constituye un catálogo institucional definitivo. Cada entrada corresponde a una acción; se agrega otra entrada cuando deban registrarse acciones adicionales.

Además del detalle de la atención, una entrada puede registrar **plan o acción de seguimiento** y **alcance o resultado obtenido**. Si el informe consolidado se aprueba, estos datos podrán alimentarlo sin reemplazar el contenido histórico de la hoja.

Psicología mantiene una hoja evolutiva psicológica propia. Trabajo Social mantiene sus seguimientos evolutivos asociados directamente con la ficha social. Cuando el formulario del área produce una entrada evolutiva, ambos registros quedan vinculados y una misma confirmación no puede crear entradas duplicadas.

La corrección se presenta mediante la acción **Editar**. Aunque para el usuario sea una edición directa, el sistema debe conservar en auditoría la versión anterior, quién la modificó y cuándo, para que la corrección no elimine la trazabilidad.

El profesional autorizado consulta la hoja de su propia área. La consulta de una hoja de otra área no se concede por ser profesional. La Directora puede ver el conjunto de hojas cuando consulta o genera el expediente completo, sin editarlas. Los demás permisos de captura y consulta se determinan en la matriz vigente.

## Documentos por área

Cada área consulta únicamente sus propios documentos digitales. El personal de otra área no obtiene acceso digital al archivo; cuando corresponda compartirlo, el área propietaria lo descarga o imprime conforme a sus permisos y lo entrega por el procedimiento físico institucional. La descarga distingue documentos generales de documentos específicos del área. La coordinación del área propietaria puede anular un documento con motivo y auditoría, sin borrarlo físicamente. La Directora conserva la facultad ya definida de consultar e imprimir el expediente completo.

## Informe consolidado de acciones y avance — pendiente de confirmar

El posible informe de Administración general permanece **pendiente de confirmación institucional**. El mockup explora fecha automática, número de proceso, datos generales autorizados, antecedentes o continuo de violencia, diagnóstico, conteo de acciones realizadas, plan de seguimiento, cronología de avances, alcances, acciones posteriores y resultados. No debe implementarse todavía como una función aprobada.

Si se aprueba, la edad se calcularía desde `fecha_nac` usando la fecha del informe y los conteos se obtendrían de `hoja_evolutiva.accion`, agrupados por área y período. Quedan pendientes de confirmar el responsable, los permisos, el contenido exacto, el período, la impresión y el acceso a información sensible.

## Albergue

El módulo incluye **Inicio**, **Buscar beneficiaria**, **Concurrencia** y **Salidas**.

### Concurrencia e ingreso

La tabla muestra identificador, nombre permitido, DPI/CUI, estado y acciones. El ingreso busca una beneficiaria existente, muestra sus datos básicos, permite seleccionar hijas e hijos de la ficha inicial y registra fecha y hora.

En creación se habilitan búsqueda, selección e ingreso. Si una beneficiaria activa en el Albergue da a luz, una pestaña permite agregar a la hija o hijo; la operación lo incorpora automáticamente al expediente y a la relación familiar originada en la ficha inicial.

Antes de crear una estancia, el servidor consulta el CUI. Si existe una estancia con estado `ACTIVO`, rechaza el nuevo ingreso. El panel también debe mostrar claramente que la persona ya se encuentra activa.

### Salida temporal y retorno

La interfaz separa **En sitio** de **Con salida registrada**. Cualquier integrante del personal de Albergue autorizado puede registrar una salida temporal porque es una responsabilidad compartida. La salida captura destino y responsable; fecha y hora provienen del sistema. El retorno muestra la salida abierta y registra su propia fecha y hora. Los eventos se agregan al historial y sincronizan el estado.

**Ingreso** recibe a una persona que permanecerá por tiempo indefinido. **Salida temporal** registra una diligencia con retorno esperado el mismo día o el siguiente. **Retorno** registra el reingreso de esa salida. **Egreso** o **Dar de alta** finaliza definitivamente la estancia.

La pantalla principal y los reportes muestran cuántas personas permanecen activamente en el Albergue, distinguiendo beneficiarias de hijas, hijos o infantes. En esta etapa no se administran habitaciones, camas ni espacios individuales.

## Reglas compartidas

- Conservar una identidad y versión de borrador durante la captura.
- Presentar la ficha inicial en páginas cortas, con navegación Anterior/Siguiente y acceso directo a las secciones ya disponibles; el cambio de página no envía ni duplica la ficha.
- Usar tarjetas por apartado cuando ayuden a reconocer la sección, evitando tarjetas anidadas o una tarjeta por campo.
- Mantener valores entre pestañas y ante errores recuperables.
- Mostrar errores junto al campo y un resumen navegable.
- Distinguir dato proporcionado, desconocido y no aplicable.
- No borrar silenciosamente datos ocultos por condiciones.
- Evitar envíos dobles y sobrescrituras por conflicto.
- Mostrar solo los datos mínimos autorizados.
- Separar consulta, edición, impresión y descarga.
- No almacenar relatos ni datos sensibles en URL, almacenamiento web o logs.
- Permitir teclado, foco visible y anuncio de errores.

## Permisos aplicados

- **Directora:** consulta datos autorizados y consulta e imprime el expediente completo; no captura ni corrige.
- **Digitalizador de ficha inicial:** captura la ficha inicial y puede agregar notas evolutivas según la matriz.
- **Digitalizador de área:** captura formularios y documentos del área y caso asignados; puede agregar notas.
- **Coordinadores y profesionales:** actúan conforme a capacidades y ámbito, sin acceso automático a otras áreas.
- **Guardería:** utiliza Coordinador de área con ámbito Guardería y Trabajadora de Guardería.
- **Administración general:** administra cuentas e inactiva o restaura expedientes con motivo y auditoría. Su posible acceso al informe consolidado permanece pendiente de confirmación y no se considera un permiso vigente.
- **Administración general:** también administra el segundo factor, las categorías de ficha inicial y la consulta del historial de accesos; puede exportar reportes institucionales autorizados.
- **Coordinaciones:** pueden anular documentos de su propia área y exportar reportes únicamente dentro de su ámbito.
- **Todas las cuentas:** pueden cerrar sesión y, cuando cuenten con correo institucional, solicitar el restablecimiento de contraseña.

El frontend usa capacidades de la sesión; el nombre del rol no sustituye la autorización del backend.

La matriz de permisos es la fuente para determinar quién crea, consulta, corrige, confirma e imprime cada formulario. Si el profesional y el digitalizador coinciden sobre un mismo registro, la interfaz aplica las acciones específicas concedidas a cada cuenta; no presume que ambos pueden modificarlo. Una ficha confirmada o firmada solo muestra acciones posteriores que la matriz y el estado permitan.

## Decisiones pendientes

1. Campos obligatorios, opcionales y repetibles.
2. Catálogos frente a texto libre.
3. Formato final de la impresión destinada a firma física.
4. Abreviaturas, unidades y reglas clínicas.
5. Tratamiento de madre, padre, cónyuge y responsables cuando no son hijas o hijos registrados en la ficha inicial.
6. Catálogo o texto libre para la persona responsable de una salida temporal.
7. Si la fecha y hora del ingreso inicial pueden corregirse bajo un permiso especial.
8. Etiquetas definitivas de los paneles de salida temporal y retorno.

Estas decisiones deben resolverse antes de fijar validaciones o contratos definitivos.

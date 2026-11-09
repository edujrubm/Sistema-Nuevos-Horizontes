# Patrón de formularios de área

## Alcance

Este documento registra las decisiones aprobadas durante la implementación de Psicología para beneficiarias y las convierte en reglas reutilizables para Psicología infantil, Medicina, Trabajo Social, Legal y Guardería. Complementa `FRONTEND_FORMS.md`; no reemplaza los campos propios de cada variante.

## Rendimiento

- Cada módulo y variante se carga bajo demanda mediante una ruta diferida.
- Una variante extensa monta únicamente su página activa. Las páginas ocultas no permanecen renderizadas.
- Usar controles HTML, `Intl` y componentes existentes antes de incorporar dependencias.
- Los listados son paginados y no duplican respuestas remotas completas en estado local.
- Las confirmaciones simples se despliegan dentro del flujo. El descarte usa una fila expandible debajo del registro seleccionado en lugar de un modal con portal, superposición y listeners globales.
- Evitar animaciones, desenfoques y efectos continuos. El objetivo de referencia son equipos con 6 GB de RAM y AMD A8-7410.

## Resumen del área

Cada ficha muestra como mínimo:

- tipo y área;
- sujeto atendido cuando sea una variante infantil;
- fecha de atención;
- fecha y hora de creación en `America/Guatemala`;
- versión y estado;
- acciones permitidas por estado y capacidad.

La fecha de atención y la fecha de creación son datos distintos. La primera pertenece al acto profesional; la segunda es una marca técnica autoritativa.

Los borradores muestran `Continuar` y, cuando exista capacidad, `Descartar borrador`. Las fichas confirmadas muestran `Consultar` y permanecen en solo lectura para el flujo ordinario.

## Creación y guardado

- Una ficha nueva inicia como `BORRADOR`.
- La fecha de atención es obligatoria para crearla.
- Las variantes infantiles exigen seleccionar una hija o hijo activo ya vinculado al expediente. El área no crea otra identidad infantil.
- Guardar un borrador no pide una justificación narrativa. El cliente actual utiliza el motivo técnico `Guardado de borrador` para satisfacer la auditoría.
- Los errores conservan los valores introducidos.
- Toda escritura usa la versión vigente. Un conflicto bloquea la edición hasta recargar.

## Confirmación

- `Revisar y confirmar` aparece deshabilitado desde el inicio.
- Solo se habilita cuando los campos mínimos de la variante están completos, no existen cambios locales pendientes y la versión mostrada ya fue guardada. La fecha de referencia se exige únicamente en las variantes que la definen en su contrato; no se inventa para las demás.
- La confirmación inicial solicita revisar la consecuencia, pero no pide un motivo narrativo. El motivo técnico actual es `Confirmación inicial de ficha`.
- El backend vuelve a validar estado, versión y completitud; habilitar un botón no constituye autorización.
- Después de confirmar, la ficha se consulta en modo de solo lectura.
- Las correcciones posteriores pertenecen a otro flujo y sí exigen motivo explícito, versión e historial.

## Navegación interna

- Los formularios extensos se dividen en páginas cortas y permiten acceso directo a las páginas disponibles.
- `Anterior` no se habilita en la primera página.
- `Siguiente página` se muestra únicamente cuando existe otra página. En la última se elimina del DOM para evitar confusión.
- Cambiar de página no guarda, confirma ni crea otra ficha.
- El progreso es textual además de visual y no depende solo del color.

## Descarte lógico

- Solo se ofrece en el resumen del área para fichas persistidas en `BORRADOR`; no aparece dentro del editor clínico.
- Al seleccionarlo, la justificación se despliega inmediatamente debajo de la fila correspondiente y desplaza las fichas posteriores.
- El motivo es obligatorio, se recorta y admite entre 3 y 500 caracteres.
- La acción envía identificador, versión y motivo al endpoint de descarte.
- El backend cambia el estado a `DESCARTADO`; nunca elimina físicamente cabecera, detalle ni auditoría.
- Tras el éxito, el borrador desaparece del listado operativo. Ante error, el panel permanece abierto y conserva el motivo.
- Una ficha confirmada no puede descartarse mediante este flujo.

## Fechas y auditoría

- Las fechas civiles se intercambian como `YYYY-MM-DD`.
- Las marcas de tiempo se reciben con zona y se muestran en `America/Guatemala`.
- El cliente no inventa autor, capturista, versión ni fecha de creación.
- Los relatos y datos clínicos no se escriben en URL, almacenamiento web, logs ni telemetría.

## Estados alternos obligatorios

Cada implementación cubre carga, vacío, error recuperable, guardado, conflicto, consulta de confirmado y operación en curso. Los botones de mutación se bloquean durante su solicitud para evitar doble envío.

## Medicina para beneficiarias

- El alta ofrece explícitamente `MEDICINA_MUJER` y `MEDICINA_ADOLESCENTE`; el cliente no elige la variante a partir de la edad.
- Ambas variantes usan la misma cabecera médica y presentan únicamente sus bloques aplicables. Mujer usa antecedentes de importancia y examen ginecológico; adolescente usa responsable cuando corresponda, vacunación, condiciones al nacer y antecedentes patológicos. Ambas admiten antecedentes ginecológicos y el examen físico común.
- El flujo conserva las cinco páginas aprobadas: identificación, motivo y HEA, antecedentes, examen, y plan y cierre.
- La fecha de atención se exige al crear la cabecera. Dentro del detalle médico, el único mínimo marcado como obligatorio por el mockup para confirmar es el motivo de consulta; no se agregan reglas clínicas aún pendientes de aprobación.
- La próxima cita se captura como fecha y hora de Guatemala y se envía como instante ISO. El cliente no calcula edades, diagnósticos ni umbrales clínicos.
- El listado se consulta por el identificador del área publicado en el catálogo para incluir las fichas históricas de mujer y adolescente sin reclasificarlas.

## Medicina infantil

- La ficha usa exclusivamente `MEDICINA_NINEZ` y exige seleccionar una niña o niño activo previamente vinculado al expediente.
- El sujeto se conserva en `ninoId` y se muestra tanto en el resumen como en la cabecera del editor; la ficha médica no crea ni duplica identidades infantiles.
- La persona responsable puede seleccionarse como la beneficiaria madre, usando su nombre maestro, o registrarse como otra persona mediante `nombreResponsableDeclarado`. El frontend infiere la selección al reabrir comparando el nombre guardado, sin crear una relación nueva.
- Reutiliza las cinco páginas médicas y presenta responsable, motivo y HEA, vacunación, condiciones al nacer, antecedentes patológicos, examen físico, signos, tratamiento y seguimiento.
- No muestra antecedentes ni examen ginecológico. El motivo de consulta es el mínimo marcado por el mockup para confirmar y la fecha de atención sigue siendo obligatoria al crear el borrador.
- Mantiene guardado versionado, descarte lógico desde el resumen, consulta en solo lectura y carga diferida de la ruta.

## Verificación mínima por variante

- listado y sujeto correctos;
- creación con fecha y sujeto obligatorios;
- renderizado de cada página sin montar simultáneamente las demás;
- conservación de valores al navegar y ante error;
- guardado versionado;
- confirmación inicialmente deshabilitada y habilitada solo después de guardar los mínimos;
- ausencia de `Siguiente página` en el cierre;
- descarte desde la fila del resumen con motivo;
- consulta confirmada en solo lectura;
- conflicto de versión y reintento explícito;
- comprobación de tipos, pruebas y build de producción.

## Decisiones aprobadas

Estas reglas fueron validadas por el equipo durante el desarrollo de Persona 2 y quedaron consolidadas el 8 de noviembre de 2026. Los permisos definitivos siguen dependiendo del contrato de capacidades de la sesión y de la autorización del backend.

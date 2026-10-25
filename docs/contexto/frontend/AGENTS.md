# Instrucciones para el frontend de Nuevos Horizontes

## Propósito

Este repositorio implementa el cliente web del sistema de gestión de beneficiarias, expedientes y albergue de la Asociación Nuevos Horizontes. La aplicación trata información sensible de mujeres, adolescentes, niñas, hijos e hijas, por lo que privacidad, autorización y trazabilidad forman parte del comportamiento funcional.

## Fuentes de verdad

Antes de modificar el frontend, leer en este orden:

1. La especificación funcional y sus códigos `RF`, `RN` y `RNF`; para roles y permisos, consultar la matriz de trabajo enlazada en `README.md`, que contiene cambios posteriores a la V3.
2. El anteproyecto y el diagrama preliminar de base de datos.
3. El inventario institucional `Formularios.md`, normalizado en `FRONTEND_FORMS.md`, y luego `FRONTEND_ARCHITECTURE.md` y `FRONTEND_DATA_MODEL.md`.
4. `FRONTEND_DESIGN_SYSTEM.md`, `FRONTEND_STANDARDS.md` y `FRONTEND_DECISIONS.md`.
5. El plan de la fase activa y la implementación existente.

No convertir una propuesta `PV1` a `PV10` en comportamiento definitivo. Si una tarea depende de una decisión pendiente, identificarla y limitar la implementación a una interfaz reemplazable o detener esa parte de la fase.

## Reglas obligatorias

- Implementar únicamente requisitos identificados y aprobados.
- Mantener la interfaz en español y conservar los términos institucionales aprobados.
- Aplicar la paleta, la escala tipográfica y los tokens de `FRONTEND_DESIGN_SYSTEM.md`; no crear estilos visuales paralelos dentro de un módulo.
- Diseñar y medir para equipos institucionales con 6 GB de RAM y AMD A8-7410 APU con AMD Radeon R5 Graphics: cargar módulos bajo demanda, paginar listados y evitar efectos o renderizados innecesarios.
- No mostrar datos sensibles en listados generales, mensajes, URL, almacenamiento local, telemetría ni registros del navegador.
- Tratar la autorización mostrada por la interfaz como una ayuda de experiencia de usuario. El backend seguirá siendo responsable de autorizar cada operación.
- No inferir permisos por nombre del rol. Usar capacidades entregadas por la sesión o por un endpoint autorizado.
- No implementar el rol de Practicante. La Directora puede consultar e imprimir el expediente completo, pero no editar información ni administrar cuentas o permisos. Administración general puede inactivar y restaurar expedientes con motivo y auditoría. Guardería utiliza `Coordinador de área` con ámbito Guardería y `Trabajadora de Guardería`. Los digitalizadores solo capturan dentro de su función y ámbito; sus nuevas anotaciones no sobrescriben la hoja evolutiva anterior.
- No inventar catálogos, campos obligatorios, reglas de menores, estados ni valores institucionales.
- Para cada vista o formulario, relacionar sus datos con entidades y campos del diagrama, y marcar las brechas con la Hoja V3. El nombre de una tabla no define por sí solo un contrato de API ni confirma que la tabla esté implementada.
- Tratar la ficha inicial como un formulario por pestañas. Las pestañas agrupan apartados del formulario institucional; no crean fichas independientes ni obligan a guardar duplicados de los mismos datos.
- Cubrir en la ficha inicial los 19 apartados y el bloque de riesgo detallados en `FRONTEND_FORMS.md`. Se permiten tarjetas para agrupar apartados, sin crear una tarjeta por campo ni anidar tarjetas innecesariamente.
- Tratar Psicología, Trabajo Social, Medicina, Legal y Guardería como registros de área separados y vinculados con una misma persona. Sus bloques de datos generales son cabeceras de identificación, no copias editables del perfil.
- Modelar las notas evolutivas como entradas cronológicas agregables; nunca como un campo único que reemplaza el historial.
- Mantener una hoja evolutiva o bitácora independiente por área. Psicología usa su hoja evolutiva psicológica y Trabajo Social vincula sus seguimientos con la ficha social.
- Registrar hijas e hijos desde la ficha inicial y reutilizar ese vínculo en las áreas. Solo Albergue puede originar el alta excepcional de un nacimiento durante una estancia activa, incorporándolo también al expediente.
- Usar `cui` en contratos de datos y “DPI/CUI” como etiqueta de interfaz.
- Respetar los catálogos y relaciones del diagrama: ocupación usa `ocupacion_id`; país, departamento y municipio se muestran como combos dependientes y persisten sus claves. No agregar edad declarada mientras el modelo use `fecha_nac`.
- Exigir la acción realizada al crear cada entrada de hoja evolutiva y mapearla a `hoja_evolutiva.accion`.
- Tratar la lista de acciones del consolidado como candidata para `hoja_evolutiva.accion`, pendiente de confirmación institucional; registrar una acción por entrada.
- No implementar el informe consolidado ni conceder permisos a Administración general hasta que se confirme responsable, contenido, consulta e impresión.
- Conservar el mockup del consolidado solo como exploración. Si se aprueba, calcular los conteos desde `hoja_evolutiva.accion`, agrupados por área y período, sin captura manual.
- Limitar la consulta digital de documentos al área propietaria y a la Directora mediante el expediente completo.
- Bloquear en servidor y en interfaz un segundo ingreso de Albergue cuando el CUI ya tenga una estancia `ACTIVO`.
- No introducir datos reales de beneficiarias en pruebas, ejemplos, capturas o fixtures.
- Conservar los valores de formularios cuando una validación o solicitud falle, salvo que el usuario decida descartarlos.
- Diferenciar consulta, impresión y descarga como capacidades independientes.
- Permitir cerrar sesión a toda cuenta y ofrecer restablecimiento únicamente cuando exista correo institucional.
- Reservar para Administración general la administración del segundo factor, las categorías de ficha inicial y la consulta del historial de accesos.
- Separar `documento.descargar_general` de `documento.descargar_area`; la coordinación puede anular documentos únicamente en su ámbito y la anulación nunca borra el archivo.
- Permitir exportar reportes institucionales a Administración general y reportes del ámbito a las coordinaciones.
- Mostrar el historial de modificaciones en solo lectura para Dirección y Administración general, y para coordinaciones únicamente según su área.
- Representar ausencia, desconocido y no aplicable como estados distintos cuando el requisito lo exija.
- No calcular decisiones clínicas, jurídicas o de riesgo desde el cliente.
- No registrar contraseñas, tokens, respuestas personales, relatos, información clínica ni documentos en logs.

## Forma de trabajo

Para cada cambio:

1. Identificar los códigos de requisitos afectados.
2. Identificar en `FRONTEND_DATA_MODEL.md` las entidades actuales, las brechas y los datos que necesitará la API.
3. Describir el comportamiento observable y los casos denegados.
4. Revisar estados de carga, vacío, error, acceso denegado y conflicto.
5. Implementar el cambio más pequeño que cumpla el alcance.
6. Ejecutar pruebas, análisis estático y compilación disponibles.
7. Registrar evidencia y asuntos pendientes sin declarar como aprobado lo que no fue validado.

## Límites del frontend

El cliente no debe asumir responsabilidad por:

- autenticación definitiva o validación criptográfica;
- autorización de recursos;
- generación atómica de correlativos;
- integridad referencial;
- auditoría confiable;
- validación de contenido real de archivos;
- firma de enlaces privados;
- transacciones, bloqueo o resolución definitiva de conflictos;
- respaldos, restauración o conservación documental.

El frontend debe presentar estas capacidades y manejar sus respuestas, pero su aplicación efectiva corresponde al backend.

## Condición de terminado

Una tarea de frontend está terminada cuando el comportamiento solicitado funciona, los estados alternos están cubiertos, los permisos se reflejan correctamente, las pruebas pertinentes pasan, la aplicación compila y existe trazabilidad con los requisitos implementados.

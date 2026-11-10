# Preguntas para completar la integración

Fecha: 4 de noviembre de 2026. Las preguntas se refieren a la integración pendiente; las vistas React locales ya funcionan con la API de pruebas. Persona 3 es solo la división del trabajo, no un menú o portal independiente. Cada pregunta incluye explicación simple, ejemplo y texto para copiar al grupo.

## 1. ¿Dónde está la base React común?

En el PDF aparecen ramas frontend, pero no están publicadas en origin. Ya preparamos nuestras pantallas separadas por módulos; falta incorporar sus componentes al frontend común del grupo para conservar una sola navegación institucional y un solo cliente HTTP. El menú exclusivo de Persona 3 ya se retiró.

Ejemplo: si Persona 1 ya tiene un botón y una tabla compartidos, usamos esos componentes en lugar de mantener otros iguales.

**Para copiar:** «¿Nos pasan la rama o commit donde están la base React, el router, el cliente HTTP y los componentes compartidos? También necesitamos el contrato del motor visual de Persona 2 para conectar nuestras pantallas.»

## 2. ¿Cómo recibirá el frontend los permisos y el área actual?

La interfaz permite recibir capacidades explícitas y sin sesión queda en consulta. Solo en desarrollo puede habilitarse una simulación visible. No deducimos permisos por nombres de roles.

Ejemplo: verRevisiones=true permite mostrar historial; corregirReferencia=false oculta la corrección, aunque pueda consultarse la referencia.

**Para copiar:** «¿Qué respuesta de sesión nos dará el área actual y las capacidades de crear, editar, confirmar y consultar historial? ¿Qué nombres y ejemplo JSON usaremos? En producción no debemos activar las capacidades de prueba.»

## 3. ¿De dónde elegimos al profesional y el área de coordinación?

El backend exige identificadores reales. Los formularios locales permiten escribirlos para probar, pero un usuario debe seleccionar nombres desde un catálogo autorizado. El ID nunca es el nombre escrito a mano.

Ejemplo: seleccionar “Profesional de Legal” guarda profesionalId="12". No hace falta que el usuario conozca el 12.

**Para copiar:** «¿Qué endpoint devuelve los profesionales activos disponibles para cada área y el catálogo de áreas para coordinación? Necesitamos id y nombre para los selectores de nuestros formularios.»

## 4. ¿Aprobamos la migración documental y qué cambios ya recibió la BD del grupo?

El soporte PDF está separado de riesgos/cierre/asignaciones experimentales. No se ejecutó SQL compartido. Una BD que ya tenga el antiguo 008 no debe volver a recibir las mismas columnas.

Ejemplo: si nombre_documento ya existe, no intentamos crearlo otra vez ni suponemos que toda la migración se aplicó.

**Para copiar:** «¿Confirman cuáles migraciones están aplicadas en la BD del grupo y revisan 008_documentos_integracion.sql? Antes de aplicarlo necesitamos validar los documentos existentes y acordar el registro de migraciones.»

## 5. Persona 4: contrato único de documentos

Ya funciona una sola carga directa multipart, con PDF real y almacenamiento privado local. No hay dos fases ni un endpoint completar que finja éxito. La pantalla de documentos corresponde a Persona 4.

Ejemplo: para sustituir un PDF se envía otro a la misma ruta con documentoAnteriorId y motivoCambio; no se borra el anterior.

**Para copiar:** «¿Adaptamos todos la pantalla de documentos al contrato único de INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md? Carga directa multipart, nuevas versiones en la misma ruta, listado paginado y anulación con versión/motivo. Para producción, ¿quién configurará el almacenamiento privado definitivo?»

## 6. Riesgos estructurados y cierre Social

Sin decisión del grupo, Social conserva el texto de riesgos existente y no inventa un contador. Tampoco convierte “fecha de cierre” en un nuevo proceso institucional. El SQL experimental está fuera de las migraciones operativas.

Ejemplo: escribir resultados alcanzados no debe cerrar automáticamente un caso ni impedir correcciones que el equipo todavía no definió.

**Para copiar:** «¿Aprobamos el catálogo separado de riesgos y el flujo de cerrar/reabrir una ficha Social? ¿Qué condiciones y quién lo autoriza? Mientras tanto mantenemos los campos actuales y la consulta, sin activar el experimento.»

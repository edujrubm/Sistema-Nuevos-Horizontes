> Revisión detallada del 29 de octubre: [comparación de mockups y propuestas para BD](REVISION_BD_MOCKUPS_PERSONA3.md). Incluye Social, Legal, referencias, Guardería y documentos; distingue faltantes de datos ya existentes. Las referencias históricas a coordinación documental no bloquean nuestro funcionamiento autónomo actual.

# Correspondencia de vistas con la BD y nuestras rutas

Fuente visual: `mockup_modulo_trabajo_social.html` de 2026-10-16.zip; leído para contrastar qué datos necesita la vista. Fuente de datos: SQL 01 y 02 actuales, sin migraciones extra.

| Vista / bloque | Respuesta implementada | Límite |
|---|---|---|
| Social: identificación | Beneficiaria, expediente, nombre, nacimiento, edad calculada a fecha actual y CUI enmascarado | No se inventa el número de ficha NH-año ni una edad si no hay nacimiento. |
| Social: estado y guardado | Última ficha social, estado real, fecha de atención, profesional, versión y actualizadoEn | No se inventan estados de cierre; nombres institucionales por ratificar. |
| Social: páginas de contenido | Historia, diagnóstico, riesgos como texto, plan, objetivo, actividades y evaluación existentes | No se convierten riesgos narrativos en un catálogo ni se cuenta «2 riesgos» sin datos estructurados. |
| Social: historial reciente | Hasta 5 entradas sociales con acción, contenido, plan, resultado, profesional y fecha | Solo ficha de tipo SOCIAL; no mezcla otros diagnósticos o áreas. |
| Social: campos sin soporte | `camposSinSoporte` y `totalRiesgos:null` | Vivienda, redes, dependencia económica, responsable/fecha de revisión, fecha/resultados/observaciones de cierre no tienen correspondencia aprobada en el detalle Social recibido. No se agregan columnas ni se mezclan con otros campos. |
| Guardería: hijos | Todos los vinculados con indicador inscrito | Ficha GUARDERIA confirmada indica inscripción por decisión del usuario. |
| Guardería: apertura | Consulta de fichas solo de inscrito | Un niño no inscrito produce 404 al intentar abrir fichas. |
| Legal | Procesos, fichas y referencias de beneficiaria | No se crean procesos de hijos. |
| Evolución | Área activa, filtros por área/formulario/hijo, creación y corrección | No se permiten accesos de otra área mediante parámetros del navegador. |
| Historial | Creación/cambios por campo, autor, fecha y motivo | Coordinación de su área; permisos simulados en servidor hasta integrar autenticación. |
| PDF | Carga asociada a ficha y expediente | Consulta/descarga/versiones siguen en coordinación con P4; no se crea cámara ni conversión. |

La pantalla `public/persona3.html` es un laboratorio para probar las APIs con datos sintéticos. No se declara implementado el frontend final ni se sustituyen los mockups firmados. Los formularios genéricos de Social, Legal y Guardería no ganan rutas de creación por esta revisión: se conserva exactamente la asignación P3.

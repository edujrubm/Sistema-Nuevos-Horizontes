# Plan recomendado de implementación

## Fase 0 — decisiones y base

- Ejecutar `02_ampliacion_formularios.sql` sobre una copia de ensayo, verificar todos los disparadores y reconciliar cualquier diferencia con el diagrama unificado.
- Aprobar ORM, identificadores, estados mínimos, sesiones y almacenamiento.
- Crear el monolito NestJS con estructura MVC por módulo (`models`, `views`, `controllers`, `services`, `repositories` y `dto`), configuración validada, PostgreSQL, migraciones, errores, OpenAPI, observabilidad y CI.
- Cargar catálogos aprobados sin inventar valores.

## Fase 1 — identidad, autorización y auditoría

- Cuentas, sesiones, cierre, recuperación institucional y base reemplazable de MFA.
- Roles, capacidades, ámbitos, casos, excepciones y versión de matriz.
- Auditoría de cambios/accesos y pruebas completas de denegación.

No avanzar con datos sensibles si el backend solo oculta botones en frontend.

## Fase 2 — beneficiarias y ficha inicial

- Identidad, residencia, geografía, ocupación, coincidencias y estado.
- Borrador único de ficha, secciones, riesgos, agresores, referencias, hijos y confirmación.
- Inactivación/restauración por Administración general.

## Fase 3 — áreas y evolución

- Mapear `formulario_area` y sus tablas tipadas para Psicología, Trabajo Social, Medicina, Legal y Guardería.
- Hoja por área, acción obligatoria, revisiones y vínculo idempotente con seguimientos.
- Implementar cada formulario solo al aprobar campos y validaciones.

## Fase 4 — documentos

- Metadatos, almacenamiento privado, validación, versiones, tickets, anulación y auditoría.
- Expediente completo de Dirección en solo lectura e impresión autorizada.

## Fase 5 — Albergue

- Identidad alojable, estancias individuales, unicidad activa y panel de concurrencia.
- Salida temporal, retorno, egreso y nacimiento durante estancia.
- Pruebas de carreras y estados inválidos.

## Fase 6 — reportes y operación

- Indicadores aprobados, exportaciones por ámbito, trabajos y límites.
- Carga, índices, respaldos/restauración, alertas y procedimientos operativos.
- Mantener fuera el consolidado hasta confirmación institucional.

## Criterio de salida por fase

Requisitos trazados, migraciones revisadas, autorización negativa probada, auditoría verificada, API documentada, pruebas pasando, rendimiento medido y pendientes visibles. Ninguna fase se cierra con datos reales en fixtures o evidencias.



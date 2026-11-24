# Albergue

Panel, ingreso con acompañantes, salidas, retornos, egreso, nacimiento vinculado al expediente e historial. AlbergueService expone los casos de uso; AlbergueRepository conserva las escrituras atómicas y AlbergueConsultasRepository las proyecciones. Las entidades mapean el esquema existente, sin sincronización automática.

TypeORM resuelve operaciones simples. El SQL parametrizado restante expresa agregados, JSONB, bloqueos de relaciones, reloj y auditoría PostgreSQL. No hay SQL en controladores ni servicios. Se reutilizan entidades públicas de Beneficiarias y Niños sin modificar sus formularios.

Pruebas: test/zzzz-albergue.integration.cjs y test/albergue-arquitectura.unit.cjs. Estado técnico y límites: docs/PLANES_TECNICOS.md; evidencia: docs/VERIFICACION_CALIDAD.md. El contexto técnico no equivale a autorización productiva.

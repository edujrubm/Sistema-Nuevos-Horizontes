> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Adaptador ORM de formularios de Trabajo Social

Fecha: 13 de noviembre de 2026. Continuación local autorizada por Eduardo. Se revisaron las instrucciones del repositorio, las decisiones pendientes, la organización MVC de Medicina y los contratos neutrales del motor y del adaptador existente de Legal. No se heredó ni importó un repositorio privado de otra área.

## Resultado

SocialModule registra SOCIAL en FormularioAdapterRegistry durante su inicialización. Las rutas comunes existentes delegan al adaptador propio del área para crear, recuperar, listar por cursor, editar, confirmar y descartar. No se añadieron endpoints duplicados ni se cambiaron contratos HTTP.

SocialFormRepository implementa FormularioAdapter con entidades TypeORM canónicas, QueryBuilder para proyecciones con joins y operaciones save/update para escrituras. No contiene llamadas query(...) ni depende de código o configuración organizados por integrantes. No se cambió el motor compartido ni los módulos de los compañeros.

## Persistencia y controles

- La creación exige expediente activo y profesional existente conforme al contrato anterior. Cabecera y detalle se crean en la misma transacción que la auditoría, conservando identidad histórica de la beneficiaria.
- La actualización bloquea la cabecera antes de verificar versión y estado. Solo modifica los campos recibidos; null permite limpiar campos opcionales. Los triggers administran la versión: no se suma manualmente.
- Confirmación y descarte comprueban el catálogo de estados, estado previo y versión bajo bloqueo. El descarte es lógico y conserva el detalle.
- El DTO propio valida claves, formatos, fechas, longitud y rango bigint del detalle. El área de coordinación debe existir. Los errores señalan detalle.campo en español, sin incluir sus valores.
- La confirmación comprueba formatos existentes; no define nuevos campos obligatorios ni implementa decisiones pendientes de D-04. Las correcciones posteriores a confirmación no se implementaron como ediciones ordinarias.
- El listado común por cursor excluye descartadas, igual que el motor anterior. El listado propio histórico mantiene todos los estados. No se cambió esa diferencia de contratos.

El callback de auditoría es el provisto por el motor común y fija actor/motivo en la conexión de la transacción. Sus consultas PostgreSQL de infraestructura permanecen en el motor, no se copiaron al adaptador. Esto no acredita identidad o autorización productivas, todavía pendientes del responsable.

## Archivos de esta entrega

| Archivo | Cambio |
| --- | --- |
| src/modules/formularios/social/repositories/social-form.repository.ts | Nuevo adaptador ORM de lecturas y escrituras |
| src/modules/formularios/social/validation/validar-detalle-social.ts | Reutiliza el DTO y traduce sus errores al contrato común |
| src/modules/formularios/social/social.module.ts | Registra el adaptador y sus entidades mediante el punto de extensión neutral |
| src/modules/formularios/social/index.ts | Exporta módulo y servicio; no expone repositorios privados |
| src/modules/formularios/social/README.md | Describe rutas, persistencia, controles y límites actuales |
| test/social-listado.integration.cjs | Añade diez casos de escrituras, registro del adaptador, cursor, conflictos, auditoría y rollback |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Actualiza avance y próxima etapa |
| docs/contexto/backend/CONTENIDO_INSTITUCIONAL_SOCIAL.md | Actualiza el estado del adaptador sin dar por terminados PDF o seguimiento |
| docs/contexto/backend/RECONSTRUCCION_ADAPTADOR_SOCIAL.md | Este informe |

## Pruebas

27 pruebas PostgreSQL/HTTP aprobadas sobre un clúster desechable propio. Las diez nuevas comprueban:

1. Registro real del adaptador en el motor común.
2. Creación, lectura, modificación de profesional y limpieza de un campo con null.
3. Historial de creación/corrección con actor, motivo y valores anteriores/nuevos.
4. Dos PATCH concurrentes con la misma versión: uno responde 200 y el otro 409.
5. Confirmación y rechazo de edición ordinaria/segunda confirmación.
6. Descarte sin borrar detalle y exclusión del listado común.
7. Cursor ascendente, indicador de página adicional y filtro por área.
8. Rechazo de ninoId y profesional inexistente.
9. Rechazo por campo de coordinación inexistente o identificador fuera del rango bigint.
10. Fallo de detalle inyectado después de insertar cabecera en PostgreSQL: rollback de cabecera y de auditoría.

pnpm run check aprobado: 47 pruebas backend, 147 frontend, tipos y compilaciones API/web. La nueva exportación pública también se verifica con compilación antes del cierre. Evidencias locales ignoradas: test-results/social-listado.integration.tap y test-results/social-adaptador-check.log.

Regresión adicional con AppModule y las áreas existentes: 56 pruebas de integración aprobadas, cero fallos, mediante scripts/test-areas.ps1 en puerto de ensayo 55487. Evidencia: test-results/social-regresion-areas.log. Esta suite conserva su configuración heredada para comprobar compatibilidad de los módulos aún no reconstruidos; no se copió esa configuración a Social.

No se modificaron migraciones, esquemas ni datos del ambiente compartido. No se hizo commit, push ni PR. Los fixtures se aplicaron únicamente a clústeres desechables creados por los runners; no a la base de las pantallas abiertas.

## Límites y siguiente etapa

La delegación por tipo SOCIAL está reconstruida. Un listado compartido sin filtro de tipo puede continuar por el acceso genérico existente: no se acredita que toda consulta de todo el sistema use este adaptador.

Sigue la separación de las páginas React del área, conservando las cinco secciones y el diseño. Carga/asociación del PDF firmado, autorización productiva y captura/corrección de la hoja evolutiva propia siguen pendientes. La firma es física y su documento debe ser PDF; no se introdujo captura de firma digital.

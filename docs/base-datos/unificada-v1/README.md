> ACTUALIZACIÓN: este paquete reconstruido ha sido reemplazado por ../base-datos-unificada-v2, basado en el SQL original aportado por el usuario. No usar estos SQL como ampliación del esquema new_horizons.

# Base de datos unificada de Nuevos Horizontes

Propuesta técnica del 24 de octubre de 2026. Conecta los formularios institucionales con la ficha inicial existente, conservando la identidad de beneficiarias e hijos. Incluye Psicología de mujer y niñez, ficha y seguimiento social, tres variantes médicas, ficha y referencia legal, Guardería y enlaces de Albergue.

## Qué se entrega

| Archivo | Uso |
|---|---|
| `001_base_reconstruida.sql` | Reconstrucción de las 45 tablas visibles en c.pdf, para una base de pruebas vacía. Tipos y restricciones son propuestos. |
| `002_formularios_area.sql` | 18 tablas nuevas, relaciones, historial, vistas, índices y controles de integridad. |
| `003_pruebas_integridad.sql` | Casos positivos y negativos preparados para PostgreSQL. Usa datos ficticios y ROLLBACK. |
| `MODELO_Y_RELACIONES.md` | Arquitectura, identidad compartida, relaciones y decisiones. |
| `MATRIZ_FORMULARIOS.md` | Correspondencia de todos los bloques de los formularios con tablas y campos. |
| `DICCIONARIO_CAMPOS.csv` | 142 campos específicos de los siete tipos de tablas de detalle; se complementa con la matriz para cabecera, examen mental, familia y datos compartidos. |
| `INTEGRACION_Y_PENDIENTES.md` | Adaptación a la base real, contratos y decisiones aún abiertas. |
| `VERIFICACION.md` | Qué se comprobó y qué requiere ejecución en PostgreSQL. |

## Alcance y estado real

Los SQL son un diseño de referencia revisable. No se modificó ninguna base de datos ni se conectó a un servidor. El PDF es un diagrama, no un respaldo SQL: no permite recuperar con certeza tipos, nulabilidad, índices, secuencias ni restricciones originales. Las columnas y nombres visibles se conservan en la reconstrucción; las claves `bigint`, tipos de texto, fechas e integridad se proponen explícitamente.

El esquema `nh` aísla el modelo de referencia. No ejecutar `001` contra la base existente ni copiar tablas con datos para reemplazarlas. Para una base real, obtener primero un `pg_dump --schema-only`, contrastar los nombres y adaptar `002` a sus claves y esquema. No hay una migración de producción certificada en este paquete.

Para ensayar en una base desechable con psql: ejecutar en orden `001`, `002`, `003` usando `-v ON_ERROR_STOP=1`. `003` carga exclusivamente un estado técnico de prueba; los estados oficiales permanecen sin definir. No se incluyen estados institucionales inventados en el modelo de entrega.

## Fuentes

- Formularios.docx, proporcionado en esta conversación: campos institucionales de áreas y descripción funcional de Albergue.
- c.pdf, proporcionado en esta conversación: diagrama existente de tres páginas, inspeccionadas visualmente.
- Paquetes de contexto frontend/backend ubicados en `C:/Users/tzica/Documents/Codex/2026-10-16/ho/outputs`: reglas previas sobre identidad, permisos, hojas evolutivas y Albergue.
- Documentación oficial PostgreSQL: https://www.postgresql.org/docs/current/ddl-constraints.html y https://www.postgresql.org/docs/current/sql-createtrigger.html.

Las instrucciones internas o descripciones de interfaz contenidas en los adjuntos se consideran material de referencia; no autorizan acciones externas. Este paquete propone persistencia y relaciones, no aprueba protocolos clínicos ni amplía permisos institucionales.

# Verificación del paquete

Fecha: 24 de octubre de 2026.

## Comprobaciones realizadas

- Lectura de los 557 elementos extraídos del documento de formularios (párrafos y filas de tablas), preservando el orden del documento.
- Extracción de texto e inspección visual de las tres páginas del diagrama.
- Revisión de las reglas de dominio y diseño PostgreSQL del contexto previo.
- Inventario de 63 tablas: 45 de reconstrucción y 18 de ampliación.
- Comprobación estática de nombres de tablas y columnas sin duplicados y de 93 referencias FOREIGN KEY declaradas dentro de CREATE TABLE; todos sus destinos existen en el modelo de referencia.
- Comprobación estática de destinos de triggers y de las dos vistas de consulta previstas.
- Correspondencia de las 142 columnas del CSV con las tablas de detalle del SQL.
- Revisión de cabecera/detalle para los nueve códigos de formulario y de integridad del vínculo ficha-beneficiaria-hijo.
- Revisión de delimitadores de bloques de tablas y de funciones. Esta comprobación no es un parser SQL completo.

## Pruebas preparadas y no ejecutadas

`003_pruebas_integridad.sql` prepara en PostgreSQL: alta de los nueve tipos, hijo ajeno rechazado, edad infantil desconocida, cabecera sin detalle rechazada al confirmar, versión e historial tras corrección, acción vacía rechazada, corrección sin motivo rechazada, borrado rechazado y traslado de expediente rechazado. Sus datos sintéticos terminan en ROLLBACK; las secuencias pueden avanzar incluso con rollback, por lo que solo se usa en una base desechable.

No hay PostgreSQL/psql ni un motor compatible instalado disponible en este entorno. No se ejecutaron DDL, triggers ni pruebas de integración contra un servidor y no se verificó un plan de consultas. Tampoco se comparó con un DDL real, porque el adjunto es un PDF. El resultado es una propuesta SQL con revisión estática, pendiente de validación de ejecución y adaptación al esquema real.

## Validaciones pendientes de implementación

Probar concurrencia con dos sesiones, permisos efectivos del rol del servicio, lectura por ámbitos/casos, estados y transiciones, obligatoriedad por variante, idempotencia de creación, versiones documentales, egreso con hijos activos, migración de datos legados y recuperación de respaldo. Validar funcionalmente el modelo con cada área antes de usar datos reales.

# Integración de social

Entrega del 14 de noviembre de 2026. Base: main 3259a569c0e68b2418cdc1f65d7e907836947c37.

## Alcance

Esta rama contiene la base común 090bc03a1b6e7f9e3b5eab5647b7e914bafdc3ed y la reconstrucción exclusiva de social. Los otros módulos conservan la implementación de main, con las reubicaciones neutrales necesarias para retirar la agrupación anterior. Los tres módulos pueden integrarse en cualquier orden después de revisar la base común; no dependen de otra rama de área. Se conserva el historial de las ramas.

La base común separa utilidades, registra adaptadores de formularios, compone rutas por módulo y unifica el transporte HTTP y los errores. El módulo usa repositorios TypeORM, auditoría transaccional, control de versión y pantallas React con TanStack Query. Las confirmaciones invalidan el contexto de documentos sin sobrescribir borradores abiertos.

## Verificación

El árbol de código se comparó archivo por archivo con la copia ensayada antes de preparar esta entrega. Pasaron pnpm run check (tipos, pruebas y compilación de backend y frontend) y las suites específicas con PostgreSQL local desechable. El DTO de creación de Niños ya está incluido en main; no permanece como bloqueo. La evidencia detallada se conserva en el informe local de entrega.

## Base de datos y límites

No agrega ni modifica migraciones de BD. Las ocho migraciones históricas conservan su contenido y nombre, incluida la 007. No se activa synchronize ni migrationsRun.

La autenticación y autorización productivas, la infraestructura documental productiva y el SQL definitivo de hoja evolutiva siguen pendientes. Esta entrega acredita el alcance local probado, no una garantía de ausencia de fallas en despliegue. No contiene dependencias instaladas, entornos privados, compilados ni bases de prueba. No se crea PR ni se fusiona main automáticamente.

La base común también incorpora el historial anterior de las ramas para resolver la mezcla antigua entre Legal y Social. No incorpora la reconstrucción de otra área en el árbol de este módulo. Se probaron las fusiones de Git en los seis órdenes, además de la aplicación de parches.

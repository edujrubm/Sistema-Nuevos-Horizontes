# Guía técnica vigente

## Arquitectura actual

El repositorio contiene dos aplicaciones coordinadas:

- `src/`: API NestJS, organizada por módulos, controladores, servicios y repositorios.
- `frontend/`: aplicación React con Vite; utiliza React Router, TanStack Query, React Hook Form y Zod.

La API se publica bajo `/api/v1`. Los controladores validan y traducen HTTP; no deben contener SQL. Los errores públicos se rigen por el [contrato de errores](CONTRATO_ERRORES_API.md).

## Persistencia

PostgreSQL es la autoridad de integridad. TypeORM se usa para configuración,
entidades, repositorios y transacciones; existen consultas SQL parametrizadas
para operaciones que dependen de JSONB, CTE, bloqueos, auditoría o proyecciones
complejas. Esto no autoriza SQL en controladores ni interpolar datos de usuario.

Las consultas crudas nuevas deben vivir en un repositorio o adaptador de
infraestructura, usar parámetros y quedar cubiertas por una prueba relevante.
Las consultas existentes directamente en servicios se deben mover de forma
gradual, sin reescribirlas en bloque ni cambiar su semántica.

## Herramientas y uso obligatorio

| Necesidad | Herramienta | Cómo usarla |
| --- | --- | --- |
| Leer un registro simple por clave, filtrar y paginar | Repositorio TypeORM (`find`, `findOne`, `findAndCount`) | Usar entidades, tipos y opciones TypeORM; nunca concatenar valores recibidos desde HTTP. |
| Crear, actualizar o eliminar lógicamente una entidad simple | Repositorio TypeORM (`create`, `save`, `update`) | Validar con DTO, aplicar autorización en el servicio y registrar auditoría en la misma transacción cuando corresponda. |
| Coordinar varias escrituras | `DataSource.transaction(...)` o `QueryRunner` de TypeORM | Ejecutar todas las escrituras y la auditoría usando el mismo `manager`; no mezclar repositorios globales dentro de esa transacción. |
| JSONB, CTE, funciones PostgreSQL, bloqueos o proyecciones complejas | SQL parametrizado mediante `manager.query(sql, parametros)` en un repositorio | Documentar por qué TypeORM no expresa la operación con claridad, usar parámetros posicionales y probar contra PostgreSQL real. No usar interpolación de datos de usuario. |
| Cambiar tablas, funciones, triggers, índices o catálogos | Archivo SQL nuevo en `database/migrations/` | Numerar el script, no editar uno aplicado, revisar el ambiente y ejecutarlo sólo con autorización. |
| Consultar o probar la API | Postman o Newman | Usar únicamente datos sintéticos y el ambiente local autorizado; no dirigir colecciones que escriben datos a Neon compartido o producción. |
| Verificar una modificación | `pnpm run check` | Ejecutarlo desde la raíz antes de abrir un pull request; si toca PostgreSQL, añadir la prueba específica contra una base preparada. |

No utilizar `synchronize`, `migrationsRun`, SQL desde un controlador ni comandos
destructivos contra un ambiente compartido para resolver una diferencia de
esquema.

## Legibilidad del código

Los umbrales de tamaño del backend están en
`docs/contexto/backend/AGENTS.md`. Son una señal para revisar y mejorar el
diseño, no reglas mecánicas que obliguen a separar una transacción, una consulta
cohesiva o un contrato legible. Antes de dividir, comprobar que el cambio mejora
la responsabilidad, los nombres, las pruebas y la trazabilidad.

Todo código no evidente debe explicar con comentarios breves y profesionales su
intención, invariante, decisión técnica o significado de una variable relevante.
No comentar cada línea ni repetir el nombre de una función; preferir nombres
claros y comentarios que expliquen el motivo de la decisión.

Las migraciones están en `database/migrations/`. `synchronize` no sustituye una
migración. Verificar qué scripts se aplicaron en el ambiente destino es parte
del despliegue. En particular, no se debe suponer que una función de PostgreSQL
referenciada por el código existe en Neon sólo porque aparezca en un archivo de
migración.

## Estados y datos sensibles

Los estados de formularios vigentes en el código incluyen `BORRADOR`,
`CONFIRMADO` y `DESCARTADO`; las transiciones de negocio que aún no están
acordadas se mantienen en el registro de decisiones. No se elimina físicamente
la información clínica, de formularios ni de auditoría para resolver un flujo
de negocio.

Los documentos privados no se sirven desde directorios públicos. El proveedor
de almacenamiento, retención y operación de producción sigue pendiente de
decisión.

## Verificación local

Con las variables de entorno locales configuradas:

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:core
```

`pnpm run check` valida tipos, pruebas y compilación de ambas aplicaciones. No
ejecutar migraciones de manera automática contra una base compartida: revisar
primero su estado y alcance.

## Cambios de negocio o infraestructura

Antes de añadir campos, estados, permisos, rutas o reportes, revisar
`DECISIONES_Y_DUDAS.md`. Si no existe una decisión, agregar una duda con el
formato normalizado y no inventar una regla de negocio. Las reglas específicas
de frontend se conservan en `docs/contexto/frontend/` y las del backend en
`docs/contexto/backend/AGENTS.md`.

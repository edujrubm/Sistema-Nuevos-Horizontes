# Capa de base de datos

Esta carpeta contiene la configuración compartida de TypeORM y entidades de
persistencia. Las migraciones SQL viven en `database/migrations/` y son la vía
para modificar el esquema.

TypeORM y SQL parametrizado coexisten. Las operaciones complejas se encapsulan
en repositorios o adaptadores; los controladores no contienen consultas SQL.
Consultar `docs/GUIA_TECNICA.md` antes de cambiar esta capa.

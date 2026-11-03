# Base de datos

La aplicación trabaja contra el esquema PostgreSQL `new_horizons` ya aprobado. Incorporar bajo `database/migrations/` una copia exacta de cada script SQL aplicado al servidor.

```text
database/migrations/
├── 003_persona1_soporte_operativo.sql
├── 004_ninos_estado_operativo.sql
├── 005_ficha_inicial_borrador_unico.sql
└── 006_nino_cui_unico.sql
```

No usar sincronización automática del ORM. Un script aplicado no se edita ni se vuelve a ejecutar; el cambio posterior se expresa como una nueva migración.

El repositorio contiene las migraciones anteriores como evidencia versionada,
pero su presencia no confirma que una base remota específica las tenga
aplicadas. Consultar `../docs/ESTADO_TECNICO_ACTUAL.md` antes de tomar una
decisión de despliegue o asumir el estado de PostgreSQL.

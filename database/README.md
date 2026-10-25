# Base de datos

La aplicación trabaja contra el esquema PostgreSQL `new_horizons` ya aprobado. Incorporar bajo `database/migrations/` una copia exacta de cada script SQL aplicado al servidor.

```text
database/migrations/
├── 001_inicial.sql
├── 002_expediente_y_formularios.sql
└── 003_descripcion_del_cambio.sql
```

No usar sincronización automática del ORM. Un script aplicado no se edita ni se vuelve a ejecutar; el cambio posterior se expresa como una nueva migración.

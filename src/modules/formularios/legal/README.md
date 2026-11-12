# Legal

Módulo implementado e integrado en `main`. `LegalController` publica las siguientes rutas; el prefijo global es `/api` y el controlador añade `/v1`.

| Método | Ruta |
|---|---|
| GET | `/api/v1/legal/beneficiarias/:id/fichas` |
| GET | `/api/v1/legal/beneficiarias/:id/referencias` |
| POST | `/api/v1/legal/beneficiarias/:id/referencias` |
| GET | `/api/v1/legal/referencias/:id` |
| PATCH | `/api/v1/legal/referencias/:id` |
| POST | `/api/v1/legal/referencias/:id/confirmar` |

## Registro y lógica

`AppModule → DomainModule → FormulariosModule → LegalModule → LegalController`.

Los listados de fichas y referencias usan `LegalService → LegalRepository`,
con entidades TypeORM y `QueryBuilder`. El repositorio resuelve el expediente,
filtra por tipo y pagina con un orden estable de fecha e identificador. El
conteo y la consulta comparten una transacción `REPEATABLE READ`. Estas dos
operaciones no dependen de la función PostgreSQL `local_json_seguro`.

La cabecera existente se mapea en
`../shared/entities/formulario-area.entity.ts`; no crea tablas ni cambia el
esquema. Los identificadores bigint permanecen como cadenas.

La consulta individual de referencias usa también repositorios TypeORM y
comprueba el tipo de formulario antes de devolver el detalle.

Las escrituras de referencias todavía utilizan el servicio heredado.
Su migración, la eliminación completa de esa dependencia y
la reorganización del frontend siguen pendientes; este cambio no resuelve toda
la revisión D-09.

## Pruebas específicas

`test/legal-orm.integration.cjs` verifica consultas y respuestas HTTP reales
con una referencia sintética creada durante la preparación. Requiere compilar
la API y una base desechable local cuyo nombre empiece con `legal_orm_test_`,
con la ficha Legal del expediente 100. Configurar explícitamente `LEGAL_TEST_HOST`
(`127.0.0.1`), `LEGAL_TEST_PORT`, `LEGAL_TEST_DATABASE`,
`LEGAL_TEST_USER` y `LEGAL_TEST_PASSWORD`, y ejecutar:

```sh
node --test test/legal-orm.integration.cjs
```

No dirigir estas pruebas a una base compartida. La preparación de migraciones
y fixtures debe realizarse previamente en el entorno local autorizado.

La creación, edición y confirmación de fichas usa también el [motor compartido de formularios](../README.md). Los seguimientos e historial usan `src/modules/evolucion/evolucion.controller.ts`.

Los procesos y referencias legales corresponden a la beneficiaria; este módulo no publica procesos legales de hijos.

La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada. Las reglas aún no acordadas se registran en `docs/DECISIONES_Y_DUDAS.md`.

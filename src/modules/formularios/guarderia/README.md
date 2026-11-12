# Guardería

Módulo implementado e integrado en `main`. `GuarderiaController` publica las siguientes rutas; el prefijo global es `/api` y el controlador añade `/v1`.

| Método | Ruta |
|---|---|
| GET | `/api/v1/guarderia/beneficiarias/:id/hijos` |
| GET | `/api/v1/guarderia/hijos/:id/fichas` |

## Registro y lógica

`AppModule → DomainModule → FormulariosModule → GuarderiaModule → GuarderiaController`. El módulo importa `Persona3CoreModule` e inyecta `Persona3Service`; las reglas y el acceso a datos se encuentran en `src/modules/persona3/`.

La creación, edición y confirmación de fichas usa también el [motor compartido de formularios](../README.md). Los seguimientos e historial usan `src/modules/evolucion/evolucion.controller.ts`.

La inscripción se reconoce mediante una ficha GUARDERIA confirmada; se conservan los filtros por área y pertenencia del niño.

Inventario y comprobación de integración: [rutas de Persona 3](../../../../docs/integracion/RUTAS_PERSONA3_MAIN_20261112.md). La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada.

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

`AppModule → DomainModule → FormulariosModule → LegalModule → LegalController`. El módulo importa `Persona3CoreModule` e inyecta `Persona3Service`; las reglas y el acceso a datos se encuentran en `src/modules/persona3/`.

La creación, edición y confirmación de fichas usa también el [motor compartido de formularios](../README.md). Los seguimientos e historial usan `src/modules/evolucion/evolucion.controller.ts`.

Los procesos y referencias legales corresponden a la beneficiaria; este módulo no publica procesos legales de hijos.

Inventario y comprobación de integración: [rutas de Persona 3](../../../../docs/integracion/RUTAS_PERSONA3_MAIN_20261112.md). La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada.

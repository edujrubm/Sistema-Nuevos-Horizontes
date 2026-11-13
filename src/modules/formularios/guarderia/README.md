# Guardería

Módulo implementado e integrado en `main`. `GuarderiaController` publica las siguientes rutas; el prefijo global es `/api` y el controlador añade `/v1`.

| Método | Ruta                                        |
| ------ | ------------------------------------------- |
| GET    | `/api/v1/guarderia/beneficiarias/:id/hijos` |
| GET    | `/api/v1/guarderia/hijos/:id/fichas`        |

## Registro y lógica

`AppModule → DomainModule → FormulariosModule → GuarderiaModule → GuarderiaController`. El módulo importa `RegistroAreaModule` e inyecta `GuarderiaService`; las consultas conservadas se encuentran en este módulo y la infraestructura común en `src/common/registros-area/`.

La creación, edición y confirmación de fichas usa también el [motor compartido de formularios](../README.md). Los seguimientos e historial usan `src/modules/evolucion/evolucion.controller.ts`.

La inscripción se reconoce mediante una ficha GUARDERIA confirmada; se conservan los filtros por área y pertenencia del niño.

La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada. Las reglas aún no acordadas se registran en `docs/DECISIONES_Y_DUDAS.md`.

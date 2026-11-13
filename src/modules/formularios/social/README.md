# Trabajo Social

Módulo implementado e integrado en `main`. `SocialController` publica las siguientes rutas; el prefijo global es `/api` y el controlador añade `/v1`.

| Método | Ruta |
|---|---|
| GET | `/api/v1/trabajo-social/beneficiarias/:id/resumen` |
| GET | `/api/v1/trabajo-social/beneficiarias/:id/fichas` |

## Registro y lógica

`AppModule → DomainModule → FormulariosModule → SocialModule → SocialController`. El módulo importa `RegistroAreaModule` e inyecta `SocialService`; las consultas heredadas permanecen en este módulo y las utilidades comunes en `src/common/registros-area/`.

La creación, edición y confirmación de fichas usa también el [motor compartido de formularios](../README.md). Los seguimientos e historial usan `src/modules/evolucion/evolucion.controller.ts`.

La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada. Las reglas aún no acordadas se registran en `docs/DECISIONES_Y_DUDAS.md`.

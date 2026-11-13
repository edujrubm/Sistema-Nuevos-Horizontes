# Trabajo Social

Reconstrucción local en curso. El listado y el resumen usan servicio y repositorios propios con TypeORM. Esto no acredita integración remota ni despliegue. `SocialController` conserva estas rutas:

| Método | Ruta |
|---|---|
| GET | `/api/v1/trabajo-social/beneficiarias/:id/resumen` |
| GET | `/api/v1/trabajo-social/beneficiarias/:id/fichas` |

## Registro y lógica

`SocialController → SocialService → SocialRepository / SocialResumenRepository`. SocialModule registra sus entidades canónicas y consume la interfaz pública EvolucionLecturaModule para los cinco seguimientos recientes. No importa el núcleo heredado organizado por integrantes.

La creación, consulta, listado por cursor, edición, confirmación y descarte utilizan el [motor compartido de formularios](../README.md), que delega el tipo SOCIAL al adaptador ORM SocialFormRepository registrado por el área. El motor no importa repositorios de Social. El servicio y módulo se exportan públicamente desde index.ts; los repositorios permanecen internos.

Cabecera, detalle y auditoría comparten transacción. Edición y transición bloquean la cabecera y revisan versión. El detalle se valida con su DTO existente, incluyendo el rango bigint y referencias de coordinación. Los triggers conservan la versión y el historial, sin incrementos manuales. La edición ordinaria y el descarte siguen limitados a borradores; las obligatoriedades de confirmación y el flujo de correcciones posteriores continúan pendientes del equipo.

| Método | Operación compartida para SOCIAL |
| --- | --- |
| POST | /api/v1/beneficiarias/:id/formularios-area, tipo SOCIAL |
| GET | /api/v1/beneficiarias/:id/formularios-area?tipo=SOCIAL |
| GET | /api/v1/formularios-area/:id |
| PATCH | /api/v1/formularios-area/:id |
| POST | /api/v1/formularios-area/:id/confirmar |
| POST | /api/v1/formularios-area/:id/descartar |

La consulta pública de Evolución solo lee el esquema existente en la misma instantánea del resumen: no cambia captura, corrección, tablas ni reglas de la hoja evolutiva.

Lista, conteo, última ficha e historial conservan los estados del contrato anterior, sin decidir nuevos filtros. El total de riesgos queda en null y señalado en camposSinSoporte porque los riesgos son texto y su catálogo institucional sigue pendiente.

## Verificación local

Compilar con Node 24 y ejecutar scripts/test-social.ps1 para probar con un PostgreSQL desechable propio. Las pruebas incluyen repositorio y HTTP real, privacidad del CUI, paginación, aislamiento, resumen sin fichas, escrituras auditadas, concurrencia y rollback. No utilizar credenciales compartidas.

La autorización productiva permanece pendiente. El callback de auditoría del motor usa su contexto técnico local existente; no constituye una sesión ni concede permisos. El listado común sin filtro de tipo todavía puede recorrer la implementación genérica compartida: esta entrega acredita la delegación específica SOCIAL y no reescribe la persistencia de las demás áreas.

La existencia y registro del controlador no sustituye las pruebas con una base de datos preparada. Las reglas aún no acordadas se registran en `docs/DECISIONES_Y_DUDAS.md`.

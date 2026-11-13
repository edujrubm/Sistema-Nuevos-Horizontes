> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Reconstrucción del listado de Trabajo Social

Fecha: 13 de noviembre de 2026. Alcance autorizado por Eduardo: reconstruir el listado propio de fichas con TypeORM, manteniendo ruta, paginación y total. Cambios locales, sin commit, push ni PR.

## Comportamiento

`GET /api/v1/trabajo-social/beneficiarias/:id/fichas` ahora ejecuta SocialController → SocialService → SocialRepository. El repositorio encuentra el expediente mediante su entidad canónica y consulta cabecera y detalle SOCIAL con QueryBuilder de TypeORM. No utiliza consultas CRUD crudas ni depende de la función local_json_seguro.

Se conservan `datos`, `pagina`, `limite` y `total`, los identificadores bigint como cadenas, los campos camelCase y el detalle sin su llave interna formularioId. Los parámetros siguen usando el DTO común: página desde 1, límite de 1 a 100. Una beneficiaria sin expediente produce el error público existente; un expediente sin fichas devuelve total cero. Una página posterior al final devuelve datos vacíos y mantiene el total real.

El orden es fecha de atención descendente y luego identificador descendente. Lista y conteo se leen en la misma transacción REPEATABLE READ. El tipo SOCIAL y el expediente se fijan en el servidor mediante parámetros.

Este listado conserva todos los estados, incluidas descartadas, igual que la implementación anterior. No se decidió una política nueva de visibilidad. El listado común de formularios puede tener filtros distintos; unificar esa regla corresponde a las decisiones pendientes.

## Archivos de esta entrega

| Archivo desde la raíz del repositorio | Trabajo realizado |
| --- | --- |
| src/modules/formularios/social/repositories/social.repository.ts | Nuevo repositorio ORM para expediente, listado, orden y total consistente |
| src/modules/formularios/social/social.service.ts | Implementación del caso de uso listarFichas, antes vacío |
| src/modules/formularios/social/social.controller.ts | El listado delega al servicio propio; reutiliza pipe y DTO comunes y retira imports sin uso |
| src/modules/formularios/social/social.module.ts | Registra entidades, servicio y repositorio propios; exporta el servicio, no el repositorio |
| test/fixtures/social.sql | Datos sintéticos: estados, fichas, empates de fecha y expedientes separados/con y sin fichas |
| test/social-listado.integration.cjs | Trece pruebas de repositorio y HTTP sobre PostgreSQL real y SocialModule real |
| scripts/test-social.ps1 | Prepara un clúster desechable local en puerto 55486, aplica esquema y fixtures solo allí, ejecuta pruebas y detiene su propio servidor |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Registra cierre del listado y siguiente tarea del paso 3 |
| docs/contexto/backend/RECONSTRUCCION_LISTADO_SOCIAL.md | Este informe de alcance, cambios, pruebas y límites |

El runner usa variables SOCIAL_TEST_* y restaura el entorno al terminar. Reutiliza los fixtures base y el fixture existente de Legal para comprobar separación por tipo; no los modifica. Los archivos históricos del esquema se aplican únicamente en el clúster sintético nuevo; no se modificaron migraciones ni se aplicó nada a la base del equipo o a la base local donde se estaban probando pantallas.

## Verificación ejecutada

- `pnpm run check`: tipos del frontend, 47 pruebas de backend, 147 pruebas de frontend y compilaciones de API y web aprobadas.
- `scripts/test-social.ps1`: 13 pruebas aprobadas contra PostgreSQL real; cero fallos.
- Se comprobaron respuesta, detalle, fechas, precisión de identificadores, orden por atención y desempate, páginas sucesivas sin duplicados, página fuera de rango, expediente sin fichas, aislamiento de expedientes/tipos y compatibilidad de descartadas.
- HTTP real: ruta pública, página solicitada, total, fechas serializadas y rechazo de página/límite inválidos e identificador fuera de rango.
- Evidencia local ignorada por Git: test-results/social-listado-check.log y test-results/social-listado.integration.tap.

Para repetir, usar Node 24, compilar la API y ejecutar `./scripts/test-social.ps1 -NodeExe <ruta-a-node24>`. Requiere PostgreSQL 18 instalado; acepta PostgresBin y Port para otro directorio o puerto local disponible. El servidor de ensayo escucha exclusivamente en 127.0.0.1. No elimina directorios al terminar.

## Límites pendientes

El resumen aún usa el proveedor heredado: por eso el controlador y módulo conservan temporalmente esa dependencia. El listado nuevo ya no ejecuta ese servicio. No se afirma que Social completo sea independiente ni que se hayan eliminado todas las referencias antiguas del área.

No se modificó frontend ni diseño. No se conectó este código a los procesos de demostración que siguen abiertos en otra copia local; las pruebas HTTP arrancaron una instancia temporal con el código nuevo. No se implementó autenticación productiva ni se acreditó despliegue.

Sigue reconstruir el resumen con ORM y separar su proveedor anterior, respetando los pendientes de riesgos y el contrato con Evolución. Luego continúa el adaptador de formularios para escrituras. La hoja evolutiva permanece diferida.

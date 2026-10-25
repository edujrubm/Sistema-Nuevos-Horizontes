# Contrato de API REST

## Convenciones generales

- Prefijo: `/api/v1`.
- JSON UTF-8; nombres de propiedades en `camelCase`.
- Identificadores opacos; no exponer secuencias como mecanismo de autorización.
- Fechas civiles `YYYY-MM-DD`; instantes ISO 8601 con zona/offset.
- CUI nunca se incluye en URL. Las búsquedas sensibles usan cuerpo `POST` o parámetros protegidos por política de logs.
- Toda respuesta contiene solo campos autorizados para ese actor.
- OpenAPI debe generarse y validarse en CI; ejemplos sintéticos.

## Paginación y filtros

Listados grandes usan cursor estable (`createdAt`, `id`) y límite máximo. Para tablas administrativas pequeñas puede usarse página/offset. Respuesta sugerida:

```json
{"data": [], "page": {"nextCursor": null, "hasMore": false}}
```

Orden y filtros se enumeran explícitamente; nunca interpolar columnas recibidas. Búsqueda de beneficiarias devuelve un resumen minimizado y exige capacidad.

## Errores

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "El registro cambió desde que fue consultado.",
    "fieldErrors": [],
    "requestId": "..."
  }
}
```

Códigos estables: `VALIDATION_ERROR`, `AUTHENTICATION_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `VERSION_CONFLICT`, `DUPLICATE_CUI`, `ACTIVE_STAY_EXISTS`, `NO_OPEN_EXIT`, `DOCUMENT_ANNULLED`, `IDEMPOTENCY_CONFLICT`. El mensaje no revela datos sensibles ni detalles SQL.

## Concurrencia e idempotencia

- Entregar `ETag` o `version` en recursos editables; exigir `If-Match` o versión en mutaciones.
- Confirmación de ficha, ingreso, salida, retorno, egreso, anulación y exportación aceptan `Idempotency-Key` por actor y operación.
- Reutilizar la clave con otro cuerpo devuelve `409`; con el mismo cuerpo devuelve el resultado original dentro de la retención definida.

## Superficie inicial sugerida

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/password-reset/request
POST   /auth/password-reset/complete
GET    /me/capabilities

GET    /beneficiaries
POST   /beneficiaries/search-matches
POST   /beneficiaries
GET    /beneficiaries/:id
PATCH  /beneficiaries/:id
POST   /beneficiaries/:id/inactivate
POST   /beneficiaries/:id/restore
GET    /beneficiaries/:id/history

POST   /beneficiaries/:id/initial-intakes
GET    /initial-intakes/:id
PATCH  /initial-intakes/:id/sections/:section
POST   /initial-intakes/:id/confirm
POST   /initial-intakes/:id/children

GET    /beneficiaries/:id/area-records?area=&type=
POST   /beneficiaries/:id/area-records
GET    /area-records/:id
PATCH  /area-records/:id
POST   /area-records/:id/confirm

GET    /beneficiaries/:id/evolution?area=
POST   /beneficiaries/:id/evolution
PATCH  /evolution-entries/:id
GET    /evolution-entries/:id/revisions

GET    /beneficiaries/:id/documents?area=
POST   /beneficiaries/:id/documents/uploads
POST   /documents/:id/versions
POST   /documents/:id/annul
POST   /documents/:id/download-ticket

GET    /shelter/stays
POST   /shelter/stays
POST   /shelter/stays/:id/temporary-exits
POST   /shelter/stays/:id/returns
POST   /shelter/stays/:id/discharge
POST   /shelter/stays/:id/newborns

GET    /reports/:reportId
POST   /report-exports
GET    /jobs/:id
GET    /audit/changes
GET    /audit/accesses
```

Estas rutas son propuestas de contrato, no evidencia de implementación. Formularios específicos pueden tener endpoints propios si sus invariantes difieren.

## Carga de documentos

Flujo recomendado: solicitar carga → servidor crea intento y URL privada temporal → cliente carga → servidor verifica tamaño, MIME real, checksum y antivirus → confirmar versión. Un intento incompleto expira. El nombre original se trata como metadato no confiable.

## Impresión y exportación

Imprimir y descargar verifican capacidades distintas. Una representación imprimible del expediente se genera en servidor o servicio controlado, queda ligada a filtros/versión y registra acceso. Las exportaciones grandes devuelven `202 Accepted` con trabajo consultable.

## Mapeo al esquema unificado v2

Los endpoints de formularios crean una cabecera `formulario_area` y exactamente un detalle tipado. El `beneficiaryId` de la ruta se resuelve a `expediente.id_expediente`; para formularios infantiles, `nino_id` debe pertenecer al mismo expediente. Las respuestas editables exponen `formulario_area.version` y la API traduce los códigos de tipo definidos en `tipo_formulario` sin permitir combinaciones arbitrarias de tipo y área.

La hoja evolutiva se consulta desde `v_hoja_evolutiva` o una proyección equivalente y se escribe en `entrada_evolutiva`. Los documentos se exponen como recursos lógicos aunque v2 almacene cada versión como una fila de `documento_area`; el adaptador debe validar la cadena antes de responder.

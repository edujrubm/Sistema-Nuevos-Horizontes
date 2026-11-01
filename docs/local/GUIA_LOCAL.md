# Guía del laboratorio local

Ver README_LOCAL.md para iniciar la base y la API. Área por defecto: Legal. Para Social o Guardería se selecciona el área al iniciar el servidor; la pantalla no puede cambiar su ámbito por sí misma.

## Operaciones de prueba añadidas

Todas usan `/api/v1` y el contrato de errores en español. Las operaciones de escritura usan la versión actual y un motivo. Los IDs bigint se envían como texto.

| Método | Ruta | Uso |
|---|---|---|
| GET | /laboratorio/catalogos | Área activa, fichas de prueba, riesgos y estados documentales. |
| GET | /laboratorio/fichas/:id | Cabecera, detalle, riesgos, familiares, autorizaciones y documentos. |
| PATCH | /laboratorio/fichas/:id | Guardar campos propios del detalle y, opcionalmente, vincular ficha inicial del mismo expediente. |
| PUT | /laboratorio/fichas/:id/riesgos | Reemplazar la selección de riesgos de Social, conservando historial. |
| POST | /laboratorio/fichas/:id/responsables | Registrar una persona responsable en una ficha de Guardería. |
| PUT | /laboratorio/fichas/:id/autorizaciones | Guardar quién lleva y quién recoge; omitir una autorización la desactiva sin borrarla. |
| POST | /laboratorio/fichas/:id/cierre | Cierre experimental de Social. |
| PATCH | /laboratorio/documentos/:id | Título, descripción y revisión documental. `version` corresponde a `versionRegistro`. |
| GET | /laboratorio/documentos/:id/archivo | Consultar el PDF privado; valida área, tamaño y hash. |

No reemplazan las 14 rutas asignadas ni se han publicado para el grupo. La pantalla usa estas operaciones con las fichas sintéticas existentes; no es el motor definitivo de creación de formularios de todos los integrantes.

## Ejemplos de cuerpos

Primero consultar la ficha y copiar `formulario.version`. No usar el número del ejemplo como una versión real.

Guardar un detalle Legal:

```json
{"version":2,"motivo":"Completar ficha de prueba","detalle":{"normativaAplicable":"Normativa sintética","objetivoLegal":"Objetivo de prueba","proximaActuacionFecha":"2026-11-10"}}
```

Elegir riesgos de Social (usar IDs de GET catalogos):

```json
{"version":2,"motivo":"Registrar valoración de prueba","riesgosIds":["1","2"]}
```

Registrar responsable en Guardería:

```json
{"version":2,"motivo":"Registrar responsable de prueba","nombre":"Persona sintética","telefono":"55555555"}
```

Asignar permisos (usar el ID del responsable devuelto):

```json
{"version":3,"motivo":"Registrar permisos de prueba","autorizaciones":[{"familiarId":"1","puedeLlevar":true,"puedeRecoger":false}]}
```

Revisar un documento (la versión se obtiene de `documentos[].versionRegistro`):

```json
{"version":1,"motivo":"Verificación del PDF de prueba","estadoRevisionCodigo":"REVISADO"}
```

Carga de PDF: se conserva POST `/beneficiarias/:id/documentos/cargas`, con multipart `archivo`, `formularioId` y `categoria`. Ahora acepta `fechaDocumento` (YYYY-MM-DD), `descripcion`, `nombreDocumento`, `documentoAnteriorId` y `motivoCambio`. Para otra versión son obligatorios documento anterior y motivo; no se reemplazan archivos anteriores.

## Postman y OpenAPI

- Las colecciones originales mantienen las rutas y ahora apuntan por defecto al puerto 3015. La colección PDF incluye metadatos.
- `LaboratorioLocal.postman_collection.json` enumera las nueve operaciones adicionales. Sus cuerpos son plantillas: completar los campos según los ejemplos y consultar la versión vigente antes de guardar.
- No ejecutar todas las operaciones de Social y Guardería como si fueran del área Legal: iniciar el contexto correspondiente. La colección local no se declara una ejecución automática completa de las tres áreas.
- `docs/local/openapi-local.json` añade las rutas experimentales y `docs/persona3/openapi.json` documenta la carga ampliada y medio de entrega.

## Copia y restauración

`database/export/esquema-local.sql` contiene solo el esquema. `laboratorio-datos-sinteticos.sql` contiene también los registros de demostración. Restaurar en una BD **nueva y vacía**, junto con los archivos de `documentos-privados`, usando el directorio privado configurado. Las referencias nuevas son claves relativas y no dependen de la ruta del proyecto.

Las bases de prueba se crean por ejecución y se detienen al finalizar; sus carpetas permanecen como evidencia. La demostración guarda su propio cluster persistente. Ctrl+C detiene API y PostgreSQL de la demostración sin borrar los datos. No hace falta iniciar ni tocar los servicios del grupo.

## Publicación de estas fuentes

El resultado de validación para esta entrega y sus límites están en `docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md`. Los endpoints experimentales requieren `P3_ENABLE_LAB=true` en desarrollo o pruebas y no se registran por defecto. La publicación no ejecuta SQL ni activa funcionalidades en el servidor del grupo.

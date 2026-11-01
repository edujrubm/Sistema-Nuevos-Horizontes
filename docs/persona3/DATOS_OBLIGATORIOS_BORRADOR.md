# Datos mínimos de borrador y confirmación

Decisión vigente: 29 de octubre de 2026. El usuario delegó el criterio para mínimos y aprobó destino/motivo al confirmar la referencia. No es una lista pendiente de aprobación.

## Para guardar borrador

| Dato | Obligatorio | Cómo se obtiene |
|---|---|---|
| Beneficiaria existente con expediente | Sí | Selección del registro; no volver a escribir nombre ni CUI. |
| Fecha y hora real de atención | Sí | Se indican con zona horaria. No sustituir una fecha desconocida por la actual. |
| Profesional responsable existente | Sí | Se selecciona; no asignar un profesional ficticio ni confundirlo con capturista. |
| Niño del expediente, solo para Guardería | Sí, cuando aplica | Se selecciona. Legal y Social corresponden a la beneficiaria. |
| Expediente, tipo, área, capturista, estado | Sí, técnicos | Los deriva/asigna el servidor del contexto y del flujo. |
| ID, versión, captura y actualización | Automáticos | Los genera el sistema. |
| Textos del detalle | No en borrador | Pueden completarse después; desconocido es null, sin valores inventados. |

El detalle de tipo correcto debe existir en BD, pero el servidor lo crea junto con la cabecera. Para crear una referencia no hace falta mandar un objeto `detalle` vacío.

Ejemplo mínimo de referencia: `POST /api/v1/legal/beneficiarias/100/referencias`

```json
{
  "fechaAtencion": "2026-10-29T09:00:00-06:00",
  "profesionalId": "1"
}
```

La beneficiaria viene en la ruta. No se mandan capturista, estado, ID ni versión para el alta.

## Para confirmar referencia Legal

| Campo | Regla |
|---|---|
| Destino | Obligatorio; texto real, no null ni vacío/espacios. |
| Motivo de referencia | Obligatorio; texto real, no null ni vacío/espacios. |
| Origen | Opcional. |
| Recomendaciones | Opcionales. |

Se validan los datos guardados al confirmar; la solicitud de confirmación lleva versión actual y motivo. Si faltan campos se señalan y no se cambia estado, versión ni historial. Una corrección posterior de una referencia confirmada tampoco puede borrar esos datos obligatorios.

## Para modificar

Versión actual, motivo de cambio y al menos un campo que guardar. No se reescriben capturista ni captura. La referencia confirmada conserva su estado y el historial registra los cambios.

## Límite de las 14 rutas

P3 crea/edita/confirma referencias; las rutas específicas de ficha Social, ficha Legal y Guardería son de consulta. Esta decisión no agrega endpoints de creación/edición genéricos de otros integrantes. Los mínimos de estas fichas describen el SQL vigente, no amplían la asignación.

## Seguimiento y PDF son operaciones diferentes

- Seguimiento: ficha confirmada propia del área/expediente, acción libre, contenido, atención y profesional. Plan/resultado opcionales; captura automática.
- PDF: ficha y beneficiaria correspondientes, categoría y archivo válido; metadatos técnicos automáticos. Almacenamiento privado propio, sin dependencia de compañeros.

# Flujos y contrato de formularios de área

## Propósito

Este documento define el comportamiento que deben conservar los futuros backends para los formularios de Psicología, Medicina, Trabajo Social, Legal y Guardería. Separa las operaciones habituales de captura de las operaciones que requieren justificación y auditoría explícita.

La regla transversal es que un formulario institucional no se elimina físicamente. Un borrador que ya no se utilizará se **descarta de forma lógica**, conservando contenido, versión, motivo, responsable y fecha.

## Estados

| Estado | Significado | Edición | Aparición predeterminada |
|---|---|---:|---:|
| `BORRADOR` | Ficha iniciada y todavía modificable. | Sí | Sí |
| `CONFIRMADO` | Ficha completada y confirmada como registro institucional. | No mediante el guardado ordinario | Sí |
| `DESCARTADO` | Borrador cerrado porque no debía continuar. Estado propuesto y pendiente de aprobación/migración. | No | No; disponible en historial autorizado |

`DESCARTADO` no debe reutilizarse para corregir ni anular formularios confirmados. La corrección de un registro confirmado es un flujo versionado diferente.

## Transiciones permitidas

```text
Nuevo formulario -> BORRADOR
BORRADOR --guardar--> BORRADOR
BORRADOR --confirmar--> CONFIRMADO
BORRADOR --descartar con motivo--> DESCARTADO
CONFIRMADO --corregir con motivo--> nueva revisión/versionado (contrato pendiente)
```

No hay transición de `CONFIRMADO` a `BORRADOR`. Tampoco hay restauración de `DESCARTADO` hasta que exista una regla institucional aprobada.

## 1. Creación de una ficha

1. El cliente solicita crear el formulario con beneficiaria, variante, fecha de referencia/atención y profesional.
2. La fecha de referencia es obligatoria y debe ser una fecha civil válida.
3. El servidor valida que el expediente, el tipo, el área, el profesional y, cuando corresponda, la hija o hijo pertenezcan al mismo ámbito.
4. La cabecera y su detalle tipado se crean en una sola transacción con estado `BORRADOR`.
5. La respuesta devuelve el identificador y la versión autoritativa.

La creación no solicita un comentario al usuario. Si la infraestructura de auditoría exige un motivo técnico, el backend registra un valor controlado como `Creación de borrador`; no acepta que el cliente lo suplante como actor o justificación institucional.

## 2. Guardado de borrador

1. Solo se permite sobre `BORRADOR`.
2. El cliente envía la versión leída y los campos modificados.
3. El servidor valida los campos de la variante, fecha de referencia y pertenencia del sujeto.
4. La escritura incrementa la versión y conserva auditoría.
5. Si la versión cambió, se responde conflicto y nunca se sobrescribe silenciosamente.

El guardado ordinario no solicita motivo al usuario. Para satisfacer la auditoría técnica, se usa el motivo controlado `Guardado de borrador`.

Contrato actual:

```http
PATCH /api/v1/formularios-area/{id}
Content-Type: application/json

{
  "version": 3,
  "motivo": "Guardado de borrador",
  "fechaAtencion": "2026-11-06",
  "detalle": {}
}
```

El campo `motivo` permanece en el contrato actual por la auditoría del DDL. En un backend futuro conviene que el servidor establezca el motivo técnico para guardados rutinarios y reserve un campo de justificación explícita para correcciones y descartes.

## 3. Confirmación inicial

1. La acción de confirmar está deshabilitada desde que se abre una ficha nueva.
2. Se habilita únicamente si los campos obligatorios están completos, existe fecha de referencia, la ficha ya fue guardada y no hay cambios locales pendientes ni conflicto de versión.
3. El cliente muestra un resumen y solicita confirmación de la acción, no un motivo narrativo.
4. El servidor vuelve a validar completitud, estado y versión dentro de la transacción.
5. Al confirmar, el formulario pasa a `CONFIRMADO` y el editor ordinario queda bloqueado.

La auditoría usa el motivo técnico controlado `Confirmación inicial de ficha`. La confirmación no debe depender únicamente de la habilitación del botón del frontend.

Contrato actual:

```http
POST /api/v1/formularios-area/{id}/confirmar
Content-Type: application/json

{
  "version": 4,
  "motivo": "Confirmación inicial de ficha"
}
```

## 4. Corrección posterior de una ficha confirmada

Este flujo todavía requiere un contrato definitivo. Como mínimo debe cumplir lo siguiente:

- exigir una capacidad específica distinta de crear/editar borradores;
- pedir un motivo explícito al usuario;
- conservar la versión anterior y la identidad de quien corrigió;
- no convertir el registro confirmado en borrador ni sobrescribirlo sin historial;
- aplicar control de concurrencia y auditoría dentro de la misma transacción;
- mostrar al usuario la consecuencia antes de confirmar la corrección.

## 5. Descarte de un borrador

Esta operación fue aprobada por el equipo y forma parte del contrato implementado.

### Reglas funcionales

- Solo se permite si el formulario está en `BORRADOR`.
- El motivo es obligatorio, explícito y no puede reducirse a espacios.
- El usuario debe confirmar la acción viendo la beneficiaria, el tipo de ficha y la consecuencia.
- El servidor verifica capacidad, ámbito, estado y versión; el frontend no constituye una autorización.
- El formulario y sus detalles se conservan. El cambio deja estado, motivo, actor y fecha en auditoría.
- Un borrador descartado desaparece de los listados operativos por defecto, pero sigue visible en historial para perfiles autorizados.
- La operación debe ser idempotente o responder un conflicto estable si ya no está en borrador.

### Contrato recomendado

Se recomienda una acción de dominio y no `DELETE`, porque no se borra el recurso:

```http
POST /api/v1/formularios-area/{id}/descartar
Content-Type: application/json

{
  "version": 2,
  "motivo": "La ficha se inició para la beneficiaria equivocada."
}
```

Respuesta exitosa sugerida:

```json
{
  "data": {
    "id": "15",
    "estado": "DESCARTADO",
    "version": 3,
    "descartadoEn": "2026-11-07T05:20:00.000Z"
  }
}
```

`DESCARTADO` fue aprobado como estado y la migración `007_estado_formulario_descartado.sql` lo incorpora al catálogo. La capacidad definitiva que autoriza la acción debe integrarse cuando el contrato de sesión publique capacidades efectivas; el backend seguirá siendo la autoridad. No se modifican migraciones ya aplicadas.

## Errores mínimos del contrato

| HTTP | Código estable | Uso |
|---:|---|---|
| 400 | `INVALID_FORM_FIELD` | Campo o fecha inválida. |
| 400 | `DISCARD_REASON_REQUIRED` | Falta el motivo de descarte. |
| 403 | `FORM_ACTION_FORBIDDEN` | El actor no tiene capacidad o ámbito. |
| 404 | `FORM_NOT_FOUND` | El formulario no existe o no es visible para el actor. |
| 409 | `VERSION_CONFLICT` | La versión enviada dejó de ser vigente. |
| 409 | `STATE_CONFLICT` | La acción no corresponde al estado actual. |
| 503 | `FORM_STATE_CATALOG_NOT_CONFIGURED` | Falta un estado requerido en el catálogo. |

Los mensajes no deben incluir relatos, diagnósticos ni contenido clínico.

## Reglas de frontend asociadas

- Mostrar `Guardar borrador` y `Revisar y confirmar` como acciones separadas.
- No pedir motivo para crear, guardar o confirmar inicialmente.
- Pedir motivo para descartar un borrador y para corregir un confirmado.
- Deshabilitar confirmación al inicio, con campos obligatorios incompletos, sin guardado vigente, durante una petición o ante conflicto.
- Mostrar `Descartar borrador` en el resumen/listado del área, solo cuando el recurso persistido siga en `BORRADOR` y la respuesta de capacidades lo permita.
- Desplegar la justificación en una fila inmediata debajo de la ficha seleccionada. Esta solución evita el portal, la superposición y el manejo global de foco de un modal, y mantiene la interfaz ligera para equipos con poca memoria.
- No mostrar la acción de descarte dentro del editor clínico, para separar la captura de la administración de borradores.
- Después de descartar, actualizar el listado y retirar la ficha de la vista operativa.

## Auditoría y concurrencia

Toda transición se ejecuta en una transacción. El backend fija actor y motivo mediante `SET LOCAL` en la misma conexión antes de actualizar tablas auditadas. La comparación de versión y el cambio de estado deben ser atómicos.

El historial mínimo registra recurso, operación, valores anterior/nuevo, versión, actor, motivo y fecha/hora autoritativa. Los logs técnicos solo contienen identificadores y códigos de error sanitizados.

## Pruebas de aceptación para futuros backends

- Crear genera un `BORRADOR` con fecha de referencia y versión inicial.
- Guardar sin comentario visible persiste cambios e incrementa versión.
- Guardar una versión obsoleta devuelve `VERSION_CONFLICT` y conserva los datos vigentes.
- Confirmar está rechazado por el servidor si faltan campos obligatorios, aunque se invoque sin frontend.
- Confirmar un borrador válido lo bloquea para edición ordinaria.
- Descartar exige motivo, capacidad, estado `BORRADOR` y versión vigente.
- Descartar no elimina filas de cabecera, detalle ni auditoría.
- Un confirmado no puede descartarse mediante el flujo de borradores.
- Los listados normales omiten descartados y el historial autorizado puede consultarlos.
- Dos solicitudes simultáneas de confirmar/descartar producen una sola transición válida.

## Estado de implementación al 7 de noviembre de 2026

- Implementado: creación, consulta, listado, guardado versionado y confirmación.
- Implementado en el frontend de Psicología: confirmación inicialmente deshabilitada, campos mínimos requeridos y obligación de guardar antes de confirmar.
- Pendiente: validación completa de obligatoriedad por cada variante en el backend.
- Implementado: estado `DESCARTADO`, migración de catálogo, endpoint versionado, ocultamiento del listado operativo y acción de interfaz con motivo obligatorio.
- Pendiente: integrar la capacidad específica de descarte cuando el contrato de autenticación/autorización esté disponible.
- Pendiente de definición: corrección versionada de formularios confirmados.

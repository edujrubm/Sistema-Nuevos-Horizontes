# Nuevos Horizontes: contrato común de errores de la API

**Versión:** 1.1 · **Fecha:** 29 de octubre de 2026

**Destinatarios:** los cuatro integrantes del equipo y sus asistentes de IA.

**Propósito:** unificar las respuestas de error de todas las áreas. Los mensajes que recibe la persona usuaria deben estar en español.

**Estado del documento:** contrato v1.1 implementado en las APIs de persona 3 el 30 de octubre de 2026. Los demás integrantes pueden reutilizar el módulo `src/common/errors`; deben registrar una sola infraestructura global al integrar. Los códigos de funciones futuras son catálogo, no implementaciones de esas funciones. Ver `persona3/ERRORES_IMPLEMENTADOS.md`.

## Protocolo de lectura y ejecución para la IA

**Lee primero este bloque.** Este es un contrato transversal de respuestas y manejo de fallos, no una tarea para implementar todas las funciones del sistema. El alcance de tu cambio lo determina el integrante que te entregue este archivo.

### Reglas obligatorias

1. Conserva las cinco propiedades del sobre: `estado`, `codigo`, `mensaje`, `errores`, `idSolicitud`. Conserva las rutas y el formato de respuestas exitosas.
2. Mensajes visibles en español. Usa exclusivamente códigos públicos del catálogo y mensajes controlados; nunca el texto crudo de una excepción.
3. Un error de validación/negocio conocido recibe su código específico. **Todo fallo desconocido recibe una respuesta de respaldo**; ningún `throw`, rechazo asíncrono o respuesta ajena al contrato debe acabar mostrando detalles internos al usuario.
4. Antes de devolver un error relacionado con un recurso, aplica la política de acceso. No revelar por el error que existe un expediente ajeno.
5. En operaciones de escritura, determina si hubo reversión confirmada, guardado confirmado o resultado incierto. No confundir «no recibimos respuesta» con «no se guardó».
6. No duplicar filtros globales, catálogos o manejadores de otros integrantes. Integra una infraestructura común y adaptadores por módulo.
7. No modificar SQL, campos obligatorios, estados institucionales, autorizaciones o funciones diferidas para hacer pasar las pruebas de este documento.
8. Documentar y probar los límites: un proceso terminado, un corte de red o un intermediario pueden impedir que llegue un JSON del backend; la pantalla también tiene una respuesta de respaldo.

### Orden recomendado de trabajo

```text
Inspeccionar manejo actual
  → localizar infraestructura común
  → inventariar puntos de fallo del módulo
  → clasificar cada fallo con el árbol siguiente
  → implementar normalización y reversión donde corresponda
  → probar respuestas HTTP y comportamiento del cliente
  → actualizar OpenAPI/Postman y reportar pendientes
```

### Árbol de decisión obligatorio

1. **¿El fallo ocurrió antes de llegar a la aplicación o después de perder la conexión?** La capa que todavía puede responder lo normaliza. Si no llega respuesta válida al cliente, usar los códigos locales de la sección 9. No inventar un HTTP ni un identificador del servidor.
2. **¿Ya se enviaron las cabeceras o parte de un archivo?** No intentar enviar un segundo JSON. Interrumpir de forma controlada, cerrar/liberar recursos y registrar la correlación. El cliente debe tratar el contenido incompleto como fallido. Ver sección 16.
3. **¿La causa coincide de forma verificable con un error del catálogo?** Usar el código, HTTP y mensaje de ese error. No deducir reglas institucionales comparando fragmentos arbitrarios de mensajes SQL.
4. **¿Es una excepción HTTP confiable del framework con estado 400–499 y no tiene una clasificación más precisa?** Usar `SOLICITUD_RECHAZADA`, conservar ese HTTP y reemplazar el contenido por el mensaje público seguro. Las respuestas externas de proveedores no son excepciones confiables del framework.
5. **¿Es una indisponibilidad temporal identificada?** Usar el código de disponibilidad correspondiente, sin prometer que una escritura no se aplicó.
6. **¿Se perdió la confirmación de una escritura y no se puede demostrar si terminó?** Usar `RESULTADO_OPERACION_INCIERTO` si todavía se puede responder; si no, el cliente usará `RESPUESTA_NO_RECIBIDA`. Nunca reintentar a ciegas.
7. **Cualquier otro caso**, incluida una excepción HTTP interna 5xx sin clasificación, un `Error` desconocido o un valor lanzado que no sea `Error`: HTTP 500, `ERROR_INTERNO`, mensaje seguro y `errores: []`. Registrar la causa sin exponerla.

**Precedencia:** la privacidad y la certeza del resultado de una escritura prevalecen sobre un mensaje más específico. Si un fallo de conexión es conocido pero el guardado pudo terminar, el mensaje debe indicar resultado incierto. Un error del código de normalización no debe impedir el respaldo mínimo.

### Entrega esperada de la IA

Al terminar, reporta: archivos modificados, códigos cubiertos, respuestas probadas, pruebas de reversión/concurrencia pertinentes y fallos que dependen de otra capa. No presentes una lista de códigos como prueba de que ya están implementados.

## 1. Contexto que debe conocer quien lo implemente

- El proyecto usa NestJS, TypeScript, TypeORM y PostgreSQL, con organización modular/MVC.
- Las rutas del ciclo se toman del documento Nuevos_Horizontes_Ciclo_2_APIs_Kanban.pdf y utilizan `/api/v1`.
- Cada integrante mantiene los recursos de su asignación. Este contrato aplica a beneficiarias, fichas, formularios, Social, Legal, Guardería, evolución, documentos, Albergue y los servicios que se integren después.
- Autenticación, permisos definitivos y otros servicios están diferidos según la planificación. Se documentan sus errores para que sean compatibles cuando se implementen; no se solicita adelantarlos.
- El SQL aprobado es la fuente de verdad. No cambiar tablas, estados, campos obligatorios ni reglas de negocio solo para adoptar este formato.
- Las correcciones conservan motivo e historial. Los conflictos de versión no deben sobrescribir cambios de otra persona.
- Los adjuntos son exclusivamente PDF. El límite local actual es 20 MiB y debe obtenerse de configuración, no duplicarse en múltiples lugares.
- Este documento no concede permiso para publicar, hacer push, modificar una BD compartida ni enviar información a otras personas. La ejecución de cambios debe respetar la autorización del integrante que lo entregue a su asistente.

## 2. Formato obligatorio de un error recibido del servidor

Todos los errores HTTP de la API deben tener estas cinco propiedades:

```json
{
  "estado": 400,
  "codigo": "DATOS_INVALIDOS",
  "mensaje": "Revisa los datos señalados antes de continuar.",
  "errores": [
    {
      "campo": "fechaAtencion",
      "mensaje": "Ingresa una fecha de atención válida."
    }
  ],
  "idSolicitud": "SOL-8f21c6a19d54"
}
```

| Propiedad | Tipo | Regla |
|---|---|---|
| `estado` | Número entero | Debe coincidir con el estado HTTP real de la respuesta. No devolver HTTP 200 con un error en el cuerpo. |
| `codigo` | Texto | Código estable del catálogo, en español, mayúsculas y guiones bajos. |
| `mensaje` | Texto | Explicación principal en español, segura y comprensible. |
| `errores` | Lista | Siempre existe. Contiene objetos `{campo,mensaje}` o una lista vacía `[]`. |
| `idSolicitud` | Texto | Identificador opaco generado por el servidor para correlacionar la solicitud con sus registros técnicos. |

Reglas adicionales:

1. No agregar propiedades arbitrarias al sobre de error. Una ampliación requiere actualizar este contrato y coordinarla con el equipo.
2. `campo` usa el nombre exacto del campo del contrato de esa ruta; por ejemplo `profesionalId` o `detalle.motivoReferencia`. Se puede usar `hijos[0].nombre` para elementos repetibles. No renombrar campos de las rutas existentes por este documento.
3. Cada elemento de `errores` tiene exactamente `campo` y `mensaje`, ambos textos. No adjuntar el valor rechazado ni el objeto completo recibido.
4. Si no hay un campo concreto que señalar, usar `errores: []`.
5. Si fallan varios campos, usar `DATOS_INVALIDOS` y enumerarlos. Si hay un único problema claramente identificado, se puede usar el código específico, como `CAMPO_OBLIGATORIO` o `FECHA_INVALIDA`.
6. El código es para el funcionamiento del cliente; la persona usuaria ve el mensaje y las indicaciones de los campos.
7. No incorporar nombres de beneficiarias, CUI, diagnósticos, documentos ni otros datos personales en el código, identificador o mensaje de error.
8. La lista de errores solo contiene validaciones conocidas y aprobadas. No declarar obligatorio un campo que el grupo todavía no ha definido como tal.

## 3. Identificador de solicitud

- Generarlo en el servidor al inicio de cada petición, también cuando termine en error de validación o en una ruta inexistente.
- Usar aleatoriedad suficiente, por ejemplo UUID, con o sin prefijo `SOL-`. Los identificadores de los ejemplos solo son ilustrativos.
- No usar el ID de la beneficiaria, de su formulario ni su CUI como identificador de solicitud.
- No confiar directamente en un identificador enviado por un cliente externo. El servidor genera el suyo; la adopción de una cabecera de un intermediario confiable debe acordarse por separado.
- El mismo identificador acompaña toda la petición y se incluye en sus registros técnicos.
- Si se devuelve en una cabecera, usar `X-Id-Solicitud` y el mismo valor del cuerpo. La cabecera es complementaria: el cuerpo mantiene las cinco propiedades.
- Permitir que la persona usuaria copie este número para soporte. El número no es una credencial ni autoriza el acceso a información.

## 4. Catálogo de validación y formularios

| HTTP | Código | Mensaje principal |
|---|---|---|
| 400 | `JSON_INVALIDO` | La información enviada no tiene un formato válido. Vuelve a intentarlo desde el formulario. |
| 400 | `DATOS_INVALIDOS` | Revisa los datos señalados antes de continuar. |
| 400 | `CAMPO_OBLIGATORIO` | Completa los campos obligatorios. |
| 400 | `FORMATO_INVALIDO` | Uno o más datos tienen un formato incorrecto. |
| 400 | `FECHA_INVALIDA` | Ingresa una fecha válida. |
| 400 | `IDENTIFICADOR_INVALIDO` | El identificador del registro no es válido. |
| 400 | `TEXTO_DEMASIADO_LARGO` | El texto supera la longitud permitida. |
| 400 | `CAMPO_NO_PERMITIDO` | La solicitud contiene campos que esta operación no admite. |
| 400 | `SOLICITUD_INCOMPLETA` | Faltan datos para completar la operación. |
| 400 | `SOLICITUD_SIN_CAMBIOS` | Modifica al menos un dato antes de guardar. |
| 400 | `FILTROS_INVALIDOS` | Revisa los filtros de búsqueda. |
| 422 | `FECHAS_INCOMPATIBLES` | La fecha final no puede ser anterior a la fecha inicial. |

Detalles ilustrativos de validación:

```json
{
  "estado": 400,
  "codigo": "DATOS_INVALIDOS",
  "mensaje": "Revisa los datos señalados antes de continuar.",
  "errores": [
    {
      "campo": "profesionalId",
      "mensaje": "Selecciona al profesional responsable."
    },
    {
      "campo": "motivo",
      "mensaje": "Escribe el motivo de la corrección."
    }
  ],
  "idSolicitud": "SOL-02d1849a73c6"
}
```

Otros mensajes de campo que pueden usarse cuando correspondan:

- «Escribe la acción realizada.»
- «Escribe el contenido del seguimiento.»
- «Selecciona un registro válido.»
- «Selecciona una fecha y hora de atención válidas.»
- «El texto admite hasta 200 caracteres.» El límite se toma del validador correspondiente.
- «Este campo no está permitido en esta operación.»

No devolver mensajes automáticos en inglés como `must be a string`, `should not be empty` o `property ... should not exist`. Traducir las validaciones en DTO o mediante un adaptador central, conservando los nombres públicos de los campos.

## 5. Catálogo de consulta, relaciones y cambios

| HTTP | Código | Mensaje principal |
|---|---|---|
| 404 | `REGISTRO_NO_ENCONTRADO` | No se encontró el registro solicitado. |
| 404 | `ARCHIVO_NO_ENCONTRADO` | No se encontró el archivo solicitado. |
| 409 | `REGISTRO_DUPLICADO` | Ya existe un registro con estos datos. Revisa el registro existente antes de continuar. |
| 409 | `VERSION_DESACTUALIZADA` | Otra persona modificó este registro. Vuelve a consultarlo antes de guardar. |
| 409 | `RELACION_INCOMPATIBLE` | Los registros seleccionados no corresponden entre sí. Revisa tu selección. |
| 409 | `ESTADO_NO_PERMITIDO` | El estado actual del registro no permite realizar esta acción. |
| 409 | `FORMULARIO_NO_CONFIRMADO` | Confirma el formulario antes de registrar un seguimiento. |
| 409 | `FORMULARIO_YA_CONFIRMADO` | El formulario ya está confirmado. |
| 409 | `REGISTRO_INACTIVO` | Este registro está inactivo. Debe reactivarse antes de realizar esta acción. |
| 409 | `REGISTRO_ANULADO` | Este registro está anulado. No se puede realizar esta acción. |
| 409 | `INSCRIPCION_REQUERIDA` | El niño o la niña debe estar inscrito en Guardería para realizar esta acción. |
| 409 | `ESTANCIA_ACTIVA_EXISTENTE` | La beneficiaria ya tiene una estancia activa. |
| 409 | `SALIDA_TEMPORAL_EXISTENTE` | La beneficiaria ya tiene una salida temporal pendiente de retorno. |
| 409 | `SALIDA_TEMPORAL_NO_EXISTENTE` | No hay una salida temporal pendiente para registrar el retorno. |
| 409 | `ESTANCIA_FINALIZADA` | La estancia ya finalizó. No se pueden registrar nuevos movimientos. |
| 409 | `OPERACION_EN_PROCESO` | Esta operación ya está en proceso. Espera antes de volver a intentarla. |

Precisiones para evitar respuestas contradictorias:

- Un ID bien formado que no existe produce 404; un ID con formato incorrecto produce 400.
- Si dos registros existen pero no pueden vincularse, corresponde 409. Si revelar alguno vulnera su ámbito, responder 404 genérico, sin confirmar su existencia.
- `INSCRIPCION_REQUERIDA` aplica cuando una operación puede informar de forma autorizada que falta inscripción. Si abrir una ficha no inscrita se trata como recurso no disponible, mantener 404 genérico. No convertir un acceso restringido en una confirmación de existencia.
- El usuario confirmó que una referencia confirmada sí puede corregirse con motivo e historial. No usar `FORMULARIO_YA_CONFIRMADO` para bloquear esa corrección; se usa para un intento de confirmación repetida.
- Un conflicto de versión no se resuelve forzando la escritura. La pantalla debe conservar lo escrito y permitir consultar la versión vigente.
- La existencia de datos similares solo debe convertirse en duplicado cuando una regla aprobada lo establezca. No impedir registros únicamente por tener nombres parecidos.

Ejemplo:

```json
{
  "estado": 409,
  "codigo": "VERSION_DESACTUALIZADA",
  "mensaje": "Otra persona modificó este registro. Vuelve a consultarlo antes de guardar.",
  "errores": [],
  "idSolicitud": "SOL-91b3a2d75e40"
}
```

## 6. Catálogo de PDF y archivos

| HTTP | Código | Mensaje principal |
|---|---|---|
| 400 | `ARCHIVO_REQUERIDO` | Selecciona un archivo PDF para continuar. |
| 400 | `ARCHIVO_VACIO` | El archivo seleccionado está vacío. Selecciona otro PDF. |
| 415 | `TIPO_CONTENIDO_NO_ADMITIDO` | El formato de la solicitud no es compatible con esta operación. |
| 415 | `TIPO_ARCHIVO_NO_PERMITIDO` | Solo se permiten archivos PDF. |
| 413 | `ARCHIVO_DEMASIADO_GRANDE` | El archivo supera el tamaño máximo permitido de 20 MiB. |
| 422 | `PDF_INVALIDO` | No se pudo leer el PDF. Comprueba que el archivo sea válido y vuelve a intentarlo. |
| 422 | `PDF_PROTEGIDO` | El PDF está protegido con contraseña. Selecciona una copia sin contraseña. |
| 409 | `VERSION_DOCUMENTAL_DESACTUALIZADA` | El documento tiene una versión más reciente. Vuelve a consultarlo antes de cargar otra versión. |
| 409 | `DOCUMENTO_ANULADO` | El documento está anulado y esta acción no está disponible. |
| 503 | `ALMACENAMIENTO_NO_DISPONIBLE` | No se puede acceder al servicio de documentos en este momento. Inténtalo más tarde. |
| 500 | `INTEGRIDAD_DOCUMENTO_NO_VERIFICADA` | No se pudo verificar la integridad del documento. Comunícate con soporte e indica el número de solicitud. |

- El mensaje del tamaño debe reflejar el límite real configurado.
- Comprobar contenido, no solamente extensión o tipo informado por el navegador.
- Usar `PDF_PROTEGIDO` solo si se identificó ese problema; no afirmar que existe una contraseña ante cualquier fallo de lectura.
- Un PDF ilegible no es un error interno inesperado si su invalidez pudo identificarse de forma controlada.
- Si falla una carga, gestionar el retiro de temporales y la reversión correspondiente. No informar carga completada si faltó guardar su asociación.
- No revelar rutas de disco, nombres privados del bucket, claves de objetos ni enlaces firmados dentro del error.

## 7. Catálogo de acceso y autenticación

Estos códigos se implementarán cuando corresponda integrar autenticación y permisos. No son una instrucción para cambiar el orden de trabajo del ciclo.

| HTTP | Código | Mensaje principal |
|---|---|---|
| 401 | `AUTENTICACION_REQUERIDA` | Inicia sesión para continuar. |
| 401 | `SESION_VENCIDA` | Tu sesión venció. Inicia sesión nuevamente. |
| 401 | `CREDENCIALES_INVALIDAS` | No se pudo iniciar sesión. Revisa tus datos de acceso. |
| 403 | `ACCESO_DENEGADO` | No tienes permiso para realizar esta acción. |
| 403 | `AREA_NO_AUTORIZADA` | Esta operación no está disponible para tu área. |
| 403 | `CASO_NO_AUTORIZADO` | No tienes permiso para realizar esta operación en el caso seleccionado. |
| 403 | `COORDINACION_REQUERIDA` | Esta acción requiere permisos de coordinación del área. |
| 400 | `ENLACE_RECUPERACION_INVALIDO` | El enlace de recuperación no es válido o ya venció. Solicita uno nuevo. |
| 429 | `DEMASIADOS_INTENTOS` | Se realizaron demasiados intentos. Espera antes de volver a intentarlo. |

No indicar durante el inicio de sesión si un usuario existe, cuál dato de acceso falló o si una cuenta particular está inactiva. Usar el mensaje genérico correspondiente. Cuando ocultar un expediente sea necesario, responder 404 en lugar de confirmar su existencia con un error de permisos.

## 8. Catálogo técnico y de disponibilidad

| HTTP | Código | Mensaje principal |
|---|---|---|
| 400–499 | `SOLICITUD_RECHAZADA` | No se pudo completar la solicitud. Revisa los datos o comunícate con soporte e indica el número de solicitud. |
| 406 | `FORMATO_RESPUESTA_NO_ADMITIDO` | La operación no puede entregar la información en el formato solicitado. |
| 408 | `SOLICITUD_NO_COMPLETADA_A_TIEMPO` | No se terminó de recibir la solicitud a tiempo. Verifica su estado antes de volver a enviarla. |
| 409 | `CLAVE_OPERACION_REUTILIZADA` | Esta solicitud reutiliza un identificador de operación con datos diferentes. Revisa la operación antes de continuar. |
| 412 | `CONDICION_ACTUALIZACION_NO_CUMPLIDA` | El registro ya no cumple las condiciones para este cambio. Vuelve a consultarlo antes de guardar. |
| 500 | `PROCESAMIENTO_FALLIDO` | No se pudo completar el procesamiento. Comunícate con soporte e indica el número de solicitud. |
| 502 | `RESPUESTA_SERVICIO_INVALIDA` | Un servicio necesario devolvió una respuesta no válida. Inténtalo más tarde. |
| 503 | `RESULTADO_OPERACION_INCIERTO` | No se pudo confirmar si la operación se completó. Consulta su estado antes de volver a enviarla. |
| 404 | `RUTA_NO_ENCONTRADA` | No se encontró la operación solicitada. |
| 405 | `METODO_NO_PERMITIDO` | La operación solicitada no admite esta acción. |
| 410 | `OPERACION_RETIRADA` | Esta operación ya no está disponible. Actualiza la página o comunícate con soporte. |
| 413 | `SOLICITUD_DEMASIADO_GRANDE` | La información enviada supera el tamaño permitido. |
| 429 | `DEMASIADAS_SOLICITUDES` | Se realizaron demasiadas solicitudes. Espera un momento antes de continuar. |
| 503 | `SERVICIO_NO_DISPONIBLE` | El servicio no está disponible temporalmente. Inténtalo más tarde. |
| 503 | `BASE_DATOS_NO_DISPONIBLE` | No se puede consultar ni guardar información en este momento. Inténtalo más tarde. |
| 503 | `CONFIGURACION_INCOMPLETA` | Esta función todavía no está disponible. Comunícate con la persona administradora. |
| 504 | `TIEMPO_ESPERA_AGOTADO` | La operación está tardando más de lo esperado. Consulta su estado antes de volver a enviarla. |
| 500 | `ERROR_INTERNO` | Ocurrió un problema inesperado. Comunícate con soporte e indica el número de solicitud. |

- Los códigos de esta tabla describen cómo manejar una condición **si la funcionalidad ya existe**. No crear soporte de ETag, claves de idempotencia, negociación de formatos ni trabajos asíncronos por el solo hecho de que estén catalogados.
- `SOLICITUD_RECHAZADA` es el respaldo para un HTTP 4xx confiable no clasificado; `estado` conserva el HTTP recibido del framework. Es la única entrada del catálogo con rango HTTP en lugar de un estado fijo. No usarlo para esconder un error de programación como error del usuario.
- `PROCESAMIENTO_FALLIDO` aplica a un fallo técnico identificado de un proceso existente y sin resultado incierto de escritura. Un rechazo de negocio del proceso utiliza su código específico; si no se identifica una causa, `ERROR_INTERNO`.
- Ante un proveedor externo, no reenviar ciegamente su estado HTTP, código, mensaje o cuerpo. Por ejemplo, un 401 del bucket por credenciales del servidor no implica que la sesión de la beneficiaria venció. Mapear según la causa local conocida; si el intermediario recibe una respuesta inválida, usar 502.
- Reservar 504 para un tiempo de espera del servicio intermediario o de una dependencia. Un agotamiento interno del servidor no se transforma automáticamente en 504: clasificar según la causa conocida, o usar 500/503.
- Clasificar como `BASE_DATOS_NO_DISPONIBLE` los fallos reconocidos de conectividad/disponibilidad. Una consulta con un error de programación no debe disfrazarse de una caída temporal de la BD.
- `METODO_NO_PERMITIDO` presupone que el servidor identifica una ruta existente para otro método. Si el framework responde 404 por defecto, se necesita una decisión/implementación central; no fabricar un 405 en cada controlador.
- Una respuesta HTML de un intermediario, una desconexión o un fallo previo al servidor puede escapar del formato. El cliente debe soportar esa situación según la sección siguiente.

Ejemplo:

```json
{
  "estado": 500,
  "codigo": "ERROR_INTERNO",
  "mensaje": "Ocurrió un problema inesperado. Comunícate con soporte e indica el número de solicitud.",
  "errores": [],
  "idSolicitud": "SOL-c73a10d82b49"
}
```

## 9. Errores que debe presentar el cliente cuando no recibe el contrato

La pantalla puede crear localmente este mismo objeto para su manejo interno:

```json
{
  "estado": null,
  "codigo": "RESPUESTA_NO_RECIBIDA",
  "mensaje": "No se recibió confirmación de la operación. Consulta si se completó antes de volver a enviarla.",
  "errores": [],
  "idSolicitud": null
}
```

| Código local | Cuándo usarlo | Mensaje |
|---|---|---|
| `SIN_CONEXION` | No se pudo establecer comunicación; no se conoce un estado HTTP | No se pudo conectar con el sistema. Revisa tu conexión e inténtalo nuevamente. |
| `RESPUESTA_NO_RECIBIDA` | La petición pudo haberse enviado, pero no llegó confirmación o venció la espera del cliente | No se recibió confirmación de la operación. Consulta si se completó antes de volver a enviarla. |
| `RESPUESTA_NO_VALIDA` | Llegó una respuesta que no se puede interpretar según el contrato | No se pudo interpretar la respuesta del sistema. Inténtalo nuevamente o comunícate con soporte. |

Si se recibió un estado HTTP real pero el cuerpo no tiene el formato esperado, se puede conservar ese estado en `estado`. Si existe una cabecera de correlación válida del servidor, puede conservarse su identificador. No inventar ninguno de los dos.

Un fallo de red no demuestra por sí solo que el usuario no tiene Internet: también puede haber un problema de servidor o de conexión. El mensaje debe describir que no se pudo conectar con el sistema, sin diagnosticar una causa no comprobada.

No afirmar «no se guardó» si la conexión se perdió después de enviar una escritura. La operación puede haber terminado en la BD. No repetir automáticamente altas, cargas o movimientos salvo que exista un mecanismo de idempotencia aprobado que evite duplicados.

## 10. Situaciones que NO son errores

- Una búsqueda válida sin coincidencias: HTTP 200 con lista vacía. La pantalla muestra «No se encontraron resultados».
- Un listado vacío de documentos o seguimientos: HTTP 200 con lista vacía.
- Un formulario nuevo sin texto clínico/jurídico, cuando el borrador permite esos campos vacíos.
- Un dato opcional desconocido: usar null según el contrato, sin inventar una respuesta.
- Una corrección autorizada de una referencia confirmada: no bloquearla por el solo hecho de estar confirmada.

Las listas de nuestra asignación usan el formato acordado `{datos,pagina,limite,total}`. No envolverlas en el sobre de error ni cambiar otras respuestas exitosas al aplicar esta guía.

## 11. Adaptación técnica en NestJS

Responsabilidad transversal: conviene que una persona integre la infraestructura común y que cada área utilice el catálogo, para evitar filtros globales distintos y respuestas incompatibles.

1. Generar el identificador de solicitud mediante middleware/interceptor central.
2. Normalizar errores en un filtro global que cubra errores HTTP conocidos y excepciones inesperadas.
3. Configurar `ValidationPipe`/su `exceptionFactory` para producir los detalles `{campo,mensaje}` en español, incluyendo campos anidados y propiedades desconocidas.
4. Desde los servicios, expresar errores de negocio con códigos de este catálogo. El controlador no debe reconstruir el sobre de error manualmente en cada método.
5. Adaptar errores de TypeORM/PostgreSQL y de carga de archivos de forma controlada.
6. Si no se identifica una causa conocida, devolver `ERROR_INTERNO` y registrar el detalle técnico de manera restringida.
7. Actualizar OpenAPI, Postman y los clientes junto con el cambio para no romper su interpretación.

No enviar directamente al usuario:

- `error.message` de una excepción desconocida;
- stack trace o nombres de archivos internos;
- consulta SQL, parámetros, restricciones o códigos PostgreSQL;
- cadenas de conexión, credenciales, tokens o claves;
- contenido de formularios, diagnósticos, expedientes o PDFs.

### Orientación para adaptar errores PostgreSQL

Estos códigos son detalles internos; no aparecen en las respuestas a usuarios.

| Señal interna | Manejo |
|---|---|
| Unicidad `23505` | `REGISTRO_DUPLICADO` solo si se reconoce una regla de unicidad esperada; no revelar el nombre de la restricción. |
| Clave foránea `23503` | 404 si el recurso solicitado no existe y procede informarlo; 409 `RELACION_INCOMPATIBLE` para una asociación inválida conocida. Clasificar según la operación. |
| Restricción `23514` | Validación o conflicto de negocio únicamente si la restricción está identificada y tiene un mensaje público aprobado. |
| Conversión de tipo `22P02` | Si procede de una entrada del cliente reconocida, responder con validación; los IDs deben validarse antes de consultar. Si es un error de código, 500. |
| Excepción de trigger `P0001` | No traducir todas a un mismo conflicto. Reconocer la regla de negocio concreta y mantener un mapa de mensajes públicos; lo desconocido es error interno. |
| Serialización `40001` / interbloqueo `40P01` | Revertir la transacción. Solo hacer reintentos acotados si son seguros. De persistir, clasificar como indisponibilidad temporal; no inventar un conflicto de versión. |
| Conexión no disponible | `BASE_DATOS_NO_DISPONIBLE` cuando la causa es conocida. |

### Adaptación documental

- Falta de archivo: `ARCHIVO_REQUERIDO`.
- Tamaño excedido detectado por Multer u otra capa: `ARCHIVO_DEMASIADO_GRANDE`.
- Tipo no admitido: `TIPO_ARCHIVO_NO_PERMITIDO`.
- Contenido ilegible identificado: `PDF_INVALIDO`.
- PDF cifrado identificado: `PDF_PROTEGIDO`.
- Cantidad de archivos, nombres de partes o estructura multipart incorrectos: `FORMATO_INVALIDO`, con una indicación en español.
- Fallo de disco/bucket: identificar la causa. Una indisponibilidad temporal conocida usa 503; un error inesperado de código/configuración no debe convertirse automáticamente en un error del PDF enviado por el usuario.

## 12. Comportamiento de la pantalla

- Mostrar el mensaje principal y señalar los campos incluidos en `errores`.
- Conservar los datos escritos cuando una validación o un guardado falla.
- Tras un conflicto de versión, ofrecer consultar la versión vigente sin descartar silenciosamente lo que el usuario escribió.
- Tras una sesión vencida, solicitar iniciar sesión conforme al flujo de autenticación aprobado cuando exista.
- Tras un fallo temporal de una consulta, permitir reintentar sin mostrar contenido anterior como si fuera recién consultado.
- Tras una escritura de resultado incierto, permitir verificar el registro antes de repetir la operación.
- Evitar botones que reintenten indefinidamente o dupliquen envíos mientras una petición está en curso.
- Mostrar el número de solicitud para soporte sin presentar el error técnico interno.
- No usar solo color para comunicar un error; acompañarlo de texto.
- Si el servidor envía un error que el cliente no reconoce, mostrar un mensaje genérico en español. No imprimir cuerpos HTML, objetos completos ni stack traces.

## 13. Registros técnicos e historial institucional

Los registros de errores ayudan a diagnosticar fallos. No sustituyen la auditoría de modificaciones de expedientes ni la hoja evolutiva.

Registrar de forma restringida lo necesario para correlacionar y diagnosticar: identificador de solicitud, fecha, operación/ruta de plantilla, estado, código público y causa técnica controlada.

No registrar indiscriminadamente cuerpos de peticiones, archivos, contraseñas, tokens, CUI, diagnósticos o respuestas completas. Evitar guardar URL con datos personales o parámetros sensibles. Los datos anteriores/nuevos de una corrección pertenecen al mecanismo institucional de auditoría con sus permisos, no a un log general de errores.

## 14. Pruebas mínimas de integración del contrato

Al aplicar este documento a un módulo, verificar los casos pertinentes a sus rutas:

- Un campo obligatorio ausente y varios campos inválidos: mensajes españoles y `errores` correctos.
- Identificador mal formado frente a identificador válido inexistente: 400 frente a 404.
- Campos extra, incluidos anidados: no se ignoran silenciosamente si el contrato los prohíbe.
- Una corrección con versión antigua: 409 y sin pérdida de cambios ya guardados.
- Un conflicto de estado o vínculo: código adecuado y sin cambios parciales.
- Archivo ausente, tipo incorrecto, PDF inválido y límite de carga: estados/códigos correspondientes.
- Recurso fuera de área/caso: no se revela información ni su existencia cuando deba ocultarse.
- Excepción inesperada: 500 genérico, mismo identificador de solicitud en la respuesta y el registro técnico, sin datos internos expuestos.
- Búsqueda sin resultados: éxito con lista vacía.
- Respuesta del servidor: las cinco propiedades, tipos correctos y `estado` igual al HTTP real.
- Fallo de red del cliente: formato local y sin repetición automática de escrituras inciertas.

No declarar que el formato está implementado únicamente porque el proyecto compila. Se necesita probar las respuestas HTTP reales.

## 15. Secuencia de aplicación para el asistente de IA del integrante

Cuando tu usuario te autorice a aplicar este contrato:

1. Lee las instrucciones del repositorio y revisa el manejo de errores ya existente.
2. Identifica la infraestructura común para no instalar un segundo filtro o formato incompatible.
3. Mantén las rutas, asignación por persona, reglas institucionales y SQL vigentes.
4. Mapea los errores de tu módulo al catálogo. No expongas los mensajes crudos de librerías o BD.
5. Usa todos los textos visibles en español; conserva los nombres de campos públicos ya acordados.
6. No adelantes autenticación, reportes ni otras funcionalidades diferidas por el mero hecho de que sus errores estén catalogados.
7. Prueba los casos pertinentes y actualiza contratos y ejemplos de tu módulo.
8. Documenta los códigos todavía no implementados, las diferencias con el comportamiento anterior y los acuerdos necesarios con el equipo.
9. Si falta un código, propón su incorporación a este documento en lugar de crear otro formato local.
10. No afirmes que todas las áreas cumplen el contrato si solo verificaste tu módulo.

**Texto sugerido para acompañar el archivo:**

> Este documento define el formato común de errores de Nuevos Horizontes. Revísalo junto con el código de nuestra asignación y, dentro del alcance que te indique, adapta sus respuestas a este contrato. Mantén mensajes en español, no cambies rutas ni reglas de negocio y señala cualquier conflicto con la infraestructura compartida antes de duplicarla.


## 16. Matriz de cobertura por capa y escenario

Esta matriz evita huecos fuera de los controladores. Cada integrante identifica cuáles filas aplican a su módulo y quién atiende las que corresponden a infraestructura. No implica crear funcionalidades adicionales.

| Punto de fallo | Tratamiento obligatorio | Respuesta o resultado esperado |
|---|---|---|
| JSON mal formado, codificación o cuerpo no interpretable | Capturar errores del parser, antes del DTO; no devolver su texto crudo ni fragmentos del cuerpo | 400 `JSON_INVALIDO` o `FORMATO_INVALIDO` según la causa |
| Tipo de contenido de petición no admitido | Distinguir formato de petición y formato del archivo | 415 `TIPO_CONTENIDO_NO_ADMITIDO`; para un adjunto no PDF, `TIPO_ARCHIVO_NO_PERMITIDO` |
| Cuerpo grande o límites multipart | Normalizar errores del parser/cargador; limitar el consumo de memoria | 413 del catálogo; partes/cantidad incorrectas: 400 `FORMATO_INVALIDO` |
| Cabeceras/parámetros/filtros incorrectos | Validación controlada; nunca ejecutar SQL dinámico basado en sus valores | 400 del catálogo; una condición de actualización existente que falla: 412 |
| Ruta/método/formato de salida | Normalizar el rechazo central del framework cuando sea interceptable | 404/405/406 del catálogo; sin crear controladores alternativos por área |
| Falla de acceso o recurso ajeno | No consultar o devolver información fuera del ámbito; ocultar existencia cuando corresponda | 401/403 o 404 seguro |
| Restricción conocida de dominio o BD | Revertir cambios relacionados y mapear una causa reconocida | 409/422 específico; causa desconocida: 500 |
| Bloqueo, concurrencia o pérdida de versión | Respetar control de versión y bloqueo existente; reintentos solo acotados y seguros | 409 de versión; indisponibilidad identificada: 503 |
| Pool de conexiones agotado o BD desconectada | Liberar recursos y distinguir indisponibilidad de un defecto de consulta | 503 de BD/servicio; si el guardado quedó incierto, código de resultado incierto |
| Error de commit o pérdida de conexión al guardar | No afirmar reversión sin haberla confirmado; no repetir la escritura automáticamente | 503 `RESULTADO_OPERACION_INCIERTO` si hay canal; si no, error local |
| Fallo al revertir o limpiar un temporal | Conservar la causa original y registrar el fallo secundario; no anunciar que se limpió/revirtió si no se sabe | Respuesta segura según certeza; gestionar recuperación posterior, sin borrar archivos ajenos |
| Disco lleno, permisos de archivo o bucket inaccesible | Clasificar disponibilidad/configuración sin revelar rutas; no culpar al documento si es problema del servidor | 503 conocido o 500; nunca devolver éxito de carga incompleta |
| PDF cifrado, vacío, corrupto o extensión engañosa | Validar contenido real y clasificar solo causas comprobadas | 400/415/422 específicos |
| Archivo almacenado desaparecido o con checksum incorrecto | No entregar un archivo diferente ni continuar una descarga corrupta | 404 o 500 de integridad; registro técnico restringido |
| Fallo de un proveedor de archivos, correo u otro servicio existente | Traducir su fallo a la operación local y no copiar credenciales/errores del proveedor | 502/503/504 conocido o 500 seguro; no prometer que un envío no ocurrió si es incierto |
| Serialización de respuesta, bigint/fecha/JSON inválidos o referencias circulares | Tratar defectos de representación del servidor como técnicos, no de datos del usuario | 500 `ERROR_INTERNO`; nunca convertir silenciosamente un ID grande en un número impreciso |
| Archivo/stream iniciado y luego interrumpido | Si todavía no salieron cabeceras, usar el sobre; si ya salieron, no escribir un segundo cuerpo JSON | Cerrar/interrumpir el canal, registrar correlación y hacer que el cliente detecte contenido incompleto |
| Cliente cancela, navega o desconecta | Liberar recursos cuando sea seguro; no cancelar ficticiamente una escritura que ya pudo terminar | No intentar escribir sobre una conexión cerrada; resultado puede ser incierto |
| Trabajos de reporte/exportación o procesos asíncronos, cuando existan | Una aceptación inicial no prueba que el procesamiento terminó; persistir/consultar el resultado según contrato existente | Estado fallido del trabajo con error seguro; no inventar nuevos estados o endpoints |
| Promesa rechazada o fallo fuera de una petición | Manejarlo en el límite correspondiente; registrar, liberar y detener/reiniciar de forma controlada cuando no sea seguro continuar | No hay respuesta HTTP si no hay petición; no seguir sirviendo como saludable si el proceso está inutilizable |
| Error al arrancar por configuración, conexión o puerto ocupado | Registrar mensaje operacional seguro; no imprimir secretos; no declarar servidor disponible | Salida/estado de salud fallido; el cliente aplica respaldo de conexión |
| Proxy, TLS, DNS, CORS, red o servidor caído | El backend puede no ver la petición o no poder controlar la respuesta | El cliente normaliza lo observable; no inventar causa exacta ni pedir desactivar protecciones |
| Error en la propia normalización, traducción o registro técnico | El respaldo no debe depender del componente que falló | Sobre mínimo 500 con mensaje español seguro, correlación del servidor y sin detalles internos |
| Causa futura no enumerada | Aplicar árbol de decisión y respaldo universal | Nunca mostrar una excepción cruda; proponer un nuevo código solo si aporta una acción distinta |

### Procesamiento por lotes o éxito parcial

Si ya existe una operación de varios elementos, respetar si su contrato es atómico o admite resultados parciales. No declarar éxito total cuando falló una parte; tampoco afirmar que nada cambió si algunas escrituras quedaron confirmadas. En contratos que permiten errores por elemento, cada elemento fallido puede contener el sobre de esta guía con la correlación adecuada, pero no se cambia por este documento el formato exitoso ni la atomicidad del endpoint.

### Estado de la escritura y recuperación

| Lo que se sabe | Qué comunicar y hacer |
|---|---|
| La validación rechazó antes de escribir | Presentar los campos/reglas; mantener lo ingresado |
| Se confirmó la reversión completa | Presentar el error correspondiente; solo reintentar si la causa y la operación lo permiten |
| Se confirmó la escritura, pero falló un efecto secundario | No repetir la escritura principal ni informar que no se guardó; reportar/gestionar el efecto secundario conforme al contrato existente |
| No se sabe si terminó | Mensaje de resultado incierto; ofrecer consulta/verificación; no duplicar la operación |

La auditoría institucional obligatoria forma parte de la operación que deba proteger: si falla, no declarar exitosa una modificación que requería ese historial. Un fallo de telemetría no debe alterar automáticamente una escritura ya confirmada. Mantener esa distinción según la arquitectura aprobada.

## 17. Respaldo del cliente y de errores del propio cliente

Además de la sección 9:

- Capturar rechazos de peticiones y errores de interpretación; un cuerpo HTML o un objeto desconocido nunca se imprime como mensaje de soporte.
- Para un código desconocido de una respuesta que sí tenga estructura válida, usar un mensaje público genérico en español. No confiar en un mensaje ajeno al catálogo porque parezca legible.
- Proteger el renderizado de errores con una representación mínima que no dependa de la vista que falló. Un error de la pantalla no se convierte en un 500 recibido del servidor: el `estado` local es null si no existe uno real.
- Cancelar una consulta al salir de una pantalla no debe mostrar un aviso engañoso de caída del sistema ni sobrescribir una respuesta más nueva con una antigua.
- Si se agota el almacenamiento local, falla una descarga del navegador o se bloquea una ventana de impresión, informar del fallo local sin afirmar que la BD perdió información. No intentar guardar datos sensibles en almacenamiento local como solución improvisada.
- Los mensajes de respaldo locales usan el mismo sobre interno con `estado`/`idSolicitud` null cuando no se conocen. No emitir una petición al backend solo para fabricar un identificador de error.

| Código local adicional | Mensaje seguro |
|---|---|
| `ERROR_PANTALLA` | No se pudo mostrar esta sección. Vuelve a abrirla o comunícate con soporte. |
| `DESCARGA_NO_COMPLETADA` | No se pudo completar la descarga. Comprueba el archivo antes de volver a intentarlo. |
| `IMPRESION_NO_INICIADA` | No se pudo iniciar la impresión. Revisa si el navegador bloqueó la ventana e inténtalo nuevamente. |
| `ALMACENAMIENTO_LOCAL_NO_DISPONIBLE` | No se pudo conservar la información temporal en este dispositivo. Mantén la pantalla abierta y comunícate con soporte. |

Estos códigos no implican implementar descarga/impresión u operación sin conexión en este ciclo. Se aplican solo a funciones existentes. La aplicación no puede reemplazar todos los avisos nativos del navegador o sistema operativo; sus propios mensajes sí deben estar en español.

## 18. Contrato verificable por herramientas

Este esquema describe únicamente los errores **emitidos por el servidor**. Los errores locales de las secciones 9 y 17 tienen una variante con `estado` e `idSolicitud` nulos cuando corresponda.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Error público de Nuevos Horizontes",
  "type": "object",
  "additionalProperties": false,
  "required": ["estado", "codigo", "mensaje", "errores", "idSolicitud"],
  "properties": {
    "estado": {"type": "integer", "minimum": 400, "maximum": 599},
    "codigo": {"type": "string", "pattern": "^[A-Z][A-Z0-9_]*$", "minLength": 1},
    "mensaje": {"type": "string", "minLength": 1},
    "errores": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["campo", "mensaje"],
        "properties": {
          "campo": {"type": "string", "minLength": 1},
          "mensaje": {"type": "string", "minLength": 1}
        }
      }
    },
    "idSolicitud": {"type": "string", "minLength": 1}
  }
}
```

El esquema comprueba la forma; **no basta por sí solo**. Las pruebas también deben verificar:

- que `codigo` pertenece al catálogo vigente;
- que `estado` coincide con el HTTP real y con el código (salvo el rango documentado de `SOLICITUD_RECHAZADA`);
- que los mensajes proceden de traducciones públicas controladas en español;
- que el identificador fue generado por el servidor y no contiene identidad personal;
- que no hay valores rechazados, nombres de restricciones, trazas, consultas ni secretos;
- que no se devuelve éxito ni se pierde integridad/historial cuando la operación falla;
- que se cubren respaldo universal, excepciones no convencionales, fallos de serialización/parser, fallos secundarios de limpieza y respuesta iniciada;
- que el cliente tolera red caída, respuesta desconocida, cancelación y resultado incierto.

Los nombres técnicos `$schema`, `type`, `properties` y similares son palabras del formato JSON Schema, no textos visibles para la persona usuaria. No traducir las palabras reservadas de herramientas, cabeceras o protocolos: traducir los mensajes y nombres públicos que este contrato define en español.

## 19. Definición de terminado para la IA

Antes de declarar terminado el trabajo autorizado:

- [ ] Inventariaste rutas y puntos de fallo reales del módulo, incluidas las capas previas y posteriores al controlador.
- [ ] Cada fallo conocido tiene un mapeo explícito o usa el respaldo documentado.
- [ ] Existe un respaldo ante errores desconocidos y ante un fallo del propio normalizador, sin depender de la disponibilidad de logs o de la BD.
- [ ] La misma petición conserva su identificador y el HTTP coincide con el cuerpo.
- [ ] No alteraste rutas, permisos, campos obligatorios, reglas institucionales ni respuestas exitosas ajenas al alcance.
- [ ] Probaste validación, negocio, recursos ajenos, concurrencia, reversión y resultados inciertos según las operaciones existentes.
- [ ] Probaste errores del parser/cargador y una excepción inesperada, además del camino correcto.
- [ ] Probaste el comportamiento del cliente frente a una respuesta no normalizada o ausente.
- [ ] Documentaste qué hace cada capa si el proceso o la conexión dejan de estar disponibles.
- [ ] Informaste lo verificado y lo pendiente; no equiparaste tener un catálogo a tenerlo implementado.

**Regla de cobertura final:** esta guía no promete adivinar todos los fallos futuros ni garantizar la entrega de un JSON si no hay proceso/red disponible. Sí exige que toda categoría tenga un responsable y un tratamiento: error específico conocido, respaldo seguro del servidor, cierre controlado si ya salió la respuesta, manejo operacional si no hay petición o respaldo del cliente si no recibe una respuesta válida.

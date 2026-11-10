# Contrato de errores implementado en persona 3

Fecha: 30 de octubre de 2026. Contrato público: `../CONTRATO_ERRORES_API.md`, versión 1.1.

## Formato

Cada error HTTP de la aplicación tiene exactamente `estado`, `codigo`, `mensaje`, `errores` e `idSolicitud`. El estado coincide con HTTP. Los mensajes públicos se toman del catálogo en español. Los detalles tienen `campo` y `mensaje`; no incluyen valores recibidos. El servidor genera un UUID por solicitud, ignora el identificador enviado por el cliente y devuelve el mismo valor en `X-Id-Solicitud` y en el cuerpo del error.

No se cambia el formato de respuestas exitosas, las rutas, las reglas funcionales o el SQL. PDF usa ahora los estados definidos por el contrato: 415 para tipo no permitido y 422 para contenido inválido o protegido, en lugar del antiguo 400.

## Organización para que el equipo lo reutilice

- `src/common/errors/catalogo.ts`: catálogo público de 66 códigos y mensajes. Que un código exista no significa que su función futura esté implementada.
- `error-api.ts`: `ErrorApi(codigo, errores?)` para errores conocidos. Nunca incluir excepciones, datos privados o textos SQL en los detalles.
- `validacion.ts`: validación de DTO y propiedades desconocidas con mensajes españoles y nombres anidados.
- `errores.filter.ts`: normalización global, respaldo seguro para fallos inesperados y manejo de respuestas ya iniciadas.
- `errores.module.ts`: registro único de APP_FILTER y APP_PIPE; importado una sola vez en AppModule.
- `main.ts`: middleware de correlación antes de inicializar los parsers. Si otro integrante usa un arranque distinto, debe llamar `configurarTransporteApi(app)` antes de `listen` o `init`; registra correlación, parsers y adaptación de errores de lectura del cuerpo.

Al integrar, reutilizar este módulo: no registrar un segundo filtro ni mantener un ValidationPipe adicional que produzca textos distintos. Los servicios nuevos deben lanzar ErrorApi para sus reglas conocidas. Los errores HTTP no clasificados usan un mensaje seguro; los fallos desconocidos, ERROR_INTERNO. No se traducen todos los 5xx a indisponibilidad.

## Fallos cubiertos en nuestras APIs

| Situación | Código o tratamiento |
|---|---|
| DTO, fechas, campos extra y detalle de confirmación | DATOS_INVALIDOS con detalles en español |
| Identificador en ruta inválido | IDENTIFICADOR_INVALIDO |
| Registro ausente o sujeto incompatible al consultar | REGISTRO_NO_ENCONTRADO sin revelar otro expediente |
| Ruta inexistente | RUTA_NO_ENCONTRADA |
| Cambio concurrente | VERSION_DESACTUALIZADA, sin sobrescribir |
| Ficha no confirmada, referencia ya confirmada o estado incompatible | Código específico de formulario/estado |
| Corrección sin campos | SOLICITUD_SIN_CAMBIOS |
| Área y coordinación | AREA_NO_AUTORIZADA / COORDINACION_REQUERIDA; contexto local, todavía sin sesión real |
| Configuración local incompleta | CONFIGURACION_INCOMPLETA |
| JSON inválido, cuerpo grande y multipart incorrecto | JSON_INVALIDO / SOLICITUD_DEMASIADO_GRANDE / FORMATO_INVALIDO |
| PDF ausente, vacío, tipo, límite, ilegible o protegido | Código documental específico; límite de 20 MiB compartido entre cargador y servicio |
| Disco no disponible | ALMACENAMIENTO_NO_DISPONIBLE para causas de sistema reconocidas |
| FK de profesional/capturista reconocida | RELACION_INCOMPATIBLE después de revertir |
| Serialización o interbloqueo | BASE_DATOS_NO_DISPONIBLE; sin reintento automático |
| Conexión de BD reconocida | BASE_DATOS_NO_DISPONIBLE en lecturas o fallos sin escritura incierta |
| Commit perdido o rollback no confirmado | RESULTADO_OPERACION_INCIERTO; consultar antes de repetir |
| Restricción, trigger o fallo desconocido | ERROR_INTERNO; no inferir una regla por fragmentos del mensaje SQL |

## Documentos y certeza del guardado

Si falla la escritura del archivo, se intenta retirar su copia parcial. Si falla la operación de BD con reversión conocida, se intenta retirar el PDF recién creado. Si no se sabe si el commit terminó, el PDF se conserva para conciliación: no se borra un archivo que podría estar registrado. Un fallo de limpieza queda advertido para revisión; no se implementa un proceso automático de conciliación ni se afirma que exista uno.

Los logs de error contienen correlación, estado, código y clasificación técnica mínima. No guardan cuerpos, URL, SQL, documentos, mensajes crudos ni pilas con información privada. El historial institucional de cambios conserva su mecanismo existente.

## Cliente, documentación y pruebas

La pantalla de laboratorio presenta mensajes, detalles y número de solicitud. Tiene respaldo para fallo de red, respuesta no interpretable y código desconocido. No borra formularios ni reintenta escrituras automáticamente. `public/errores-api.js` se genera desde el mismo catálogo mediante `pnpm postman:persona3`.

OpenAPI documenta el sobre ErrorApi y estados de error. `postman/Errores.postman_collection.json` permite probar ID inválido, ruta inexistente y JSON inválido. La prueba HTTP comprueba también las cinco propiedades y la cabecera en los fallos de los flujos anteriores.

Ejecutar `pnpm test:persona3` con los módulos de las tres áreas presentes en un checkout temporal local. Cada rama de área conserva únicamente sus controladores específicos, además del soporte común de evolución y documentos. No se necesita otra rama publicada.

## Límites reales

- Un corte de conexión, un proceso terminado o un proxy ajeno pueden impedir la llegada del JSON. La pantalla aplica su respaldo; la API no puede prometer entrega en esos casos.
- Si ya se enviaron cabeceras, se cierra la respuesta sin intentar un segundo JSON.
- Nest puede devolver 404 ante un método que no tiene manejador; no se inventa un 405 en cada controlador.
- Autenticación definitiva sigue diferida. El catálogo no implementa sesiones, reportes, otros módulos ni funciones de compañeros.
- Las discrepancias entre BD y mockups siguen pendientes de revisión; este cambio no ejecuta migraciones.

## Resultado de verificación

37 pruebas aprobadas, cero fallos: 32 escenarios de integración y 5 unitarios. Newman: 17 peticiones y 27 comprobaciones entre las dos colecciones. Cada rama se compila antes de publicar. No se cambió main ni se aplicaron migraciones.

# Resultado del laboratorio local y feedback

Fecha: 31 de octubre de 2026. Fuente: rama schema-persona3, commit base 2bc54fa. El trabajo se validó primero en una copia local separada. Esta entrega publica código y migraciones por autorización del usuario; no modifica la BD compartida.

## Resultado

Se creó la BD local desde SQL 01+02 y migraciones 003–007. Después se aplicó una nueva migración local 008. La base resultante tiene **70 tablas**, incluyendo **5 tablas de dominio nuevas**, más columnas y restricciones de apoyo. No se eliminaron tablas ni se duplicaron beneficiarias, niños o expedientes.

Las 24 columnas de 007 se conservan. La nueva 008 añade seis columnas a tablas existentes: cinco documentales y una referencia a ficha inicial. Añade una opción local de estado Social y funciones/índices/restricciones de consistencia. No se reescribieron migraciones originales del grupo.

## 1. Diferencias del mockup resueltas en la copia

| Necesidad | Solución local | Comprobación |
|---|---|---|
| Riesgos seleccionables de Social | `riesgo_social` y `ficha_social_riesgo`; cuatro opciones literales del mockup, selección y contador calculado. Se conserva el relato de riesgos. | Selección, retiro sin borrado físico, conteo, historial y dos peticiones concurrentes. |
| Personas que llevan/recogen | `autorizacion_traslado_guarderia`, reutilizando `familiar_declarado`; permisos separados y desactivación conservando historial. | Alta de responsable, permisos diferenciados, rechazo de permisos vacíos y FK compuesta que impide usar una persona de otra ficha. |
| Título propio del documento | `documento_area.nombre_documento`; categoría sigue indicando tipo. Si no hay título, se muestra categoría. | Subida, consulta y conservación del título en una nueva versión. |
| Revisión documental | Catálogo `estado_revision_documento`, estado BORRADOR/REVISADO, revisor, fecha y versión de metadatos. | Autor/fecha, historial, revisión, conflicto de versión y rechazo de un PDF dañado. |
| Ficha inicial concreta | `formulario_area.ficha_inicial_id`, opcional y con FK compuesta al mismo expediente. | Rechazo de admisión ajena y persistencia del vínculo válido. |
| Casos asignados | `asignacion_caso_area`, con referencias a expediente, área y usuario, unicidad y auditoría. | Estructura creada. La autenticación y su aplicación efectiva como permiso siguen pendientes; no se presenta la tabla como un control de acceso terminado. |
| Cierre de Social | Estado CERRADA y operación experimental con fecha y resultados; la fecha no puede preceder la atención. | Fecha imposible, fecha anterior, cierre válido y rechazo de edición por el endpoint después de cerrar. |

Las tablas de riesgos son propias de Social porque todavía no se ha acreditado que `situacion_riesgo` de admisión tenga las mismas opciones y significado. La decisión de unificarlas, si procede, debe hacerse con el grupo; no se tradujeron relatos históricos a casillas automáticamente.

## 2. Problemas de código corregidos localmente

- El aprovisionamiento ahora aplica todas las migraciones 003–008, además del SQL base, tanto en pruebas como en la demostración nueva.
- El resumen Social mantiene los campos que leía la pantalla y ofrece también `detalle`. El contador de riesgos consulta selecciones reales.
- Los identificadores bigint se convierten a texto en SQL antes de construir el JSON. Se probó `9007199254740993` sin redondeo.
- La carga multipart acepta título, fecha y descripción nuevos y respeta textos de hasta 20000 caracteres; sus límites en bytes ya no contradicen el DTO.
- Las fechas de las columnas `date` se validan como fecha sin hora: no se acepta un timestamp para truncarlo silenciosamente.
- La edición experimental de referencias reutiliza la regla de destino/motivo obligatorios al estar confirmadas; no abre un segundo camino para vaciarlos.
- Se añadió revisión y consulta privada de PDF con verificación de tamaño y SHA-256, comprobación de área y protección del directorio de archivos.
- Una nueva versión documental exige motivo, conserva el título anterior cuando no se cambia y no permite dos sucesores de la misma versión.

## 3. Más inconsistencias detectadas en esta pasada

| Hallazgo | Riesgo concreto | Tratamiento en esta copia |
|---|---|---|
| `documento_anterior_id` solo comprobaba existencia | Se podía unir una versión con un documento de otra ficha. | FK compuesta de misma ficha y validación de cadena de versiones. |
| El contenido documental podía cambiarse editando metadatos | Era posible reemplazar hash, referencia al archivo u otros datos del PDF sin crear versión. | Trigger de inmutabilidad de contenido; una sustitución requiere nuevo documento/versionado. |
| Se podían crear dos versiones hijas del mismo documento | Dos peticiones simultáneas podían formar ramas ambiguas. | Restricción de sucesor único, bloqueo en orden consistente y prueba concurrente. |
| La referencia del archivo era una ruta absoluta | Mover el almacenamiento podía dejar la BD apuntando al directorio anterior. | Se guarda una clave relativa; el servidor resuelve y comprueba el directorio. Se probó reubicar los archivos sin actualizar filas. |
| Pruebas y demostración podían compartir carpeta privada | Archivos creados por pruebas podían mezclarse con los del demo, pese a usar bases distintas. | Cada cluster de pruebas tiene su carpeta; el demo mantiene otra persistente. |
| Un PDF podía marcarse revisado sin comprobar el archivo | Un archivo alterado físicamente podía figurar como revisado. | La revisión comprueba integridad antes del cambio de estado. |
| Un editor genérico podía saltarse reglas del servicio especializado | Una referencia confirmada podía perder destino desde el editor nuevo. | Se reutilizó la validación de referencia y se añadió una regresión. Este era un problema del prototipo local nuevo, no un defecto adicional atribuido al código previo del grupo. |

## 4. Cosas que siguen necesitando definición del equipo

1. **Cerrada es una propuesta local.** Se permitió probar el selector del mockup, pero falta aprobar quién cierra, si se reabre y cómo se corrige una ficha cerrada. No cambia el acuerdo del grupo de borrador/confirmado.
2. **Asignación no equivale a autenticación.** Se creó el soporte de datos, pero la identidad real, permisos por caso y roles deben conectarse en la fase final. Las variables de laboratorio no son una sesión institucional.
3. **Vigente y revisado no son lo mismo.** La implementación local considera vigente una versión revisada, no anulada y sin un sucesor activo. El equipo debe decidir si la versión revisada anterior sigue siendo vigente mientras la nueva está en borrador; no se presenta esa política como acordada.
4. **Número de proceso y relato social.** Deben aclarar si número de proceso es judicial (`numero_juicio`) o institucional (correlativo inicial), y si historia de vida equivale a `historia_violencia`. No se añadieron columnas duplicadas por esas etiquetas.
5. **Migraciones del demo existente.** El arranque inicial usa un marcador. Si se añade otra migración después, no debe suponerse que reiniciar una BD ya inicializada la aplica: hace falta un paso explícito de actualización y un control de migraciones antes de usar este patrón en el proyecto integrado.
6. **Rutas y filtros comunes.** Siguen pendientes de coordinación los prefijos `/api` y `/api/v1`, el contrato de carga de documentos y el registro único de filtros de errores entre integrantes.
7. **Cobertura global Postman.** El inventario previo de las ramas del grupo sigue señalando 23 endpoints sin petición; esta entrega incorpora nuestras colecciones, pero no completa funciones de otros integrantes.

## 5. Beneficiarias: pendientes que no resuelve agregar tablas

Los cuatro defectos reproducidos en `beneficiarias` siguen siendo asuntos del código de ese módulo: reversión incompleta del lote de hijos, residencia que pierde datos al cambiar solo un campo, confirmación que desconoce contenido normalizado e IDs anidados fuera de rango que llegan a SQL.

No se copiaron ni sobrescribieron sus servicios en nuestra implementación para ocultar esas diferencias. Sí se incluyeron sus migraciones 003–006 como parte de la BD local. Eso permite trabajar con la misma estructura, pero no significa que sus APIs estén integradas o corregidas aquí. El informe anterior conserva las pruebas y ubicaciones exactas.

Otro punto a coordinar: cuando los datos de identificación o residencia se sacan del JSON y van al perfil canónico, el frontend debe reconstruir la vista desde ese perfil al recargar. No debe interpretar una sección JSON vacía como que la persona perdió sus datos.

## 6. Evidencia y límites

- **54 pruebas aprobadas, 0 fallos**: 37 del contrato anterior y 17 escenarios adicionales, contra PostgreSQL local aislado. Se conservan las comprobaciones de rollback y concurrencia.
- Newman: 14 peticiones/21 comprobaciones del flujo P3 y 3/6 de errores. La colección PDF actualizada también pasó 1 petición/2 comprobaciones. Total entre colecciones ejecutadas: 18 peticiones y 29 comprobaciones.
- Navegador real: se abrió la pantalla local de Legal, se guardaron objetivo y normativa, se reinició el servidor y se recargó. Ambos siguieron guardados. También se mostró el PDF con sus metadatos. Evidencia en `evidencia-legal.png`.
- Exportación completa restaurada con éxito en otra BD local: 70 tablas, las cinco nuevas, un documento y el valor guardado de normativa. El PDF referenciado se copió y se verificó por hash.
- Los endpoints locales nuevos se probaron por HTTP. La prueba manual del navegador cubrió Legal; no se declara probado visualmente todo el frontend del grupo.
- No se aplicaron cambios a la BD remota ni se copiaron datos personales reales. Las migraciones originales se conservaron y 008 se publica como propuesta local para revisar.

Los registros detallados se encuentran en `test-results/persona3.tap`, `newman.json`, `newman-errores.json`, `newman-pdf-local.json` y `restauracion.json`.

## Publicación de estas fuentes

El resultado de validación para esta entrega y sus límites están en `docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md`. Los endpoints experimentales requieren `P3_ENABLE_LAB=true` en desarrollo o pruebas y no se registran por defecto. La publicación no ejecuta SQL ni activa funcionalidades en el servidor del grupo.

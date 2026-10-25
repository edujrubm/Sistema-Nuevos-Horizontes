# Documentos y almacenamiento

## Modelo recomendado

PostgreSQL guarda metadatos y un almacén privado guarda bytes. En el DDL v2, `documento_area` representa cada versión y la vincula a `formulario_area`; conserva `objeto_privado`, MIME, tamaño, SHA-256, número de versión, cargador y `documento_anterior_id`. El área, expediente y sujeto se resuelven desde el formulario.

No guardar rutas locales, URLs públicas ni nombres proporcionados por el usuario como clave. Nunca servir el contenedor directamente.

## Autorización

- El área propietaria consulta sus documentos según matriz y caso.
- Dirección los consulta dentro del expediente completo y puede imprimirlo.
- Descargar documentos generales y descargar documentos específicos de área son capacidades distintas.
- La consulta no habilita descarga ni impresión.
- Otra área recibe material por el procedimiento institucional autorizado; no obtiene acceso digital automático.

## Seguridad de carga

1. Lista permitida de extensiones y MIME aprobada.
2. Límite de tamaño por archivo y cuota por expediente.
3. Detectar tipo por contenido; no confiar en cabecera/nombre.
4. Antivirus antes de marcar disponible.
5. Nombres sanitizados solo para presentación.
6. Cifrado en tránsito y reposo.
7. Checksum para integridad y deduplicación técnica, sin deduplicar permisos.
8. Archivos rechazados o incompletos se aíslan y eliminan con trabajo auditado.

## Versionado y anulación

Una nueva versión crea otra fila y apunta a la anterior; nunca sobrescribe el objeto. La coordinación del área puede anular con fecha, usuario y motivo obligatorios. El DDL impide borrar físicamente. Falta definir un identificador de documento lógico y asegurar que una cadena no repita `version_documento` ni se bifurque.

## Entrega

El servidor emite un ticket o URL firmada de vida corta después de autorizar. Debe vincularse, cuando el proveedor lo permita, a versión, disposición y nombre seguros. Registrar quién, qué versión, acción, fecha, resultado y motivo contextual. No escribir el contenido ni la URL firmada en logs.

## Pendientes

Proveedor, límites, formatos, antivirus, retención, recuperación, semántica de cadena de versiones, firma digital y formato de impresión institucional. `formulario_area.firma_documento_id` ya exige que la firma pertenezca al mismo formulario. Hasta resolver la infraestructura, mantener `ObjectStoragePort` y `MalwareScannerPort` reemplazables.


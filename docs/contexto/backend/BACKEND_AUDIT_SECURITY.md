# Auditoría y seguridad

## Dos historiales diferentes

- **Historial de modificaciones:** creación, edición, confirmación, inactivación, restauración, anulación, cambio de asignaciones y versiones. Dirección y Administración general lo consultan en solo lectura; coordinaciones, solo en su área.
- **Historial de accesos:** inicio/cierre, fallos, recuperación, MFA, consulta de expediente completo, descarga, impresión, exportación y eventos administrativos. Lo consulta Administración general.

No mezclar auditoría con logs técnicos. La auditoría es evidencia funcional protegida; el log sirve para operar el sistema.

## Evento de auditoría mínimo

```text
event_id, occurred_at, actor_account_id, effective_roles/scopes,
action, resource_type, resource_id, area_id, beneficiary_id,
result, reason, request_id, source_ip_hash/prefix, user_agent_family,
before_revision_id, after_revision_id, metadata_minimized
```

Evitar valores clínicos, relatos, contraseñas, tokens y bytes. Para cambios sensibles conservar revisiones protegidas o un diff cifrado y autorizado, separado del log operativo.

## Integridad

Los eventos no se actualizan desde la aplicación. Restringir permisos SQL del usuario de runtime; considerar particiones mensuales, retención aprobada y sellado/hash encadenado si el análisis legal lo exige. Relojes de servidores sincronizados.

## Controles mínimos

- TLS en tránsito; cifrado gestionado en base, respaldos y objetos.
- Secretos en gestor dedicado y rotación documentada.
- Hash de contraseña con algoritmo resistente y parámetros revisables; nunca cifrado reversible.
- Cookies `HttpOnly`, `Secure`, `SameSite` si se usan sesiones web; protección CSRF acorde al mecanismo.
- CORS con orígenes explícitos.
- Rate limit específico para login, recuperación, búsqueda sensible, descargas y exportaciones.
- DTO con lista permitida; rechazar propiedades desconocidas.
- Consultas parametrizadas y límites estrictos.
- Cabeceras seguras y errores sin trazas internas.
- Dependencias escaneadas y actualizadas con proceso controlado.
- Separación de credenciales por ambiente y privilegio mínimo en PostgreSQL/almacenamiento.

## Privacidad

Minimizar respuestas, listados, caches y telemetría. No indexar relatos en un buscador externo sin aprobación. Evitar CUI/nombres en URLs, nombres de archivo, métricas y etiquetas de trazas. Sanitizar datos de soporte y usar fixtures sintéticos.

## Respuesta a incidentes

Definir responsables, clasificación, preservación de evidencia, revocación de sesiones, rotación de secretos, comunicación y restauración. Los endpoints de salud no exponen versiones, cadenas de conexión ni detalles de proveedores.

## Implementación observada en v2

`revision_registro` registra INSERT/UPDATE de las tablas nuevas incluidas en la ampliación y es inmutable. El actor proviene de `current_setting('new_horizons.actor_id')`; una actualización exige `new_horizons.motivo`. Esta bitácora contiene JSON anterior/nuevo, por lo que debe recibir permisos más restrictivos que los logs y una política explícita de cifrado, consulta y retención.

La cobertura no debe suponerse global: la ampliación no instala estos disparadores sobre todas las tablas originales, en particular `beneficiaria`, `nino` y `ficha_inicial`. Se requiere una revisión de cobertura antes de declarar completo el historial RF-BE7/RF-ED.

# Documentos unificados

Único módulo operativo para PDFs. CargaPdfService valida/persiste bytes; DocumentosService consulta, lista versiones, verifica descarga y anula lógicamente. No hay otra solicitud de carga Firebase ni registro ficticio de éxito.

Contrato y ejemplos: `postman/Documentos_Unificados.postman_collection.json`. Pruebas HTTP: `test/zzz-documentos-unificados.integration.cjs`. Las decisiones de almacenamiento y acceso productivo están en `docs/DECISIONES_Y_DUDAS.md`.

Almacenamiento privado local DOCUMENTOS_DIR, límite 20 MiB. No servir ese directorio como estático. La sesión/almacenamiento productivos se integrarán posteriormente; el arranque sigue limitado a loopback en desarrollo/pruebas.

# Documentos unificados

Único módulo operativo para PDFs. CargaPdfService valida y almacena bytes; DocumentosService orquesta consulta, descarga y anulación. DocumentosRepository y CargaPdfRepository resuelven persistencia tipada y proyecciones con el mismo contexto transaccional. No hay otra solicitud de carga Firebase ni registro ficticio de éxito.

Contrato y ejemplos: `postman/Documentos_Unificados.postman_collection.json`. Pruebas HTTP: `test/zzz-documentos-unificados.integration.cjs`. Las decisiones de almacenamiento y acceso productivo están en `docs/DECISIONES_Y_DUDAS.md`.

Almacenamiento privado local DOCUMENTOS_DIR, límite 20 MiB. No servir ese directorio como estático. La sesión/almacenamiento productivos se integrarán posteriormente; el arranque sigue limitado a loopback en desarrollo/pruebas.

Los PDFs cargados quedan disponibles inmediatamente, sin aprobación o revisión documental. Su estado operativo es VIGENTE o ANULADO. Los campos históricos de revisión permanecen en la BD por compatibilidad de migraciones, pero no se utilizan para habilitar consulta, versión o descarga ni se exponen como un pendiente del usuario.

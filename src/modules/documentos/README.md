# Documentos unificados

Único módulo operativo para PDFs. CargaPdfService valida/persiste bytes; DocumentosService consulta, lista versiones, verifica descarga y anula lógicamente. No hay otra solicitud de carga Firebase ni registro ficticio de éxito.

Contrato y ejemplos: docs/integracion/INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md; colección postman/Documentos_Unificados.postman_collection.json. Pruebas HTTP: test/zzz-documentos-unificados.integration.cjs.

Almacenamiento privado local P3_DOCUMENTS_DIR, límite 20 MiB. No servir ese directorio como estático. La sesión/almacenamiento productivos se integrarán posteriormente; el arranque sigue limitado a loopback en desarrollo/pruebas.

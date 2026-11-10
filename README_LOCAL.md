# Ejecución local de la entrega de integración

Referencia vigente: docs/integracion/INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md.

La copia original del laboratorio sigue en Nuevos-Horizontes-Laboratorio-Local-20261031. Esta entrega ya no contiene su módulo runtime ni sus páginas HTML.

API y PostgreSQL sintéticos: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persona3.ps1 -Port 55462 -ApiPort 3016. API /api/v1, Swagger /api/docs.

React: pnpm --dir frontend dev. Ver frontend/README.md para capacidades locales y proxy.

Pruebas: pnpm test:core. Solo usa un cluster PostgreSQL local nuevo y lo detiene al terminar. Nunca ejecutar fixtures sobre la BD compartida. El script start conserva su cluster sintético en test-results; no migra automáticamente clusters ya inicializados. Si cambia el esquema, crear otro cluster de prueba o revisar las migraciones explícitamente.

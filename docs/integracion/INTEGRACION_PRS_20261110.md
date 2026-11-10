# Integración del equipo — 10 de noviembre de 2026

Base revisada: main bf34689. PR incluidos: #7 Social, #8 Legal, #9 Guardería, #10 Documentos, #11 Albergue y #15 entrega unificada Persona 3.

## Decisiones de reconciliación

- Se conservan los commits originales mediante merges, sin reescribir ni eliminar las ramas del equipo.
- #7, #8 y #9 ya tienen sus funciones en la entrega unificada; se conserva esa implementación y se integra también su historial.
- Se conserva el router y layout común de main, incluidos Beneficiarias, Ficha inicial, Psicología, Medicina y Albergue. Social, Legal, Guardería, Referencias y Evolución se incorporan como rutas del expediente, accesibles desde su perfil. Se conserva la protección de borradores y las capacidades de desarrollo optativas.
- Estilos de Persona 3 limitados a su contenedor para que no cambien las pantallas de los demás equipos. Un solo punto de entrada React, router y proveedor de consultas.
- #10 y #15 describen los mismos recursos documentales. Se conserva un solo contrato: listado paginado, metadatos, cadena completa de versiones, anulación auditada con versión y motivo, carga multipart real de PDF y descarga privada verificada. El controlador antiguo y sus adaptadores de almacenamiento incompletos no se registran. Las operaciones antiguas de iniciar/completar carga o crear versión sin archivo devolvían 503; el flujo completo utiliza POST /api/v1/beneficiarias/:id/documentos/cargas, con documentoAnteriorId y motivoCambio para versiones.
- Se integra el backend Albergue de #11 y se alinea su prefijo con el frontend /api/v1/albergue. Se corrige el nacimiento: la transacción configura actor y motivo de auditoría antes de insertar al niño. El actor se obtiene de AUDIT_ACTOR_USERNAME, igual que los módulos de Beneficiarias/Niños; no se fija un usuario del compañero en el código.
- Se corrige también /api/v1/medicina para las consultas médicas. Una única configuración de prefijo y de errores globales, manteniendo las excepciones públicas de main.
- Las variables de estados del ejemplo se alinean: P3_DRAFT_STATE y FORM_DRAFT_STATE_CODE = BORRADOR; confirmados = CONFIRMADO. Los estados sintéticos P3_* quedan en el entorno aislado de pruebas.
- El runtime experimental de laboratorio se retira siguiendo #15; su SQL queda como propuesta en docs/propuestas, fuera de las migraciones operativas.
- Se mantiene 007_estado_formulario_descartado.sql junto con 007_persona3_campos_mockups.sql; registrar por nombre completo. No se modifican migraciones aplicadas 003–007. 008_documentos_integracion.sql es propuesta para revisión del responsable de BD. Si existía 008_local_mockups.sql en una base, reconciliar objetos e historial antes de aplicar la nueva 008. No se ejecutó SQL en la base compartida.
- GitHub Actions no se utilizó como requisito y no se cambió ningún workflow.

## Verificación local reproducible

```powershell
pnpm install --frozen-lockfile
pnpm test --runInBand
pnpm --dir frontend typecheck
pnpm --dir frontend test
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-persona3.ps1 -Port 55471 -SinLaboratorio
```

El último comando inicializa un PostgreSQL temporal con datos sintéticos, aplica los scripts versionados, compila API y frontend y comprueba HTTP contra Nest real. Cierra el PostgreSQL al terminar, incluso al fallar. Los archivos privados y logs quedan ignorados en test-results. La prueba incluye contratos, errores, formularios, referencias, evolución, documentos PDF, Albergue (ingreso, salida/retorno, nacimiento, egreso, historial) y consultas médicas. Una comprobación del router comprueba las 23 rutas de los equipos.

Resultados: 29 pruebas unitarias backend; 109 pruebas frontend; 52 pruebas HTTP/contratos e integración PostgreSQL. TypeScript y builds API/React. Instalación congelada reproducible. No se certifica infraestructura de producción: siguen pendientes autenticación y autorización reales, y almacenamiento definitivo; se conserva la restricción local del servidor.

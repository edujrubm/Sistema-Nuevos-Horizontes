# Entrega de Trabajo Social

Fecha: 13 de noviembre de 2026. Rama social, sobre la base común y Legal descritos en [INTEGRACION_LEGAL.md](INTEGRACION_LEGAL.md).

## Qué hace este PR

- Sustituye el servicio heredado de Social por SocialService, SocialRepository, SocialResumenRepository y SocialFormRepository. El CRUD específico SOCIAL utiliza TypeORM y registra su adaptador en el motor común.
- Conserva las dos rutas propias de resumen/listado y las operaciones compartidas de formularios. Conserva sus contratos de paginación y total; no cambia las rutas de las demás áreas.
- Guarda cabecera, detalle y auditoría en la misma transacción. Comprueba versión después del bloqueo y revierte toda la operación si falla el detalle.
- Añade las páginas React de Social, listado y editor de cinco secciones, con identidad reutilizada de la beneficiaria, fecha de atención, responsable, errores por campo y protección de cambios sin guardar. Usa el diseño y la navegación institucionales.
- El enlace histórico a una ficha SOCIAL redirige al editor propio. El editor genérico reutiliza la definición pública de campos de Social.
- La copia PDF firmada se adjunta mediante el módulo existente de Documentos, con la ficha Social precargada. El servidor exige ficha Social confirmada y conserva la validación de expediente/área; no se crea otra implementación de carga.
- El resumen consulta las últimas anotaciones mediante el servicio de lectura de Evolución. No reconstruye su captura ni cambia el SQL pendiente.
- Incluye colección Postman de Social, entorno local, generador y pruebas del contrato. Las imágenes institucionales de referencia se incluyen en docs/referencias/social/; no son datos de beneficiarias.

Los riesgos siguen siendo texto. totalRiesgos se devuelve sin soporte numérico en vez de inventar un catálogo o inferir una clasificación. La firma sigue siendo física y el archivo se carga en PDF.

## Dependencias y alcance

Revisar primero legal hacia main. Mientras no esté integrada, comparar social contra legal: así se ve únicamente la entrega de Social. No fusionar dos implementaciones distintas del registro común. Si el encargado integra Legal con squash, deberá reconciliar la base antes de revisar Social contra main.

La corrección del DTO de Niños corresponde al compañero. No se incluye ese archivo en estas ramas. Antes de fusionar, integrar esa corrección de base y repetir pnpm run check sobre las ramas actualizadas.

No se incluyen migraciones, cambios de tablas/columnas, sincronización automática, credenciales ni archivos del laboratorio. La migración histórica 007 queda intacta; es la única excepción de nomenclatura heredada en los archivos actuales. No se reescribe el historial Git.

## Verificación

En la preparación integrada se aprobaron:

| Comprobación | Resultado |
| --- | --- |
| Jest backend | 48 pruebas |
| Vitest frontend | 163 pruebas |
| Tipos y compilación | API y React aprobados |
| PostgreSQL Social | 27 pruebas, incluidas concurrencia, validación, privacidad y rollback |
| Regresión entre áreas | 60 pruebas, incluidas las dos de arquitectura y flujos de Documentos, Albergue, Guardería y Evolución |
| Newman Social dentro de la regresión | 30 peticiones y 65 comprobaciones sin fallos |
| Contrato Postman estático | 3 pruebas; cobertura de las 16 operaciones utilizadas |
| Diagnóstico de esquema Social | Lectura de metadatos aprobada en la BD sintética local; sin modificaciones de esquema |

Comandos: pnpm run check; powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-social.ps1; powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-areas.ps1; node --test test/postman-social.contract.test.cjs.

Los ejecutores PostgreSQL crean clústeres propios en loopback y no usan .env del equipo. Para el diagnóstico usar SOCIAL_TEST_HOST, SOCIAL_TEST_PORT, SOCIAL_TEST_DATABASE, SOCIAL_TEST_USER y SOCIAL_TEST_PASSWORD explícitos; el script no carga .env.

La compilación completa se verificó con un DTO temporal de Niños solo local, excluido del commit. Por tanto, estos resultados acreditan el conjunto con ese requisito satisfecho, no que main sin la corrección del compañero ya compile. No se consultó ni modificó la BD compartida.

## Condiciones antes de fusionar o desplegar

1. Integrar la corrección de base de Niños y actualizar las ramas contra main vigente; comprobar nuevamente tipos, compilación y pruebas.
2. Revisar los archivos comunes y confirmar el esquema, catálogos, auditoría y variables del ambiente destino de forma no destructiva. No ejecutar fixtures de ensayo sobre la BD del grupo.
3. Mantener pendiente la reconstrucción de la captura evolutiva hasta recibir el SQL definitivo.
4. No certificar producción sin identidad autenticada y autorización del servidor. Las capacidades y el ámbito de ensayo no son una sesión real.
5. No presentar como terminadas las correcciones ordinarias de fichas confirmadas ni la revisión/aprobación documental. Esos flujos conservan sus pendientes y no se han habilitado por suposición.

Esta entrega permite solicitar revisión técnica del alcance descrito. No se crea PR ni se fusiona main de manera automática, ni se promete ausencia absoluta de regresiones.

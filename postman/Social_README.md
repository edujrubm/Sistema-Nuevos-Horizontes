# Postman de Trabajo Social

Colección local del dominio: Social.postman_collection.json. Entorno: Social_Local.postman_environment.json. Mantiene formato Postman 2.1 compatible con las colecciones existentes del equipo y Newman. No está publicada en un workspace remoto.

## Importar y ejecutar

1. Importar ambos JSON en Postman y seleccionar el entorno Social — laboratorio local.
2. Verificar baseUrl: debe apuntar a una API en loopback y una base sintética desechable. El valor incluido es http://127.0.0.1:3033/api/v1, correspondiente al entorno local de esta revisión; no es un despliegue.
3. El laboratorio debe contener beneficiaria 100, profesional 1, catálogos de Social y estados configurados. Documentos requiere contexto técnico de Trabajo Social y coordinación para anular el documento sintético creado por la colección. No cambiar capacidades de una cuenta productiva para hacer el ensayo.
4. En las peticiones 14, 18 y 21, seleccionar test/fixtures/documento.pdf si Postman no puede resolver su ruta relativa. Es un archivo sintético de ensayo, no un PDF real de una beneficiaria.
5. Ejecutar la colección completa, ordenada, desde la petición 01. Los identificadores y versiones se capturan automáticamente. La primera petición limpia las variables de la ejecución anterior.

La colección crea dos fichas sintéticas, carga un documento y una nueva versión, anula lógicamente esa versión y descarta su segundo borrador. No borra físicamente datos ni modifica documentos preexistentes. La ficha confirmada y los registros auditados se conservan en la base de ensayo.

## Qué comprueba

Treinta peticiones con 65 comprobaciones verifican catálogo, resumen, listado histórico, cursor, creación, consulta, edición, versión desactualizada, rechazo de niño/profesional/campo/identificador incorrectos, confirmación, bloqueo de edición normal, carga PDF antes/después de confirmar, asociación documental, archivo privado, versiones, anulación y descarte lógico. Los errores incluyen mensaje público y solicitud identificada; varios casos comprueban el código y campo específicos.

El guard de la colección admite exclusivamente URLs http de 127.0.0.1 o localhost con puerto explícito y prefijo /api/v1. Ante otro destino reemplaza la URL por un puerto local de bloqueo y detiene la secuencia. No usar este guard como sustituto de revisar el entorno y los datos de ensayo.

## Rutas cubiertas

Todas incluyen el prefijo /api/v1. La prueba de cobertura compara método/ruta contra los decoradores de los controladores compilados; no se basa únicamente en una tabla escrita a mano.

| Método | Ruta | Propietario |
| --- | --- | --- |
| GET | /trabajo-social/beneficiarias/:id/resumen | Social |
| GET | /trabajo-social/beneficiarias/:id/fichas | Social |
| GET | /beneficiarias/:id/formularios-area | Formularios comunes, tipo SOCIAL |
| POST | /beneficiarias/:id/formularios-area | Formularios comunes, tipo SOCIAL |
| GET | /formularios-area/:id | Formularios comunes |
| PATCH | /formularios-area/:id | Formularios comunes |
| POST | /formularios-area/:id/confirmar | Formularios comunes |
| POST | /formularios-area/:id/descartar | Formularios comunes |
| GET | /tipos-formulario | Catálogo común |
| GET | /beneficiarias/:id/documentos | Documentos |
| GET | /beneficiarias/:id/documentos/contexto | Documentos |
| GET | /documentos/:id | Documentos |
| GET | /documentos/:id/versiones | Documentos |
| POST | /documentos/:id/anular | Documentos |
| GET | /documentos/:id/archivo | Documentos |
| POST | /beneficiarias/:id/documentos/cargas | Documentos |

## Repetir la verificación automática

Usar Node 24 y dependencias locales instaladas. Desde la raíz del repositorio:

```powershell
node scripts/generar-postman-social.cjs
pnpm run build:api
node --test test/postman-social.contract.test.cjs
./scripts/test-areas.ps1 -NodeExe node -Port 55487
```

El último comando prepara un clúster PostgreSQL desechable, inicia AppModule real en un puerto HTTP disponible y ejecuta Newman sobre la colección. No apunta a la base compartida del equipo. Requiere PostgreSQL 18; PostgresBin permite indicar otro directorio de instalación.

## Evidencia y límites

Ejecución del 13 de noviembre de 2026: 30 peticiones, 65 comprobaciones, cero fallos. Tres pruebas de estructura, scripts, destino local y cobertura aprobadas. Suite de integración: 58 pruebas aprobadas. Evidencias ignoradas: test-results/social-newman.json y test-results/social-postman-integracion.log.

No se enviaron resultados a un workspace remoto. La prueba usa contexto técnico local; no acredita autenticación o autorización productivas. La colección no implementa ni ejecuta capturas evolutivas. Eduardo confirmó el 13 de noviembre que sigue pendiente otro SQL para esa parte.

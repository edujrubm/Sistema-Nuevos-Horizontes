# Laboratorio local de Nuevos Horizontes

Copia aislada creada el 31 de octubre de 2026 desde la rama `schema-persona3`, commit `2bc54fa8037723e28437b05b1863239f9464e595`. Se incluyeron las migraciones SQL 003–006 de `beneficiarias`, commit `5993ade3f34d3cbc569b4cdd829cff29fc631894`, sin cambiar sus originales.

El desarrollo y las pruebas se realizaron primero en una copia sin remoto. Por autorización posterior del usuario se publican las fuentes y migraciones; no se aplican cambios a la BD compartida. Los datos cargados son sintéticos; no se descargaron expedientes reales del grupo.

## Archivos principales

- `database/migrations/008_local_mockups.sql`: ampliación experimental local.
- `database/export/esquema-local.sql`: esquema completo resultante.
- `database/export/laboratorio-datos-sinteticos.sql`: volcado con datos de demostración.
- `database/export/documentos-privados/`: PDFs referenciados por la demostración, verificados por SHA-256.
- `docs/local/INFORME_Y_FEEDBACK.md`: cambios, pruebas y pendientes del grupo.
- `docs/local/GUIA_LOCAL.md`: operaciones adicionales y ejemplos.
- `docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md`: procedencia, alcance y pruebas.

## Ejecutar

Requiere Node/pnpm y PostgreSQL 18 local. No necesita credenciales del grupo.

```powershell
pnpm install --frozen-lockfile
pnpm start:persona3
```

Pantalla: http://127.0.0.1:3015/laboratorio/mockups-local.html

API: http://127.0.0.1:3015/api/v1

PostgreSQL persistente: puerto 55452, base `p3_test`, datos en `test-results/local-mockups-pg`. Los PDF de demostración están separados en `test-results/documentos-locales`.

El área es una configuración del servidor de laboratorio. Para probar otra, detener con Ctrl+C y ejecutar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persona3.ps1 -Area 'Trabajo Social'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persona3.ps1 -Area 'Guardería'
```

Las pruebas usan otra base/puerto y otro directorio de documentos; no modifican la demostración:

```powershell
pnpm test:persona3
```

Las pruebas incluyen los escenarios previos y los adicionales de mockups, más la comprobación de activación explícita del laboratorio. Ver el contexto de correcciones para el resultado de esta entrega.

Con la demostración encendida, exportar nuevamente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/exportar-bd-local.ps1
```

El volcado guardado se restauró en `local_restauracion_20261031`, también local al puerto 55452. El exportador SQL no copia automáticamente los PDF: al hacer futuras copias, conservar también el directorio privado y su manifiesto. Los archivos SQL base y las migraciones 003–007 no se editaron. 008 está hecha para aplicarse una vez en una copia; no es una actualización aprobada para ejecutar en la BD del grupo.

## Alcance

Las 14 rutas P3 y la carga PDF se conservan. Hay 9 operaciones adicionales bajo `/laboratorio/` para ejercitar el modelo local; son experimentales y solo se registran con `P3_ENABLE_LAB=true` en desarrollo/pruebas. Los scripts de laboratorio activan esa bandera.

La pantalla es una herramienta de comprobación con campos de la ficha; no sustituye el frontend definitivo. La captura/lectura de Social, Guardería, Legal y documentos se comprobó por HTTP/BD; la prueba manual de navegador se hizo en Legal. Autenticación real sigue diferida. La asignación de casos tiene estructura de BD, pero todavía no establece una sesión ni aplica permisos finales por usuario.

Los volcados y PDF mencionados se generan localmente; no están versionados. El inventario de migraciones base 01+02 se encuentra en `test/fixtures`, sin otra copia redundante en `database/base`.

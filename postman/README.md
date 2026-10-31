# Pruebas Postman - Persona 1

## Archivos

- `Nuevos_Horizontes_Persona_1.postman_collection.json`: colección ejecutable.
- `Nuevos_Horizontes_Local.postman_environment.json`: entorno local sin secretos.

## Preparación

1. Usar la rama `beneficiarias`.
2. Verificar que las migraciones `003` a `006` y el seed sintético estén aplicados en PostgreSQL de pruebas.
3. Completar el `.env` local. No subirlo a Git.
4. Iniciar la API con `pnpm start` o `pnpm start:dev`.
5. Confirmar que Swagger responde en `http://localhost:3000/api/docs`.

## Ejecución recomendada

1. Importar la colección y el entorno en Postman.
2. Seleccionar el entorno `Nuevos Horizontes - Local`.
3. Abrir la colección y elegir **Run collection**.
4. Conservar el orden de las carpetas y solicitudes.
5. Ejecutar una iteración completa.

La primera solicitud genera CUI y nombres sintéticos únicos. Las solicitudes posteriores guardan automáticamente `beneficiariaId`, `expedienteVersion`, `fichaId`, `fichaVersion`, `hijoId` y `hijoVersion`.

## Resultado esperado

- Todas las solicitudes funcionales deben responder `200` o `201`.
- La confirmación de ficha debe finalizar en estado `CONFIRMADA`.
- Los casos de la carpeta `05 - Validaciones negativas` deben devolver los errores `404` o `409` indicados; esos resultados representan pruebas aprobadas.

## Advertencias

- La colección inserta datos sintéticos en la base seleccionada.
- No ejecutarla contra producción.
- No cambiar manualmente las variables de versión durante una corrida.
- Si una corrida se interrumpe, iniciar una nueva desde la primera solicitud para generar otro conjunto de datos.

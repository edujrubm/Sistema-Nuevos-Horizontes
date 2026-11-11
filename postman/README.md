# Postman de la integración

API local por defecto: http://127.0.0.1:3016/api/v1. Iniciar con pnpm start:persona3 (PostgreSQL local sintético); importar el entorno local. No usar fixtures en la BD del grupo.

- Persona3.postman_collection.json: 14 rutas originales, flujo ejecutable con la semilla P3.
- Errores.postman_collection.json: 3 peticiones de errores de contrato.
- CargaPDF.postman_collection.json: 1 PDF sintético; working-dir postman para Newman.
- Documentos_Unificados.postman_collection.json: 6 plantillas del contrato documental único. Elegir archivo, formularioId, documentoId y versión vigentes. Para nueva versión activar documentoAnteriorId y motivoCambio. No tiene una fase completar.
- Nuevos_Horizontes_Persona_1.postman_collection.json: colección de main, conservada; requiere sus catálogos y semilla específicos. No confundirla con una prueba completa ejecutada en esta entrega.

Generación P3: pnpm postman:persona3. No vuelve a crear páginas HTML ni endpoints de laboratorio.

Resultados comprobados el 4 de noviembre: las tres colecciones P3/Errores/PDF sumaron 18 peticiones y 29 aserciones sin fallos. Las operaciones nuevas de listado/versiones/anulación/descarga se comprobaron mediante pruebas HTTP contra PostgreSQL; la colección nueva se entrega como plantillas configurables.

Las áreas y autor se simulan en el servidor de pruebas. No cambiar P3_TEST_AREA desde el navegador. En producción será responsabilidad de la sesión autenticada.

## Notas históricas de Persona 1

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

Las solicitudes de catálogos también seleccionan automáticamente `paisId`, `departamentoId`, `municipioId` y `ocupacionId`. Estos valores se reutilizan en el ejemplo completo de alta y actualización de beneficiaria y dentro de las secciones correspondientes de la ficha inicial.

## Ejemplos completos incluidos

- Inicio de admisión transaccional: beneficiaria, expediente y ficha inicial en borrador.
- Alta y actualización de beneficiaria con todos los campos admitidos actualmente por el DTO.
- Alta y actualización de hija o hijo con todos los campos admitidos actualmente.
- Cabecera de ficha inicial y ejemplos editables para sus 19 secciones.
- Identificación, residencia, contacto, datos generales, escolaridad y salud.
- Grupo familiar, personas agresoras, motivo, violencia, medios y situaciones de riesgo.
- Referencias, apoyo previo, episodio reciente, análisis de riesgo y plan de seguridad.
- Evaluación, entrevista inicial, seguimiento y observaciones.

Los ejemplos contienen únicamente datos sintéticos. Los campos internos de `contenido` representan el inventario funcional preliminar de la ficha institucional. El backend los conserva como JSON de la sección; la obligatoriedad y los catálogos definitivos aún deben aprobarse antes de convertirlos en DTO estrictos por sección.

El flujo normal ya no crea primero una beneficiaria aislada y después la ficha. La solicitud `01 - Iniciar admisión: beneficiaria y ficha` crea el agregado completo en una sola transacción. Las solicitudes posteriores continúan llenando el mismo borrador por secciones.

### Fuente única de los datos

La colección usa una sola fuente persistente para cada dato. Identidad, origen, estado civil, escolaridad, alfabetismo, salud, residencia y lugar de ocupación se actualizan en sus tablas estructuradas (`beneficiaria`, `residencia` y `lugar_ocupacion`). La sección JSONB conserva exclusivamente los campos propios de la entrevista que no tienen columna estructurada. Por ello, al consultar una ficha no deben aparecer en el JSON de una sección copias de esos datos canónicos.

## Resultado esperado

- Todas las solicitudes funcionales deben responder `200` o `201`.
- La confirmación de ficha debe finalizar en estado `CONFIRMADA`.
- Los casos de la carpeta `05 - Validaciones negativas` deben devolver los errores `400`, `404` o `409` indicados; esos resultados representan pruebas aprobadas.

## Advertencias

- La colección inserta datos sintéticos en la base seleccionada.
- No ejecutarla contra producción.
- No cambiar manualmente las variables de versión durante una corrida.
- Si una corrida se interrumpe, iniciar una nueva desde la primera solicitud para generar otro conjunto de datos.
# Persona 4 integrada — 11/11/2026

`Persona4_Integrada.postman_collection.json` prueba PDF real, versiones, anulación, ingreso, salida, retorno, nacimiento, egreso e historial. Ejecutar desde la raíz con `pnpm exec newman run postman/Persona4_Integrada.postman_collection.json`. Incluye respuestas negativas esperadas (409). Utiliza las fixtures PDF del repositorio y solo datos sintéticos; revisar sus variables y preparar los estados Activo/Inactivo antes de correr. El egreso requiere motivo. Las rutas y límites están en `docs/integracion/INFORME_PERSONA4_20261111.md`.

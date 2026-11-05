# Contexto de las correcciones de backend y BD para mockups

## Propósito y procedencia

Se publica el trabajo que primero se corrigió y comprobó en una copia local aislada,
por autorización expresa del usuario. La publicación incluye código, pruebas,
colecciones, documentación y SQL; **no ejecuta migraciones en la BD del grupo**.

Base funcional: rama `schema-persona3`, commit `2bc54fa8037723e28437b05b1863239f9464e595`.
SQL 003–006: copias originales de `beneficiarias`, commit
`5993ade3f34d3cbc569b4cdd829cff29fc631894`. No se copian ni sobrescriben sus servicios.
Las migraciones anteriores se conservan; la ampliación nueva está en
`database/migrations/008_local_mockups.sql`.

El nombre de una rama no implica una BD separada por persona. Se trabaja sobre
el esquema general `new_horizons`; las tablas nuevas complementan ese esquema.

## Qué se corrigió

| Problema | Cambio |
|---|---|
| Los campos nuevos de PDF eran rechazados por límites anteriores | Multipart ajustado para título, fecha, descripción, documento anterior y motivo; textos de hasta 20000 caracteres. |
| Social dejó de mostrar campos que ya existían | El resumen conserva los campos planos usados por la pantalla y también ofrece detalle. |
| IDs bigint se redondeaban al crear JSON | Conversión a texto en SQL antes de interpretar el JSON en Node; probado con 9007199254740993. |
| Riesgos sociales solo eran un relato | Catálogo propio de opciones del mockup y selección por ficha, contador real e historial de retiros. |
| No se distinguía quién llevaba o recogía al niño | Autorizaciones por familiar declarado con dos permisos; FK compuesta impide usar una persona de otra ficha. |
| PDF sin título y revisión separados | Título, estado BORRADOR/REVISADO, autor/fecha de revisión y versión optimista de metadatos. |
| Versiones podían pertenecer a otra ficha o tener dos sucesores | Misma ficha por FK/validación, orden consistente de bloqueos y sucesor único. |
| Se podía reemplazar contenido sin una nueva versión | Inmutabilidad de objeto privado, hash, tamaño y datos del archivo; nuevas versiones exigen motivo. |
| Mover el almacenamiento rompía rutas absolutas | Claves relativas en BD y resolución segura dentro del directorio privado. |
| Pruebas y demo compartían carpeta de archivos | Cada cluster de pruebas usa su carpeta y la demostración otra persistente. |
| Se podía revisar un archivo alterado | Se comprueban tamaño y SHA-256 antes de marcar revisado y al consultarlo. |
| Editor experimental omitía reglas de referencias | Reutiliza la validación de destino y motivo al corregir una referencia confirmada. |
| El script omitía la migración del esquema que usa el código | Aprovisiona SQL base y migraciones en orden en BD local aislada. |

## Modelo añadido por 008

Cinco tablas: `riesgo_social`, `ficha_social_riesgo`,
`autorizacion_traslado_guarderia`, `estado_revision_documento` y
`asignacion_caso_area`.

Columnas nuevas en tablas existentes: nombre/estado/revisor/fecha de revisión y
versión de metadatos de `documento_area`, y `formulario_area.ficha_inicial_id`.
La ficha inicial vinculada debe pertenecer al mismo expediente. Se conservan los
24 campos agregados por 007. Hay auditoría y restricciones de consistencia;
las relaciones seleccionables se desactivan en vez de borrar el historial.

No se duplican beneficiarias, hijos ni expedientes. La carga sigue siendo solo PDF;
no se agregó cámara ni conversión de imágenes. Legal sigue siendo de la beneficiaria.

## Límites y decisiones que no deben darse por aprobadas

- CERRADA de Social es una propuesta de laboratorio. Falta acordar permisos,
  reapertura y correcciones posteriores; el acuerdo general sigue siendo borrador/confirmado.
- El catálogo de revisión documental y su política de vigente son una propuesta
  local. Revisado, vigente y no anulado no son conceptos intercambiables.
- La tabla de asignaciones prepara los datos, pero no implementa identidad,
  sesiones ni autorización por caso. Autenticación definitiva sigue diferida.
- No se corrigieron aquí los servicios de beneficiarias: persisten los hallazgos
  de lotes de hijos, residencia parcial, completitud normalizada e IDs anidados.
- No se resuelven por este cambio las rutas faltantes de otros integrantes en
  Postman, los prefijos distintos de la API o filtros globales duplicados al integrar.
- No se implementó un gestor general de migraciones: el marcador del demo no
  aplica nuevas migraciones sobre una BD que ya estaba inicializada.

## Endpoints del laboratorio: activación explícita

Las 14 rutas P3 y la carga PDF mantienen sus rutas. Se incluyen nueve operaciones
adicionales bajo `/api/v1/laboratorio/` para comprobar los mockups. **No se registran
por defecto**: requieren `P3_ENABLE_LAB=true` y entorno development/test.

Los scripts `start:persona3` y `test:persona3` activan el laboratorio para su objetivo
específico. `.env.example` lo deja desactivado. No activar ese módulo como si fuera
una API institucional final ni considerar sus variables de contexto una sesión real.

`public/mockups-local.html` es una pantalla técnica de prueba; no reemplaza el
frontend aprobado. Se verificó manualmente Legal en navegador y los flujos de las
otras áreas se ejercitaron por HTTP/BD.

## Ramas y archivos

Se utiliza `schema-persona3` como conjunto integrado de estas correcciones. El soporte
común se incorpora desde `evolucion` a `legal`, `social` y `guarderia`, conservando los
controladores específicos de cada rama. No se crea otra rama remota ni se modifica main.

Las pruebas de todas las áreas se ejecutan en el conjunto integrado, no en una rama
con controladores de una sola área. Cada rama debe compilar por separado.

- `README_LOCAL.md`: arranque del laboratorio y puertos locales.
- `docs/local/GUIA_LOCAL.md`: operaciones y cuerpos de ejemplo.
- `docs/local/INFORME_Y_FEEDBACK.md`: detalle de la revisión previa.
- `docs/local/openapi-local.json`: operaciones experimentales.
- `postman/LaboratorioLocal.postman_collection.json`: plantillas para esas operaciones;
  completar datos y versiones según el área. No se declara que la colección completa
  de tres áreas pueda ejecutarse contra un servidor configurado solo para Legal.
- `scripts/exportar-bd-local.ps1`: genera exportaciones locales, no las publica.

## Validación de la entrega

La copia original pasó 54 pruebas. Esta entrega añade una prueba que verifica que
el módulo experimental se registra solo con activación explícita. Resultado del
conjunto a publicar: **55 pruebas aprobadas, cero fallos**. Se ejecutaron las 14
peticiones funcionales y 3 de errores de Postman mediante Newman, con 27
comprobaciones aprobadas. La carga PDF ampliada pasó también en la validación
previa de la copia local (1 petición y 2 comprobaciones).

Comandos: `pnpm install --frozen-lockfile`, `pnpm test:persona3`, y `pnpm run build`
en cada rama de área. Requiere PostgreSQL 18 local. Las pruebas crean un cluster
separado y lo detienen al finalizar; no usan el servidor del grupo.

No se incluyen credenciales, volcados, datos de expedientes, archivos PDF cargados,
node_modules ni resultados temporales. Los PDF ya presentes en test/fixtures y
postman/fixtures son documentos sintéticos de prueba, no documentos de personas.

## Instrucción breve para otra IA del equipo

Antes de ampliar este trabajo, revisar las migraciones originales, el contrato de
errores y los DTO existentes. Reutilizar una sola infraestructura de errores. No
volver a convertir IDs bigint a number. Mantener motivo, versión e historial en
correcciones; preservar archivos/versiones anteriores y validar las FK compuestas.
No transformar las propuestas de laboratorio en reglas institucionales sin el
acuerdo del equipo. No inferir que publicar SQL significa que ya se aplicó.

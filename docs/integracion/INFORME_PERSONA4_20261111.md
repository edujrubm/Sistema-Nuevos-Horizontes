# Persona 4: Documentos y Albergue integrados

Fecha: 11 de noviembre de 2026.

## Base y alcance

Se trabajó desde una copia limpia de `main` en `54a7d8a`, conservando el trabajo anterior y las pantallas de los demás integrantes. La referencia de reparto fue `Nuevos_Horizontes_Plan_Frontend_Kanban.pdf`, especialmente F4-01 a F4-08 y FX-05. Las referencias visuales fueron `mockup_documentos_area.html`, `mockup_modulo_albergue.html` y los estilos del ZIP `2026-10-16 (1).zip` proporcionado por el usuario. Sus archivos se conservan en `docs/referencias-mockups/` como referencia, no como instrucciones ni datos reales.

Documentos y Albergue ya estaban incorporados a `main` por los PR #10, #11 y #26. La entrega completa sus funciones; no vuelve a introducir el módulo documental antiguo ni duplica su carga. No se crea un menú de “Persona 4”.

## Entregables por tarea

| Tarea | Resultado |
|---|---|
| F4-01: Panel de Albergue | Concurrencia con beneficiarias y acompañantes, nombres reales de la API, búsqueda, filtros de presencia, paginación, ocupación y movimientos recientes. El gráfico se calcula a partir de los conteos. |
| F4-02: Ingreso y estancia | Búsqueda de beneficiaria, selección explícita de sus hijos acompañantes, confirmación de ingreso, bloqueo de duplicados y transacción completa. Los niños de otro expediente provocan rollback. |
| F4-03: Salida y retorno | Selección de estancias activas de todas las páginas, salida con destino, bloqueo de otra salida abierta y retorno con confirmación que identifica a la beneficiaria. No se crean movimientos infantiles individuales. |
| F4-04: Egreso y nacimiento | Egreso con motivo y confirmación; cierre de los vínculos de acompañantes. Nacimiento con validaciones y confirmación, vinculado tanto al expediente como a la estancia. |
| F4-05: Historial | Ingresos, salidas, retornos, egresos y nacimientos con autor, fecha y motivo. Filtros de tipo/fecha y paginación en el servidor. Se conserva también la consulta anterior de movimientos temporales. |
| F4-06: Documentos por área | Pantalla React con la distribución del mockup: cabecera, panel de carga, cuatro métricas, filtros, tabla e historial. Carga directa de PDF, ficha autorizada, categoría, fecha y descripción. |
| F4-07: Versiones | Nuevas versiones por el mismo contrato multipart, motivo de cambio, historial desde cualquier versión, consulta y anulación lógica con versión de registro y motivo. No se borra el archivo. |
| F4-08: Errores de archivo | Validaciones de PDF/tamaño/vacío, progreso y espera de confirmación, cancelación y tratamiento de conexión incierta. No se declara éxito al llegar al 100% de bytes enviados ni se repiten cargas automáticamente. |
| FX-05: Carga reutilizable | `PdfFileField.tsx` y el transporte documental en `api.ts` pueden ser utilizados por otras vistas. No se convierten fotografías ni se abre la cámara. |

## Cambios del backend

- Se conserva un solo `DocumentosModule` y una sola carga directa `POST /api/v1/beneficiarias/:id/documentos/cargas`.
- El listado documental admite `buscar`, `categoria`, `estado`, `ultimas`, `pagina` y `limite`; filtros y total se calculan en PostgreSQL. `ultimas=true` presenta la última versión de cada cadena, incluso si está anulada, sin resucitar versiones anteriores.
- `GET /api/v1/beneficiarias/:id/documentos/contexto` devuelve área, fichas autorizadas, categorías, capacidades locales y métricas del área completa. La interfaz no adivina la ficha ni permite cambiar el área desde el cliente.
- El historial documental recupera el motivo de carga/cambio del registro de auditoría y el nombre del autor. No expone claves de almacenamiento privado.
- Albergue agrega filtros y nombres a la consulta de estancias, acompañantes y conteos infantiles. Los selectores recuperan todas las páginas de estancias activas.
- `POST /api/v1/albergue/estancias/buscar` permite buscar por nombre o CUI exacto mediante el cuerpo: el CUI no se coloca en la URL ni se devuelve en la respuesta.
- `GET /api/v1/albergue/historial` consulta eventos completos y filtra por fecha de Guatemala. No sustituye ni rompe `GET /albergue/movimientos`.
- El egreso requiere ahora `{ "motivo": "..." }`. Ingreso admite `ninoIds` opcional con identificadores como cadenas; solo se aceptan hijos activos del expediente.
- Se validan identificadores bigint, fechas y cadenas vacías antes de ejecutar las operaciones. Se corrigió la forma de recuperar el resultado del `UPDATE` de retorno y el contexto de auditoría al cerrar acompañantes.

### Contrato documental conservado

| Operación | Ruta sin `/api/v1` |
|---|---|
| Listado filtrado | GET `/beneficiarias/:id/documentos` |
| Contexto y métricas | GET `/beneficiarias/:id/documentos/contexto` |
| Carga inicial o nueva versión | POST `/beneficiarias/:id/documentos/cargas` |
| Metadatos | GET `/documentos/:id` |
| Versiones | GET `/documentos/:id/versiones` |
| PDF privado | GET `/documentos/:id/archivo` |
| Anulación lógica | POST `/documentos/:id/anular` |

La carga es `multipart/form-data`, campo `archivo`, con `formularioId`, `categoria` y metadatos. Una nueva versión añade `documentoAnteriorId` y `motivoCambio`. El navegador deja que el transporte construya el límite multipart: no fuerza `Content-Type: application/json`.

Los endpoints antiguos de “solicitar/completar carga” o un segundo POST de versiones no se reintroducen: el contrato ya integrado confirma el guardado en una sola respuesta. La API sigue comprobando PDF real, tamaño máximo de 20 MiB, área, relación con ficha, inscripción de Guardería, hash, versiones y almacenamiento privado.

## Base de datos

Se agrega únicamente la migración operativa `009_albergue_trazabilidad.sql`, después de 008. Crea `evento_albergue` con estancia, tipo de evento, fecha, autor, motivo y referencias opcionales al movimiento o niño. No agrega movimientos individuales infantiles ni altera las fichas clínicas.

No se aplica el archivo experimental `docs/propuestas/009_mockups_laboratorio.sql`; la numeración semejante no significa que sean el mismo archivo. No se modifica la base compartida. Las pruebas aplicaron el SQL en PostgreSQL local nuevo, con datos sintéticos.

Antes de actualizar una BD existente, hacer respaldo y revisar su registro de migraciones; no reaplicar 007/008 ni reconstruirla desde las fixtures. La nueva tabla no inventa autores ni horas para registros anteriores. Para revertir una versión de aplicación, conservar los eventos y respaldos: no borrar el historial como parte de un rollback de código.

## Validación

| Comprobación | Resultado |
|---|---|
| React: tipos, pruebas y compilación | 130 pruebas aprobadas en 26 archivos; TypeScript y build correctos |
| Backend e integración contra PostgreSQL aislado | 56 pruebas aprobadas |
| Unitarias conservadas del equipo | 29 pruebas aprobadas en 9 suites |
| Postman / Newman | 23 peticiones, 54 aserciones y cero fallos, con casos negativos esperados |
| Navegador Brave | Consulta de PDF persistido, versiones, anulación confirmada y persistencia tras recarga; salida temporal, confirmación de retorno e historial real |
| Responsive | Ancho útil y scroll del documento de 375 px en las comprobaciones móviles de Documentos y del historial de Albergue; tablas con desplazamiento interno |

Las pruebas de código suman 215; las comprobaciones de Postman se cuentan por separado. Las regresiones cubren las rutas de Persona 3 y las consultas de Beneficiarias, Psicología y Medicina presentes en las suites. No se afirma una auditoría exhaustiva de todos los requerimientos de seguridad del proyecto.

La selección automática de PDF mediante la extensión de Brave quedó bloqueada por su permiso de archivos locales. No se cambiaron permisos del navegador. La carga real se verificó por HTTP/Postman y PostgreSQL; el selector, progreso, errores y cancelación se verificaron con las pruebas React. Esto se distingue de un flujo de selección de archivo completamente automatizado en Brave.

Los logs, clusters y archivos privados de prueba están ignorados por Git. Las capturas locales con información sintética se guardan en `output/persona4_20261111/` fuera de esta copia del repositorio.

### Reproducir

```powershell
pnpm install --frozen-lockfile
pnpm --dir frontend check
pnpm test --runInBand
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-persona3.ps1 -Port 55463 -SinLaboratorio
```

Para la demostración local aislada:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persona3.ps1 -Port 55464 -ApiPort 3017 -Area Legal
# En otra consola:
$env:NH_API_PROXY='http://127.0.0.1:3017'
$env:VITE_DEV_CAPABILITIES='true'
pnpm --dir frontend dev --host 127.0.0.1 --port 5174 --strictPort
# En la raíz, solo contra datos sintéticos preparados:
pnpm exec newman run postman/Persona4_Integrada.postman_collection.json
```

La colección crea documentos, anula su última versión, abre/cierra una estancia y registra un nacimiento sintético. Requiere las variables de beneficiaria/ficha y los estados Activo/Inactivo en el entorno seleccionado. El arranque de una demostración nueva prepara esos estados y el CUI sintético `9999999999901` de la beneficiaria 100 para probar la búsqueda de ingreso. No ejecutarla en producción. La semilla base no sustituye los catálogos institucionales.

## Vistas funcionales

- [Documentos del área](http://127.0.0.1:5174/beneficiarias/100/documentos): carga, filtros, versiones y anulación en la misma vista.
- [Concurrencia de Albergue](http://127.0.0.1:5174/albergue).
- [Ingreso](http://127.0.0.1:5174/albergue/ingreso).
- [Salidas y retornos](http://127.0.0.1:5174/albergue/movimientos).
- [Egreso y nacimiento](http://127.0.0.1:5174/albergue/cierres).
- [Historial](http://127.0.0.1:5174/albergue/historial).

Son rutas del router común de React, sin `#`. Necesitan los servidores encendidos y los registros sintéticos indicados. No son mockups HTML.

## Integración y límites

Solicitud de esta entrega: [PR #27 — Completar Persona 4](https://github.com/edujrubm/Sistema-Nuevos-Horizontes/pull/27), desde la rama existente `feat/frontend-persona4-albergue-panel` hacia `main`. Su página conserva el estado de integración y el commit de fusión verificables.

Se revisaron los PR existentes: #10, #11, #15, #16 a #25 y #26 ya figuran fusionados. No se resucitan ramas descartadas ni se revierten esos PR. La publicación de esta entrega se realiza después de sus pruebas, sobre la rama existente de frontend de Persona 4 y mediante PR hacia `main`, conservando el trabajo de los demás.

La autenticación productiva, las capacidades de sesión y el almacenamiento definitivo siguen siendo dependencias comunes del proyecto. El backend conserva su restricción de ejecución local y las comprobaciones de área disponibles para el entorno de pruebas. No se presenta como un despliegue seguro a Internet ni se habilitan credenciales o permisos nuevos.

Reportes institucionales, administración y procesos ajenos al reparto de Persona 4 no se agregan para rellenar botones del mockup. La revisión documental (`REVISADO`) tampoco se simula como consecuencia de cargar un PDF: una carga nueva conserva su estado de borrador. Las preguntas de coordinación adicionales se encuentran en [DUDAS_PERSONA4_20261111.md](DUDAS_PERSONA4_20261111.md).

Las comprobaciones descritas no presentan fallos pendientes en su alcance; no equivalen a garantizar la ausencia absoluta de defectos en cualquier entorno o combinación de datos.

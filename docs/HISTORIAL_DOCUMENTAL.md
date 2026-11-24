# Historial de cambios y publicaciones

Este es el único Markdown para registrar entregas, cambios y publicaciones.
No crear documentos de contexto, avance, QA, integración, reconstrucción,
entrega o cierre. Las decisiones se registran exclusivamente en
`DECISIONES_Y_DUDAS.md`; las reglas técnicas se actualizan en su documento
canónico existente.

## Cómo registrar una entrega

Antes de confirmar un cambio que se publicará, agregar una entrada al inicio de
`## Entregas`. No registrar un archivo por cada cambio.

```md
### AAAA-MM-DD — Título breve de la entrega

- Alcance: módulos o documentos modificados y resultado observable.
- Decisiones: identificadores `D-XX` aplicados, o `ninguna`.
- Verificación: comandos, pruebas o revisión ejecutados y su resultado.
- Rama: nombre de la rama de publicación.
- Push: destino previsto `origin/<rama>`; después de publicarlo, anotar el hash o enlace del commit/PR publicado.
- Pendientes: límites conocidos o `ninguno`.
```

Si el push falla, registrar el estado como pendiente; no declarar una entrega
publicada hasta que Git confirme el push. No duplicar aquí decisiones ni listas
de archivos: usar los enlaces de Git, el commit o el pull request.

## Entregas

### 2026-11-18 — PDFs disponibles sin aprobación

- Alcance: retiro del flujo de aprobación de PDF en Documentos: vigencia desde la carga, filtros VIGENTE/ANULADO y textos/indicadores acordes. Albergue recibe sólo la actualización documental de la decisión.
- Decisión: D-13 confirmada por Eduardo: «No es necesaria esa aprobación, quita eso». No se modifican fichas, permisos por área ni migraciones históricas.
- Verificación: check completo aprobado (49 backend, 258 frontend y compilación; 3 omisiones explícitas de servidor), 72 pruebas PostgreSQL sin fallos y tres flujos reales React/HTTP/PostgreSQL/PDF sin aprobación. No se alteran fichas ni migraciones.
- Ramas: documentos para aplicación y documentación; albergue sólo para guías canónicas.
- Push verificado: [Documentos 655bccb](https://github.com/edujrubm/Sistema-Nuevos-Horizontes/commit/655bccb29e1ccc8b22a146c6b4fbaa96f0dcaadc) y [guías de Albergue ecf0d3d](https://github.com/edujrubm/Sistema-Nuevos-Horizontes/commit/ecf0d3d85b1d338f17412eda2ba571a6a42f98f3). Sin PR ni fusión a main; sin escrituras sobre BD compartida.


### 2026-11-18 — Albergue y Documentos preparados para revisión

- Alcance: persistencia de Albergue/Documentos en repositorios propios, operaciones simples con TypeORM, auditoría y frontend institucional. Incluye saneamientos mecánicos del lockfile, un import duplicado y pruebas desactualizadas. No modifica tablas, migraciones ni código funcional de compañeros.
- Decisiones: publicación autorizada por Eduardo en las ramas normales de cada módulo. D-02, D-03 y D-13 siguen explícitos; no se inventa sesión ni aprobación documental.
- Verificación: check completo por rama y en combinación (49 backend, 257 frontend, 3 omisiones explícitas de servidor); PostgreSQL 71/71/75 sin fallos. Flujo real React/HTTP/PostgreSQL/PDF aprobado en las tres áreas consumidoras. Ambos órdenes de fusión se verificaron sin conflictos.
- Ramas y destino: albergue → origin/albergue; documentos → origin/documentos. Base main 1bf827f. Los ajustes visuales de Legal/Social/Guardería quedan fuera de esta publicación.
- Push funcional publicado y verificado: [albergue 1fa9873](https://github.com/edujrubm/Sistema-Nuevos-Horizontes/commit/1fa9873dcf8360991858fce87199c2a9ec1036e7); [documentos 348d20b](https://github.com/edujrubm/Sistema-Nuevos-Horizontes/commit/348d20be2df114be4452374166d6e039f786fdef). Actualización atómica, sin force-push. Sin PR, fusión a main u operaciones sobre la BD compartida.



### 2026-11-17 — Consolidación de informes por módulo

- Alcance: los informes puntuales de integración, reconstrucción, QA y cierre de Social, Legal y Guardería se concentran en las guías globales de integración, planificación y verificación; la guía específica de Postman Social se incorpora al README general de Postman.
- Decisiones: ninguna; no se cambian contratos, migraciones ni reglas de negocio.
- Verificación: revisión de referencias y `git diff --check` al preparar la entrega.
- Rama: `main`.
- Push: pendiente de confirmar y publicar en `origin/main`.
- Pendientes: añadir entradas futuras sólo en este historial y actualizar las guías globales existentes.

### 2026-11-17 — Historial único y prohibición de nuevos Markdown

- Alcance: reglas globales, backend y frontend actualizadas para impedir nuevos archivos Markdown de contexto o avance; este historial pasa a concentrar las entregas y publicaciones.
- Decisiones: ninguna; es una convención de documentación solicitada por el equipo.
- Verificación: `git diff --check` sin errores.
- Rama: `main`.
- Push: pendiente de confirmar y publicar en `origin/main`.
- Pendientes: completar el hash o enlace del commit/PR después de que Git confirme la publicación.

### 2026-11-12 — Limpieza y centralización documental

- Alcance: se concentró la documentación vigente, se retiró contexto duplicado y se añadieron reglas globales para agentes de IA.
- Decisiones: D-09 actualizada para la revisión de ORM; demás reglas sin cambio de negocio.
- Verificación: revisión de enlaces Markdown y `git diff --check` sin errores al momento de preparar la entrega.
- Rama: `main`.
- Push: `5e2f629` publicado en `origin/main`.
- Pendientes: aplicar la regla de historial único a futuras entregas; no crear nuevos Markdown de contexto.

## Nota histórica

El 12 de noviembre de 2026 se retiraron documentos de contexto duplicado,
propuestas de esquema no aplicadas e informes puntuales de integración. Su
contenido permanece recuperable desde Git si se necesita rastrear una entrega
anterior.

## Normalización local de nombres de migraciones — 2026-11-24

Solicitada por Eduardo. Propuesta local basada en main: seis scripts pasan a
018–023, sin cambiar sus bytes SQL. Se corrigen referencias documentales y se
agrega mapa verificable de nombres y SHA-256. Las migraciones de otros módulos
se conservan. No hay cambio de esquema ni ejecución SQL. Publicación solicitada por Eduardo en la rama migraciones, con PR borrador hacia main y sin fusión.
Pendiente antes de integrar: cotejo del registro de migraciones de cada ambiente
por el encargado, para impedir que un archivo renombrado se aplique dos veces.

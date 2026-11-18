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

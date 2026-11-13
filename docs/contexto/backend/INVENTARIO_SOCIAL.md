> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Inventario para reconstruir Trabajo Social

Primer paso: diagnóstico del código local. No modifica comportamiento, esquema ni datos. No constituye validación de despliegue ni del módulo reconstruido.

## Estado y alcance

El servicio propio de Social está vacío. Su controlador y módulo dependen del núcleo heredado organizado por integrantes. Las páginas también usan el editor y listado heredados. Existe una entidad TypeORM para el detalle, pero su presencia no significa que todas las operaciones ya usen ORM.

Se conservarán las cinco secciones y el diseño actual. Social tendrá servicio, repositorios y páginas del dominio, reutilizando contratos neutrales y componentes comunes. No se duplicará el motor de formularios ni se utilizará Legal como dependencia de Social.

## Matriz de campos

Los siguientes son los mapeos actuales de la entidad a `new_horizons.ficha_social`; todos estos campos de detalle admiten NULL. El siguiente paso debe contrastarlos con el esquema vigente antes de escribir persistencia.

| Sección | Campo en API/TypeScript | Columna | Tipo PostgreSQL |
| --- | --- | --- | --- |
| Identificación | tipoVivienda | tipo_vivienda | text |
| Identificación | composicionFamiliar | composicion_familiar | text |
| Historia de violencia | historiaViolencia | historia_violencia | text |
| Historia de violencia | redesApoyo | redes_apoyo | text |
| Historia de violencia | dependenciaEconomica | dependencia_economica | boolean |
| Diagnóstico y riesgos | diagnosticoSocial | diagnostico_social | text |
| Diagnóstico y riesgos | riesgosIdentificados | riesgos_identificados | text |
| Diagnóstico y riesgos | planEliminacionRiesgos | plan_eliminacion_riesgos | text |
| Plan de intervención | objetivoGeneral | objetivo_general | text |
| Plan de intervención | actividades | actividades | text |
| Plan de intervención | responsablePlan | responsable_plan | text |
| Plan de intervención | fechaRevision | fecha_revision | date |
| Plan de intervención | areaCoordinacionId | area_coordinacion_id | bigint |
| Evaluación y cierre | evaluacion | evaluacion | text |
| Evaluación y cierre | resultadosAlcanzados | resultados_alcanzados | text |
| Evaluación y cierre | fechaCierre | fecha_cierre | date |
| Evaluación y cierre | observaciones | observaciones | text |

La llave del detalle es `formulario_id`, bigint representado como string. La cabecera `formulario_area` conserva expediente, área, tipo SOCIAL, estado, fecha de atención, profesional, capturista, fechas automáticas, versión, motivo e identidad al atender. Social no requiere niño. Las identidades y expedientes pertenecen al módulo de Beneficiarias; los catálogos y profesionales se reutilizan mediante sus contratos existentes.

## Contratos HTTP que se conservan

Todas las rutas incluyen el prefijo `/api/v1`.

| Método y ruta | Entrada o finalidad | Salida actual que debe preservarse |
| --- | --- | --- |
| GET /trabajo-social/beneficiarias/:id/fichas | Identificador, pagina y limite | datos, pagina, limite y total |
| GET /trabajo-social/beneficiarias/:id/resumen | Identificador de beneficiaria | beneficiariaId, expedienteId, totalFichas, ultimaAtencion, beneficiaria, ultimaFicha, historialReciente, camposSinSoporte y totalRiesgos |
| GET /beneficiarias/:id/formularios-area | tipo SOCIAL, cursor, limite y área opcional | data y page con nextCursor/hasMore |
| POST /beneficiarias/:id/formularios-area | DTO común de creación, tipo SOCIAL y detalle del área | Contrato común de formulario |
| GET /formularios-area/:id | Identificador del formulario | Cabecera y detalle conforme al presentador común |
| PATCH /formularios-area/:id | DTO común de actualización y versión | Contrato común y control de conflictos |
| POST /formularios-area/:id/confirmar | Transición conforme al DTO común | Contrato común de transición |
| POST /formularios-area/:id/descartar | Transición y motivo conforme al DTO común | Descarte lógico, sin borrar historial |

Los listados propios con páginas y el listado común con cursor tienen contratos distintos; no se deben intercambiar sus respuestas. Los errores conservan el contrato español común y sus detalles por campo.

## Vistas y navegación

- `/beneficiarias/:beneficiariaId/social`: listado del área y resumen.
- `/beneficiarias/:beneficiariaId/social/nueva`: alta con las cinco secciones anteriores.
- `/beneficiarias/:beneficiariaId/fichas/:fichaId`: acceso actual mediante editor genérico. Al separar Social se conservará la compatibilidad del enlace, sin alterar otras áreas.

La implementación futura estará en `frontend/src/modules/social`. Compartirá cliente HTTP, componentes visuales y contexto neutral; no un menú basado en distribución de trabajo.

## Hallazgos que deben resolverse

| Hallazgo | Consecuencia | Acción prevista |
| --- | --- | --- |
| Servicio vacío y controlador conectado al núcleo anterior | Social no es independiente | Servicio y repositorios propios, importaciones públicas y adaptador neutral |
| Consultas SQL de negocio heredadas | No cumple la reconstrucción con ORM | TypeORM para consultas y escrituras; auditoría de infraestructura separada |
| Resumen cuenta fichas y selecciona la última sin excluir descartadas | Puede presentar información descartada como vigente | Revisar semántica y aplicar filtros consistentes, con pruebas |
| Resumen depende de local_json_seguro | Una función ausente puede producir error de PostgreSQL | Reconstruir respuesta desde entidades/representaciones sin esa dependencia |
| Riesgos es texto y el resumen busca una tabla opcional de riesgos | Un total numérico no está respaldado siempre por el esquema | Mantener ausencia explícita; no inventar catálogo ni contar palabras |
| Resumen incorpora seguimientos | Existe dependencia del trabajo diferido de Evolución | Conservar contrato visible y coordinar su integración al final |
| Validación de areaCoordinacionId admite hasta 19 dígitos sin comprobar máximo bigint | Algunos valores pueden superar el rango PostgreSQL | Contrastar y reutilizar el validador común de identificadores |

No se eliminará la carpeta global heredada mientras Guardería, Documentos, Evolución u otros consumidores todavía la necesiten. Sí se retirarán todas las dependencias de Social hacia ella.

## Decisiones que no se deben inventar

- D-04: campos obligatorios para confirmar y transiciones institucionales pendientes.
- D-05: riesgos estructurados y significado de cierre/reapertura. Una fecha de cierre no autoriza a introducir un estado nuevo.
- D-02: identidad y autorización productivas; el contexto técnico local no las reemplaza.

## Línea base comprobada

Ejecución local del 13 de noviembre de 2026:

| Suite | Aprobadas | Fallidas |
| --- | ---: | ---: |
| Backend, Jest | 37 | 0 |
| Frontend, Vitest | 147 | 0 |

Evidencia JSON local ignorada por Git: `test-results/social-baseline-backend.json` y `test-results/social-baseline-frontend.json`. Estas suites establecen regresión del estado actual; no acreditan todavía persistencia ni flujo completo de un Social reconstruido. En este paso no se ejecutaron nuevas pruebas de escritura en PostgreSQL.

## Siguiente tarea

Contrastar tablas, tipos, relaciones y entidades con el esquema local vigente, sin modificarlo. Después implementar primero el listado propio de Social con TypeORM, conservando paginación y total; verificarlo antes de avanzar al resumen y las escrituras. La hoja evolutiva queda para el final.

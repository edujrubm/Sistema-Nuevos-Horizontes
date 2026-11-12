# Decisiones y dudas del proyecto

Este es el registro único para decisiones de producto, datos, seguridad y
operación. Una decisión **confirmada** describe lo acordado; una decisión
**implementada pendiente de despliegue** no se debe presentar como activa hasta
verificar el ambiente destino. Los agentes de IA no resuelven una entrada
pendiente: deben elevar su pregunta al equipo responsable.

## Decisiones confirmadas

| Tema | Decisión | Evidencia principal |
| --- | --- | --- |
| Estructura | Monorepo con backend NestJS en `src/` y frontend React/Vite en `frontend/`. | `package.json`, `frontend/package.json` |
| Persistencia | PostgreSQL es la fuente de verdad. Se usa TypeORM y SQL parametrizado cuando la operación compleja lo exige. | `ormconfig.ts`, repositorios y `GUIA_TECNICA.md` |
| API | Prefijo público `/api/v1` y contrato uniforme de errores. | `src/main.ts`, `CONTRATO_ERRORES_API.md` |
| Precisión de identificadores | Los identificadores de BD se tratan como cadenas en el borde API para no perder precisión de `bigint` en JavaScript. | Repositorios compartidos de formularios |
| Datos históricos | No se resuelven flujos mediante borrado físico de cabeceras, detalles o auditoría. | Migraciones y módulos de auditoría |
| Calidad local | El control integrado es `pnpm run check`; las migraciones no se aplican automáticamente al iniciar la API. | `package.json`, `database/migrations/README.md` |

## Dudas abiertas

### D-01 — Estado de migraciones por ambiente

- Estado: pendiente, prioridad crítica.
- Decisión requerida: mantener un registro verificable de qué migraciones se aplicaron en local, Neon/pruebas y producción; validar también funciones, triggers y catálogos requeridos.
- Impacto: errores de PostgreSQL como función inexistente y diferencias entre código y esquema.
- Evidencia: `database/migrations/` contiene scripts, pero Git no acredita su aplicación.

### D-02 — Identidad, sesión y autorización

- Estado: pendiente, prioridad crítica.
- Decisión requerida: proveedor de autenticación, ciclo de sesión, MFA, recuperación, identidad auditada y permisos por rol/área/caso.
- Impacto: las identidades técnicas locales no pueden convertirse en una solución de producción sin este acuerdo.

### D-03 — Almacenamiento y ciclo de vida de documentos

- Estado: pendiente, prioridad crítica.
- Decisión requerida: proveedor de objetos, credenciales, acceso firmado, antivirus, copias, retención, formatos permitidos y procedimiento de recuperación.
- Impacto: privacidad, disponibilidad y operación de documentos adjuntos.

### D-04 — Reglas completas de formularios

- Estado: pendiente.
- Decisión requerida: campos obligatorios por área y variante, repetibilidad, catálogos, flujo de corrección y transiciones autorizadas entre `BORRADOR`, `CONFIRMADO` y `DESCARTADO`.
- Impacto: validación, esquema, interfaces y reportes.

### D-05 — Reglas de Social y Albergue

- Estado: pendiente.
- Decisión requerida: riesgos y cierres estructurados de Social, significado/reapertura de `CERRADA`, relación entre Albergue y documentos/formularios, y manejo de eventos históricos migrados.
- Impacto: integridad del expediente y trazabilidad.

### D-06 — Reportes, impresión y firmas

- Estado: pendiente.
- Decisión requerida: responsables, alcance, indicadores, períodos, exportación, formatos imprimibles y tratamiento de firmas físicas o digitales.
- Impacto: reportes consolidados y cumplimiento operativo.

### D-07 — Despliegue y continuidad operativa

- Estado: pendiente.
- Decisión requerida: proveedor, separación de servicios, dominios/CORS, secretos, health checks, monitoreo, respaldos, RPO/RTO y criterios de carga/aceptación.
- Impacto: publicación segura y recuperación ante fallos.

### D-08 — Alcance de experiencia cliente

- Estado: pendiente.
- Decisión requerida: navegadores y dispositivos soportados, accesibilidad, internacionalización, pruebas end-to-end y licencias de plantillas o recursos externos.
- Impacto: criterios de aceptación del frontend.

### D-09 — Estandarización ORM para operaciones de Persona 3

- Estado: pendiente de revisión técnica.
- Decisión requerida: definir qué operaciones de los módulos de Persona 3 (`Social`, `Legal`, `Guardería`, `Evolución` y servicios compartidos) se migrarán a repositorios TypeORM estandarizados y cuáles conservarán SQL parametrizado por necesitar JSONB, CTE, bloqueos, funciones PostgreSQL o proyecciones complejas.
- Criterio obligatorio: no convertir una consulta sólo por eliminar SQL. Cada caso debe compararse con la guía de herramientas de `GUIA_TECNICA.md`, conservar transacciones, autorización, auditoría, paginación y resultado observable.
- Alcance de revisión: inventariar cada `query(...)`, identificar si vive en servicio o repositorio, justificar la herramienta elegida y priorizar primero las consultas simples que hoy estén fuera de un repositorio.
- Impacto: consistencia de persistencia, mantenibilidad y cobertura de pruebas; puede requerir cambios graduales en módulos compartidos.
- Evidencia: uso actual híbrido de TypeORM y SQL en `src/modules/persona3/`, formularios relacionados y repositorios compartidos.
- Resolución: dejar vacía hasta que se apruebe el inventario, responsable, orden de migración y criterios de aceptación.

## Formato para agregar o resolver una duda

Copiar este bloque. No marcar una decisión como confirmada sin responsable y evidencia.

```md
### D-XX — Título breve

- Estado: pendiente | en análisis | confirmada | implementada pendiente de despliegue | descartada.
- Responsable de decidir: nombre, rol o equipo.
- Fecha de registro: AAAA-MM-DD.
- Contexto: qué parte del sistema afecta y por qué se necesita decidir.
- Decisión requerida: pregunta concreta que el equipo debe responder.
- Opciones consideradas: alternativas y sus límites.
- Impacto: cambios previstos en datos, API, interfaz, seguridad, operación o pruebas.
- Evidencia: archivos, migraciones, incidencia o acuerdo que fundamentan el punto.
- Pregunta para el equipo: pregunta breve y concreta que requiere respuesta; indicar qué implementación queda bloqueada.
- Resolución: dejar vacía mientras esté pendiente; al resolver, indicar decisión, fecha, responsable y archivos actualizados.
```

Al resolverla, conservar el identificador, cambiar el estado, completar
`Resolución` y actualizar en el mismo cambio las migraciones, contratos o
guías técnicas afectados.

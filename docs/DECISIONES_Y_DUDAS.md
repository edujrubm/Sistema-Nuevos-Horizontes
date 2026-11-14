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

### D-09 — Estandarización ORM para operaciones de módulos de área

- Estado: pendiente de revisión técnica.
- Decisión requerida: definir qué operaciones de los módulos de módulos de área (`Social`, `Legal`, `Guardería`, `Evolución` y servicios compartidos) se migrarán a repositorios TypeORM estandarizados y cuáles conservarán SQL parametrizado por necesitar JSONB, CTE, bloqueos, funciones PostgreSQL o proyecciones complejas.
- Criterio obligatorio: no convertir una consulta sólo por eliminar SQL. Cada caso debe compararse con la guía de herramientas de `GUIA_TECNICA.md`, conservar transacciones, autorización, auditoría, paginación y resultado observable.
- Alcance de revisión: inventariar cada `query(...)`, identificar si vive en servicio o repositorio, justificar la herramienta elegida y priorizar primero las consultas simples que hoy estén fuera de un repositorio.
- Impacto: consistencia de persistencia, mantenibilidad y cobertura de pruebas; puede requerir cambios graduales en módulos compartidos.
- Evidencia: uso actual híbrido de TypeORM y SQL en `src/common/registros-area/`, formularios relacionados y repositorios compartidos.
- Resolución: dejar vacía hasta que se apruebe el inventario, responsable, orden de migración y criterios de aceptación.
- Avance acotado del 2026-11-12: Eduardo solicitó explícitamente rehacer Legal por módulo y dejar la rama `legal` preparada para revisión. Sus seis rutas y la variante `LEGAL` del motor común usan repositorios TypeORM; la auditoría y la edad histórica mantienen las excepciones PostgreSQL documentadas. El alcance y la verificación están en `src/modules/formularios/legal/README.md`. Esto no resuelve la migración de las otras áreas ni cambia las decisiones pendientes de producto, autenticación o despliegue.

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

### D-10 — Traslado y familiares en Guardería

- Estado: parcialmente resuelta; registro local del 13 de noviembre de 2026. Ver resolución parcial y D-12 para responsables; D-11 para paternidad.
- Contexto: el mockup solicita personas que llevan/recogen, personas adicionales autorizadas, datos de madre/padre y número de proceso de la madre. Los contratos HTTP revisados no entregan ni guardan estos bloques para Guardería.
- Impacto inicial: faltaba la captura de estos bloques. El avance actual de responsables está en D-12; no se presupone autorización a partir de paternidad u otro vínculo familiar.
- Pregunta: ¿en este ciclo se capturan aquí las personas que llevan/recogen, o solo se consultan autorizaciones registradas por otro módulo? Ejemplo: una abuela puede estar declarada como familiar sin permiso para recoger.
- Pregunta: ¿qué registro identifica a la madre y al padre del niño? No asignar automáticamente a la beneficiaria como madre si esa relación no está registrada.
- Pregunta: si hay varios procesos legales, ¿cuál número debe mostrarse en Guardería y quién autoriza su consulta? Ejemplo: dos juicios distintos de una misma beneficiaria.
- Continuación permitida: identificación del niño, ficha, fechas, situación familiar textual, escolaridad, salud y operaciones existentes con contratos ya definidos. Sin cambios de BD ni permisos nuevos.


### Resolución parcial D-10 — Madre y responsables de Guardería

- Estado: confirmada parcialmente; implementación local por completar.
- Responsable de decidir: Eduardo, tras consultar con el equipo.
- Fecha: 2026-11-13.
- Evidencia: respuestas explícitas del chat del proyecto.
- Resolución: todo niño atendido en Guardería tiene como madre a una beneficiaria con ficha inicial. Los datos de madre y padre deben consultarse desde esa fuente, sin duplicarlos ni editarlos en Guardería.
- Resolución: los responsables adicionales se registran dentro del módulo Guardería. Registrar uno lo autoriza a recoger y trasladar al niño. Sus datos acordados son nombre completo, CUI (etiqueta DPI/CUI), relación o parentesco y teléfono.
- Archivos de esta entrega: componente DatosMadreGuarderia, editor de Guardería y pruebas del componente. Se conserva el CUI enmascarado del contrato existente.
- Brecha encontrada: la ficha inicial implementada contiene personas agresoras, pero no identifica explícitamente al padre de cada niño. No se toma al agresor o cónyuge como padre por inferencia; se solicitó ubicación del campo.
- Pendiente técnico: el esquema revisado no incluye una tabla de autorizaciones de traslado. familiar_declarado depende de formulario_area y guarda parentesco_id, no una relación libre ni una autorización de Guardería. No se reutiliza como autorización de forma implícita.
- Pendientes independientes: selección de proceso legal de la madre y nuevo SQL de hoja evolutiva.

- Comprobación adicional: la entidad NinoEntity y GuardarHijoPaginaDto tampoco incluyen identidad del padre. El campo reconocido es booleano y no identifica a una persona. La opción «Padre» en hechos de violencia se refiere al vínculo del agresor con la beneficiaria, no a paternidad del niño.

### D-11 — Identidad del padre por niño y lugar de captura

- Estado: estructura autorizada e implementada localmente; captura e integración pendientes. Ver resolución D-11 al final de este documento.
- Responsable de decidir: equipo de proyecto y encargado de BD, con Eduardo.
- Fecha de registro: 2026-11-13.
- Contexto: existe familiar_declarado con vinculo PADRE asociado a formulario_area, pero no se encontró un flujo de captura de identidad del padre ni una relación explícita de paternidad por niño en ficha inicial.
- Decisión requerida: confirmar dónde se captura, cómo se vincula al niño, qué datos son opcionales y si se distingue padre biológico de padre legal.
- Opciones consideradas: adaptar el modelo existente o crear una tabla específica vinculada al niño. La propuesta padre_nino y sus columnas compartidas en el chat son orientativas, no un esquema aprobado.
- Impacto: ficha inicial, consulta de Guardería, contrato API, entidades ORM, auditoría y eventual migración nueva. No modificar migraciones aplicadas.
- Evidencia: revisión de NinoEntity, GuardarHijoPaginaDto, familiar_declarado, pantallas de ficha inicial, Psicología y consulta de Medicina; consulta en solo lectura al laboratorio local.
- Pregunta para el equipo: ¿capturamos al padre en la ficha inicial de cada niño? ¿Registramos una sola persona o diferenciamos padre biológico y legal? ¿Adaptamos familiar_declarado o aprobamos una tabla propia?
- Parte bloqueada: captura y persistencia de paternidad, migración y consulta definitiva de esos datos en Guardería. No asumir paternidad por vínculo de agresor ni autorización de recogida por paternidad.
- Resolución:
- Instrucción anterior: mantener en espera. Sustituida para la estructura por la autorización posterior de Eduardo de crear la tabla y distinguir vínculos biológico y legal.

### Trabajo independiente que puede continuar

- Responsables adicionales de Guardería: captura local implementada y probada según D-12; pendiente revisión del equipo e integración de autenticación definitiva.
- Revisar la correspondencia entre mockup y campos ya disponibles de Guardería; comprobar errores por campo, conservación de datos y navegación.
- Mantener y ampliar QA de los flujos existentes: borrador, reapertura, confirmación, conflictos de versión, inscripción y PDF.
- Mantener en espera la hoja evolutiva hasta recibir el SQL definitivo y el número de proceso materno hasta definir su selección y acceso.


### D-12 — Captura local de responsables adicionales de Guardería

- Estado: implementada localmente, pendiente de revisión e integración del equipo.
- Responsable de decidir: Eduardo; autorización explícita del 2026-11-13 para continuar responsables sin afectar otros módulos.
- Evidencia: respuestas «1. sí puede; 2. me parece» sobre autorización para recoger/trasladar y los cuatro datos; petición posterior de implementarlo siguiendo las reglas del repositorio.
- Resolución: registrar nombre completo, CUI, relación o parentesco y teléfono en Guardería. El registro constituye autorización para recoger/trasladar; no se deduce de paternidad.
- Implementación: tabla exclusiva guarderia_responsable vinculada a ficha_guarderia, creada mediante migración nueva 010. No se aplicó la propuesta 009_mockups_laboratorio ni se alteraron tablas de otros módulos.
- Contrato: GET y POST /api/v1/guarderia/beneficiarias/:beneficiariaId/fichas/:formularioId/responsables; PATCH en /:responsableId. Se usa la versión de la ficha, paginación y motivo. La API verifica caso, área y estado; identidad técnica habilitada solo en desarrollo/pruebas.
- Flujo conservado: captura y corrección ordinaria en borrador; fichas confirmadas quedan en consulta conforme al motor actual. No se amplían permisos ni se resuelve la corrección posterior a confirmación pendiente en D-04.
- Persistencia: repositorios TypeORM; auditoría y versión mediante mecanismos existentes, dentro de la misma transacción. Sin borrado físico ni cambio de formulario de origen.
- Verificación: 24 pruebas de integración aprobadas, incluida React/HTTP/PostgreSQL; 187 pruebas web aprobadas. La prueba web que exige servidor se ejecuta dentro del laboratorio y se omite en la suite ordinaria.
- Límites: no hay revocación nueva ni autorización productiva implementada. Paternidad D-11 y hoja evolutiva siguen pendientes. El chequeo global sigue bloqueado por crear-nino.dto faltante; no se alteró ese módulo.
- Archivos y evidencia detallados: QA_GUARDERIA_RESPONSABLES.md.


## Evidencia local adicional — revisión de Legal y Social (2026-11-13)

Por petición de Eduardo se corrigieron validaciones de cabecera y la correspondencia entre ficha y beneficiaria en la presentación del cliente. No cambia las decisiones de autenticación ni autoriza reglas nuevas. Legal pasó 31 pruebas de integración; Social 29; frontend 225; contratos/scripts de Postman 6. Informe: QA_LEGAL_SOCIAL_REVISION.md. No se realizaron operaciones Git ni cambios de esquema o BD compartida. La autorización definitiva del servidor y el bloqueo del DTO de Niños continúan pendientes.


### Resolución D-11 — autorización de estructura de paternidad (2026-11-13)

- Responsable: Eduardo, comunicando permiso del equipo para crear la tabla propuesta vinculada al niño.
- Evidencia: «Me dieron permiso de crear la tablas padre conectando a niño como lo planteamos» y respuesta explícita «Distinguir biológico y legal».
- Estado: estructura autorizada para desarrollo y pruebas locales; captura, consulta y autorización productiva por integrar.
- Resolución: nueva tabla padre_nino con nino_id, nombre, cui, telefono, direccion, fechas y version; tipo_vinculo distingue BIOLOGICO y LEGAL. Los datos personales son opcionales según la propuesta aprobada. No se presume identidad por agresor, convivencia o parentesco.
- Límite: no se ha definido un máximo institucional de personas por tipo ni unicidad global de CUI; no se impone UNIQUE(nino_id) ni UNIQUE(nino_id,tipo_vinculo). La misma persona puede tener ambos tipos mediante registros diferenciados, y compartir paternidad con varios niños.
- No concede autorización de recogida/traslado. La decisión de responsables de Guardería es independiente.
- Archivos previstos: database/migrations/011_padre_nino.sql; src/modules/ninos/entities/padre-nino.entity.ts; pruebas y ejecutor local propios.
- Se revoca la espera anterior solo para esta estructura aprobada. No se autoriza modificar la BD compartida, publicar a Git ni completar por inferencia reglas de captura/permisos aún pendientes.

- Resultado de D-11: migración 011 aplicada primero en PostgreSQL desechable y luego exclusivamente en guarderia_qa_c4fa143d (loopback 55510). Nueve pruebas de paternidad y 24 de regresión Guardería aprobadas. Entidad ORM añadida sin cambiar módulos/controladores existentes. Informe: QA_PADRE_NINO.md.


### Corrección de alcance D-11 — captura del padre en Guardería

- Estado: confirmada por Eduardo en el chat del proyecto.
- Fecha: 2026-11-13.
- Resolución vigente: Guardería recolecta los datos del padre del niño, distinguiendo BIOLOGICO y LEGAL. No se modifica ficha inicial ni su apartado de hijos para implementar esta captura.
- Sustituye la propuesta anterior de capturar paternidad desde ficha inicial. La madre se sigue consultando desde el expediente existente; no cambia su origen.
- La tabla padre_nino conserva su vínculo al niño. Su ubicación de captura será Guardería, sin inferir permisos de recogida/traslado por paternidad.
- Situación actual: captura, consulta y corrección implementadas localmente en Guardería; ver QA_CAPTURA_PADRE_GUARDERIA.md. No se modificó la pantalla de ficha inicial.


### Implementación local D-11 — captura de paternidad en Guardería

- Autorización: Eduardo solicitó implementar la captura después de confirmar que corresponde a Guardería y no a ficha inicial.
- Alcance: GET/POST /api/v1/guarderia/beneficiarias/:beneficiariaId/hijos/:ninoId/padres y PATCH en /:padreId; sección Madre y padre de Guardería. Reutiliza tabla y entidad de la migración 011, sin nueva migración.
- Registros independientes por niño y tipo BIOLOGICO/LEGAL, con datos personales opcionales. No se deduce permiso de recogida. No se copian datos de agresores ni se modifica ficha inicial.
- Correcciones: motivo y versión del registro paterno; auditoría transaccional. No cambian la versión de la ficha del área ni sus transiciones. Las escrituras comprueban niño y expediente activos. Los permisos definitivos siguen pendientes de autenticación; el contexto local solo opera en Guardería y se deniega en producción.
- Verificación: 30 pruebas de integración de Guardería (incluido React/HTTP/PostgreSQL), 234 pruebas web y 2 de contrato/scripts Postman aprobadas. Guardado y reapertura manual en Brave comprobados con datos ficticios.
- Informe: QA_CAPTURA_PADRE_GUARDERIA.md. Sin operaciones Git ni BD compartida; el DTO de Niños faltante continúa siendo un bloqueo del chequeo global.


### Avance local D-10 — estado civil y ocupación maternos

Por petición explícita de Eduardo, Guardería consulta estadoCivilId y ocupacionId del perfil materno existente y presenta sus nombres usando los catálogos actuales. No se duplica información ni se modifica ficha inicial, BD o contrato HTTP. La vista distingue ausencia de dato, referencia no resuelta y error de consulta; cada catálogo falla/reintenta por separado. Ver QA_GUARDERIA_DATOS_MADRE.md: 240 pruebas web y 31 de integración aprobadas. El proceso legal de la madre sigue pendiente de selección y acceso confirmados por el equipo.


### Resolución D-10 — número de hoja de vida de la madre

- Estado: confirmada por Eduardo; implementación local.
- Fecha: 2026-11-13.
- Evidencia: Eduardo aclaró que «hoja de vida» es la ficha inicial y confirmó el cambio.
- Resolución: el texto «Número de proceso de la madre» del mockup corresponde al número de ficha inicial de la madre. Guardería lo consulta desde fichaInicial del perfil del expediente; no consulta Legal ni crea otro identificador.
- Esta resolución cierra la duda anterior sobre selección de un proceso legal para este campo. No se añaden tablas, columnas, contratos o captura en ficha inicial.
- Presentación: se prioriza correlativo; si aún no existe, se conserva la convención de ficha inicial «Ficha #id», distinguiendo el identificador interno de un correlativo asignado. Sin ficha disponible se muestra Sin registrar.
- Archivos: NumeroFichaInicialMadre.tsx, GuarderiaEditorPage.tsx y pruebas; documentación de alcance actualizada.


### Nota de organización modular — 2026-11-14

Por la petición de Eduardo de separar la infraestructura y los paquetes de cada área, la entidad padre_nino de la reconstrucción de Guardería se ubica en src/modules/formularios/guarderia/entities/padre-nino.entity.ts. Sustituye la ubicación técnica prevista en Niños que figura en notas históricas anteriores. No cambia el esquema aprobado, su vínculo al niño ni la decisión de capturar en Guardería. La base común no instala esa entidad: entra únicamente con el paquete de Guardería.


### Alineación técnica del frontend — 2026-11-14

Eduardo solicitó alinear Legal, Social y Guardería con los módulos del equipo. Las reconstrucciones utilizan apiRequest y la representación ApiError.body públicas, useQuery/useMutation y el QueryClient existente. La fachada http.ts delega al mismo transporte y reexporta la misma clase para consumidores publicados; no define otra configuración ni otro cliente. Se conservan los borradores, la cancelación de consultas y el bloqueo ante respuestas de escritura inciertas. No cambia el contrato del backend ni las reglas de negocio.

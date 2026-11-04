# Integración de Documentos y frontend de Persona 3

Fecha: 4 de noviembre de 2026. Estado: entrega local para revisión del equipo. No se modificó `origin/main`, no se publicaron ramas y no se ejecutó SQL en la BD compartida.

## Qué se revisó

Se ejecutó `git fetch origin --prune`. Bases revisadas: main `441eda4`, schema-persona3 `3176ff9`, documentos `80c357a` y medicina `7f413a2`. Se leyó el resumen de integración a main, el plan frontend del 4 de noviembre y los mockups HTML del ZIP del 16 de octubre. Los documentos se usaron como referencias del alcance; la autorización para corregir backend proviene de la petición del usuario.

El trabajo está en una copia nueva, `Nuevos-Horizontes-Integracion-20261104`, rama LOCAL `integracion-local-20261104`. Las copias anteriores y la BD del grupo se conservaron. No hay ninguna rama remota nueva.

## Problemas encontrados y correcciones

| Problema comprobado | Cambio realizado | Resultado |
|---|---|---|
| Dos implementaciones pretendían registrar `POST beneficiarias/:id/documentos/cargas` | Un único DocumentosModule, una sola carga multipart con el archivo real | La prueba del router verifica que no existen pares método/ruta duplicados |
| Documentos devolvía 503 para solicitar/completar cargas y crear versiones | Se utiliza la carga PDF comprobada; una versión nueva usa documentoAnteriorId y motivoCambio | Ya no se promete una carga que nunca recibió un archivo |
| La rama documentos incluía también cambios de Albergue | No se fusionó esa rama completa; se reunió su alcance documental en el módulo único | No se arrastran endpoints de Albergue a esta entrega |
| Prefijos globales diferentes | Se conserva `api` de main; los controladores P3 declaran `v1` | Beneficiarias, motor compartido y P3 responden en `/api/v1`, sin `/v1/v1` |
| Dos filtros globales y dos validadores posibles | Se registra una sola infraestructura global P3, compatible con ErrorPublicoException y códigos conocidos de main | Contrato español de cinco claves y correlación por solicitud |
| El motor compartido rechazaba campos que 007 ya agregaba | Se ampliaron sus campos tipados: Social, Legal, Referencia y Guardería | El motor guarda los campos reales del esquema, incluida dependenciaEconomica booleana |
| El motor permitía confirmar una referencia vacía por otra ruta | Una validación pura se comparte con Legal y se ejecuta dentro de la transacción bloqueada del motor | Destino y motivo obligatorios en ambas vías |
| IDs bigint dentro de JSON podían perder precisión | Conversión en SQL antes de deserializar JSON | Los identificadores se conservan como texto |
| Historial de versiones solo retrocedía desde el documento consultado | Se busca la raíz y toda la cadena | Desde la primera o última versión se obtiene la cadena completa |
| Anulación guardaba el cambio pero presentaba mal el resultado UPDATE de TypeORM | Se vuelve a consultar el registro dentro de la misma transacción | Respuesta correcta, control de versión y archivo conservado |
| El runtime y migración 008 mezclaban cambios necesarios y experimentales | Se retiraron el módulo Laboratorio, sus páginas HTML y la exposición de estáticos. Se separó el SQL documental del experimental | La aplicación no habilita el laboratorio aunque llegue la variable antigua |
| Social dependía de la tabla experimental de riesgos | Cuando el catálogo no existe devuelve totalRiesgos=null y camposSinSoporte explícitos | No inventa un cero ni falla la consulta |
| Medicina tenía 96 archivos .jest-cache versionados | Limpieza en una copia de medicina y regla .gitignore | Commit local de limpieza `b2c1c1e`; no se modificó su implementación médica |

## Contrato único para Persona 4 y los demás consumidores

Base: `/api/v1`. Cada documento se vincula a formularioId, cuyo expediente debe pertenecer a la beneficiaria. El área procede del contexto del servidor. La simulación local se reemplazará por sesión autenticada; no es autorización productiva.

| Método | Ruta | Uso |
|---|---|---|
| POST | /beneficiarias/:id/documentos/cargas | multipart/form-data; archivo PDF, formularioId y categoria obligatorios |
| GET | /beneficiarias/:id/documentos | Lista paginada `{datos,pagina,limite,total}` del área |
| GET | /documentos/:id | Metadatos públicos, sin objetoPrivado |
| GET | /documentos/:id/versiones | Cadena completa `{datos,total}`, versiones descendentes |
| GET | /documentos/:id/archivo | Bytes PDF privados, comprobación de tamaño/hash y Cache-Control:no-store |
| POST | /documentos/:id/anular | JSON `{version,motivo}`; coordinación del área; anulación lógica |

La misma carga admite nombreDocumento, fechaDocumento YYYY-MM-DD, descripcion, documentoAnteriorId y motivoCambio. Para crear la siguiente versión se envía el nuevo archivo a la misma ruta, indicando documentoAnteriorId y motivoCambio. Se conservan los anteriores. Un único sucesor por versión, misma ficha y secuencia continua.

Se retiró el contrato de solicitud JSON/URL firmada/fase completar. Tampoco se conserva un POST versiones que solo devolvía 503. Persona 4 debe adaptar su cliente a la carga directa y a la respuesta paginada; no basta con fusionar su rama documentos antigua.

Solo PDF de documentos, máximo 20 MiB, extensión, MIME, firma y parseo real; se rechazan PDFs protegidos. El almacenamiento local es privado y usa claves relativas aleatorias. Firebase no está configurado ni se simula una URL firmada. Para otro proveedor habrá que reemplazar la persistencia de archivos conservando este contrato o acordar un cambio con el equipo.

Colección revisable: `postman/Documentos_Unificados.postman_collection.json`. Requiere seleccionar un PDF sintético y configurar IDs antes de ejecutarla; no se presenta como una colección automáticamente ejecutada.

## Base de datos: separación de propuestas

`database/migrations/008_documentos_integracion.sql` contiene exclusivamente el soporte documental y la función JSON que preserva bigint. Incluye nombre/revisión/versionado del registro documental, consistencia entre versiones, límite PDF e inmutabilidad de sus bytes. Es una migración propuesta y probada sobre datos sintéticos; no acredita aprobación institucional ni aplicación en el servidor del grupo.

`docs/propuestas/009_mockups_laboratorio.sql` conserva el SQL experimental de riesgos, autorizaciones de traslado, asignaciones, vínculo a ficha inicial y cierre Social. No está en el directorio de migraciones ejecutables ni lo aplican los scripts de integración.

Orden de instalación NUEVA: SQL base 01, ampliación 02 y migraciones 003,004,005,006,007,008_documentos_integracion. Los scripts de pruebas intercalan fixtures históricos para comprobar la migración; esos fixtures NO se usan en instalaciones reales.

Si una BD ya recibió el antiguo 008_local_mockups.sql, NO se ejecuta el nuevo 008 encima. Hay que revisar objetos equivalentes y el historial aplicado. Si hay PDFs históricos con cadenas incoherentes o formatos distintos, la migración fallará dentro de su transacción; no borra ni corrige datos en silencio. El equipo debe revisar copia y prevalidación antes de aplicarla. synchronize=false y migrationsRun=false.

## Frontend entregado

Workspace `frontend/`, React + Vite + TypeScript. No se encontraron en origin las tres ramas frontend citadas en el PDF; por eso se creó una base local pequeña, con cliente HTTP, controles y estilos separados para poder adaptar esta entrega a la base real de Persona 1/2.

- F3-01: resumen Social, lista, creación mínima, edición/reanudación de borrador y confirmación sobre el motor compartido real.
- F3-02: lista y consulta Legal, estado y campos del mockup.
- F3-03: referencias: crear, guardar, consultar, confirmar; confirmadas en solo lectura hasta iniciar una corrección autorizada con motivo.
- F3-04: lista de hijos, indicador de inscripción y apertura solo de inscritos; consulta de ficha infantil.
- F3-05: timeline por área, ficha y niño de Guardería, nuevas entradas y correcciones con fecha de atención, acción, profesional y motivo.
- F3-06: historial legible con antes/después, autor, fecha y motivo, paginado; solo con capacidad de consulta.
- F3-07: navegación conservando beneficiaria e hijo, regreso explícito al expediente.
- F3-08: acciones por capacidades recibidas por props/contexto; pruebas de consulta sin permisos. Integración de sesión real pendiente.
- FX-04: tokens institucionales compartidos, foco visible, etiquetas, responsive, carga diferida y listas paginadas.

La carga visual de archivos pertenece a Persona 4 en el plan frontend. No se duplicó una segunda pantalla de documentos en P3.

Los formularios conservan su texto si la petición falla y no reintentan escrituras automáticamente. Un 409 ofrece recarga de versión. Hay aviso de cambios pendientes al salir por enlaces, Atrás/Adelante y beforeunload mediante el data router. También se protege la captura de seguimientos; la base común deberá conservar el hook useCambiosPendientes al incorporar estas pantallas.

## Verificación y límites reales

Consultar PRUEBAS_20261104.md para resultados y comandos. Se verificó en navegador crear y confirmar una referencia desde React y recuperarla tras recargar. Evidencia sintética local en output/integracion_20261104/referencia-react-confirmada.png (fuera del repositorio).

Esta entrega local resuelve la duplicidad y está preparada para revisión técnica de integración. No equivale a aprobación del equipo ni a despliegue productivo: autenticación, catálogo de profesionales, base frontend común, aprobación del SQL y proveedor productivo de archivos siguen coordinándose. Psicología, Medicina y Albergue completos no se declaran integrados/probados aquí.

## Cómo integrar sin repetir el problema

1. Revisar el commit local de integración contra main. No fusionar además las cuatro ramas antiguas P3 o documentos: repetirían las implementaciones reemplazadas.
2. Revisar por separado el commit frontend; los cambios de backend están en el commit anterior.
3. En Medicina aplicar únicamente el commit local b2c1c1e a su rama, después revisar/validar Medicina por su responsable. No se fusionó su dominio médico en este bloque.
4. Aprobar y prevalidar SQL con el encargado de BD. Resolver DUDAS_EQUIPO_FRONTEND.md.
5. Ejecutar pnpm install --frozen-lockfile, pnpm build, pnpm test --runInBand, pnpm test:core y pnpm check:frontend. Usar PostgreSQL local y datos sintéticos.
6. Hacer revisión cruzada antes de publicar y fusionar. Este trabajo no creó un PR ni cambió main remoto.

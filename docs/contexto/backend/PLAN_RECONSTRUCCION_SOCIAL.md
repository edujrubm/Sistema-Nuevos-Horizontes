> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Plan de reconstrucción de Trabajo Social

Estado vigente: reconstrucción parcial local; ver [CIERRE_PARCIAL_SOCIAL.md](CIERRE_PARCIAL_SOCIAL.md). Fichas, consultas, frontend, conexión PDF y Postman implementados y comprobados en laboratorio. La captura evolutiva espera otro SQL, confirmado por Eduardo el 2026-11-13. No hay publicación remota ni acreditación productiva. Los avances siguientes conservan la secuencia histórica del trabajo.

Paso 1 completado: inventario y línea base en [INVENTARIO_SOCIAL.md](INVENTARIO_SOCIAL.md). Backend: 37 pruebas aprobadas; frontend: 147. Sin cambios de comportamiento o base de datos durante el inventario.

Paso 2 completado en la base de ensayo local: [VERIFICACION_ESQUEMA_SOCIAL.md](VERIFICACION_ESQUEMA_SOCIAL.md). Se contrastaron 66 columnas y se corrigieron el mapeo del nombre de área y el rango del identificador de coordinación. Compilación y 47 pruebas de backend aprobadas. No acredita otros ambientes.

Paso 3, listado completado: [RECONSTRUCCION_LISTADO_SOCIAL.md](RECONSTRUCCION_LISTADO_SOCIAL.md). Ruta conservada y repositorio TypeORM propio; 13 pruebas PostgreSQL/HTTP aprobadas y check general aprobado (47 backend, 147 frontend). Falta el resumen para cerrar el paso 3; su dependencia anterior permanece explícita.

Paso 3 completado: [RECONSTRUCCION_RESUMEN_SOCIAL.md](RECONSTRUCCION_RESUMEN_SOCIAL.md). Resumen ORM y consultas propias sin importar el núcleo heredado; interfaz pública de lectura de Evolución sin cambiar su captura. Total actual: 17 pruebas PostgreSQL/HTTP, 47 backend y 147 frontend aprobadas. Esquema local: 75 columnas comprobadas. Sigue el adaptador de escrituras del paso 4.

## Objetivo

PDF firmado conectado al módulo común: [INTEGRACION_PDF_SOCIAL.md](INTEGRACION_PDF_SOCIAL.md). Enlace desde ficha confirmada, precarga validada y comprobación de estado en backend; check aprobado con 161 pruebas frontend y 47 backend, más 57 de integración real. La selección automática en Brave quedó limitada por la extensión; la carga completa se verificó por HTTP. Sigue preparar Postman del dominio y revisión final; no adelantar la captura evolutiva pendiente.

Pasos 5 y 6 implementados en local: [RECONSTRUCCION_SOCIAL_REACT.md](../frontend/RECONSTRUCCION_SOCIAL_REACT.md). Páginas React propias de Social, rutas nuevas y puente del enlace histórico; 158 pruebas frontend y flujo de creación/recuperación verificado en Brave. El código propio no importa el editor anterior. Sigue la integración del PDF firmado y la preparación final de contratos/pruebas; captura evolutiva permanece diferida.

Paso 4 completado en laboratorio: [RECONSTRUCCION_ADAPTADOR_SOCIAL.md](RECONSTRUCCION_ADAPTADOR_SOCIAL.md). Adaptador ORM propio registrado en el motor, sin rutas duplicadas; 27 pruebas PostgreSQL/HTTP aprobadas, incluyendo auditoría, concurrencia y rollback. Sigue la separación del frontend de Social. Autorización productiva y reglas institucionales pendientes no se consideran resueltas.

Reconstruir el módulo por dominio, con TypeORM para su persistencia y React para sus vistas, conservando el diseño y los contratos aprobados. El área no dependerá del núcleo heredado organizado por integrantes ni de su configuración, fixtures, tipos o servicios. Las pruebas se ejecutarán sobre datos sintéticos y una base local independiente; no se publicarán cambios remotos sin instrucción expresa.

## Situación verificada

La línea base tenía un controlador delegado al núcleo heredado y un servicio propio vacío. Eso se sustituyó en los pasos 2 y 3: las entidades fueron contrastadas con PostgreSQL local y el controlador usa ahora el servicio y repositorios propios. Las páginas actuales están en frontend/src/modules/social; el editor anterior solo conserva un puente para resolver enlaces históricos y su configuración se reutiliza desde el dominio.

Otros consumidores del núcleo son Guardería, Documentos y Evolución; Albergue también importa validadores y contratos de esa ubicación. La carpeta global solo puede eliminarse cuando todos sus consumidores hayan sido separados. La reconstrucción de Social no se declarará limpieza completa del repositorio.

## Contratos que se conservan

Contenido institucional confirmado el 2026-11-13: [CONTENIDO_INSTITUCIONAL_SOCIAL.md](CONTENIDO_INSTITUCIONAL_SOCIAL.md). Se conserva ficha Social y seguimiento cronológico propio del área, separado de Legal. Firma en papel y carga del PDF firmado. Los campos y sus relaciones deben cubrir las imágenes allí conservadas; no introducir firma digital ni duplicar identidad o plan de tratamiento.

- GET /api/v1/trabajo-social/beneficiarias/:id/resumen.
- GET /api/v1/trabajo-social/beneficiarias/:id/fichas, con páginas y total.
- Creación y listado por beneficiaria mediante /api/v1/beneficiarias/:id/formularios-area, tipo SOCIAL.
- Consulta y edición mediante /api/v1/formularios-area/:id.
- Confirmación y descarte mediante las operaciones compartidas existentes.

No se crearán endpoints duplicados de formularios en el controlador del área.

## Orden de ejecución

Paso 7, alcance independiente de la hoja evolutiva, completado: colección de 30 peticiones y 65 comprobaciones; las 16 operaciones del alcance están cubiertas. Tres pruebas de contrato y 58 de integración aprobadas. Instrucciones en ../../../postman/Social_README.md. Paso 8 permanece parcial por los pendientes del cierre; no equivale a listo para PR o producción.

| Paso | Trabajo | Evidencia de cierre |
| --- | --- | --- |
| 1 | Inventariar vistas, campos, respuestas, consumidores y decisiones pendientes. Establecer línea base de pruebas. | Matriz campo-vista-tabla y contratos de entrada y salida. |
| 2 | Verificar el esquema local y completar los mapeos canónicos de Social. | Entidades alineadas con columnas, tipos y llaves existentes; sin synchronize ni migraciones automáticas. |
| 3 | Implementar SocialRepository y SocialService para listado y resumen propio. | Consultas TypeORM, filtros por expediente y tipo, orden estable, paginación y campos ausentes representados conforme al contrato. |
| 4 | Implementar SocialFormRepository usando FormularioAdapter y registrar SOCIAL desde SocialModule. | El motor compartido no importa el repositorio del área. Cabecera y detalle se escriben atómicamente; versiones y auditoría verificadas. |
| 5 | Implementar las páginas y API tipada en frontend/src/modules/social. | Secciones actuales conservadas: identificación, historia de violencia, diagnóstico y riesgos, plan de intervención y evaluación/cierre. |
| 6 | Integrar rutas del router general y retirar los consumidores de Social del núcleo anterior. | Lista, nuevo formulario y consulta/continuación accesibles; enlaces históricos resueltos sin afectar otras áreas. |
| 7 | Preparar fixtures, Postman y pruebas independientes. | Altas, reapertura, edición, errores por campo, confirmación, descarte, conflictos y auditoría contra PostgreSQL real; flujo en Brave. |
| 8 | Buscar referencias directas e indirectas heredadas, revisar cambios y ejecutar regresión. | Área independiente; informe con resultados y pendientes; sin publicación ni PR durante esta etapa local. |

## Organización prevista

Backend: src/modules/formularios/social/, con controlador, servicio, entidades, DTO, repositorios, validaciones y representaciones de salida propios.

Frontend: frontend/src/modules/social/, con API, páginas, componentes, configuración de secciones y hooks del área.

El área reutiliza el contrato y registro neutral de formularios, el manejo común de errores, la auditoría, los identificadores, el cliente HTTP y los componentes visuales existentes. No implementa otra identidad de beneficiaria ni otro motor de formularios.

## Reglas técnicas

- Persistencia de negocio mediante repositorios TypeORM; QueryBuilder únicamente dentro del repositorio cuando los joins o agregados lo requieran.
- Sin SQL CRUD directo en servicios o controladores. El contexto PostgreSQL de auditoría conserva la excepción de infraestructura documentada.
- Mutaciones con un mismo EntityManager, actor y motivo; bloqueo de cabecera y control de versión. No duplicar incrementos que ejecutan los triggers.
- Errores en español con campos identificados y valores de formulario conservados.
- Identificadores bigint como cadenas, sin pérdida de precisión; códigos comunes de estados y configuración neutral.
- Beneficiarias, expedientes, profesionales, catálogos y documentos conservan sus propietarios. Usar interfaces públicas y mapeos canónicos; no copiar sus reglas a Social.
- No modificar migraciones históricas ni usar la base compartida del equipo para probar.

## Límites y decisiones pendientes

Riesgos identificados es texto en el esquema revisado. No convertirlo en un catálogo ni calcular un total contando palabras o filas de una tabla inexistente. La decisión sobre riesgos estructurados y el significado de cierre permanece en D-05; las obligatoriedades y transiciones pendientes permanecen en D-04.

El resumen actual incorpora historial de seguimientos. Su contrato con el módulo propietario deberá confirmarse antes de sustituir esa parte. Mientras se revisa el esquema de seguimiento, se puede avanzar en fichas y componentes del resumen que no dependan de él. No sustituir una dependencia pendiente por datos inventados ni ocultar su ausencia como historial vacío.

La sesión y autorización reales siguen pendientes del módulo responsable. Los contextos técnicos de desarrollo no son una solución productiva.

## Criterios de aceptación

- Ningún archivo, import, tipo, variable, prueba, fixture o ruta propios de Social se organiza por integrante o requiere el núcleo heredado.
- Los repositorios de Social no utilizan el servicio de Legal ni repositorios privados de otras áreas.
- El motor se conecta mediante el registro de adaptadores, sin importaciones hacia Social.
- Se mantienen diseño, estados y reglas confirmadas; las decisiones pendientes quedan explícitas.
- Las pruebas propias arrancan el área y la infraestructura necesaria, sin toda la aplicación.
- Se verifica adicionalmente la integración local con AppModule completo y la regresión de los módulos existentes.
- La eliminación global del núcleo anterior queda acreditada solamente cuando no tenga consumidores en ninguna área.

## Seguimiento diferido

La captura de la hoja evolutiva muestra una validación nativa del control profesional: su patrón exige empezar con 1 a 9, por lo que rechaza 0067 antes de enviar la solicitud. Introducir 67 supera ese control; todavía se debe comprobar la existencia, confirmación y ámbito de la ficha elegida y las reglas del esquema. La revisión de persistencia e integración del seguimiento se deja para el final, conforme a la instrucción del equipo.

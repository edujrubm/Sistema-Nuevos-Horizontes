# Planificación técnica y estado de módulos

Este documento concentra planes de reconstrucción y estado técnico de módulos.
No crear planes, inventarios ni cierres por área; actualizar la fila aplicable
y registrar la publicación en `HISTORIAL_DOCUMENTAL.md`.

## Estado actual

| Tema | Estado técnico | Siguiente trabajo permitido |
| --- | --- | --- |
| Social | Cuenta con módulo backend y frontend propios, consultas TypeORM, ficha, listado, resumen, borrador, confirmación, descarte y vínculo dirigido a Documentos. | Mantener contratos y pruebas; la escritura de hoja evolutiva, riesgos estructurados y reglas institucionales sólo avanzan al resolver D-04 y D-05. |
| Legal | Variante propia integrada sobre el motor común de formularios. | Revisar operaciones simples de persistencia conforme a D-09, sin modificar contratos ni reglas institucionales no confirmadas. |
| Guardería | Cuenta con módulos propios y estructuras para responsables autorizados y paternidad. | Verificar el estado real de las migraciones 010 y 011 antes de desplegar; no ampliar permisos ni relaciones familiares sin decisión confirmada. |
| Documentos | El módulo común conserva carga, versión, anulación y asociación por formulario. | Resolver D-03 antes de asumir almacenamiento, enlaces, antivirus o ciclo de vida de producción. |
| Autenticación y autorización | Sólo hay contexto técnico de desarrollo; no equivale a sesión productiva. | Esperar resolución D-02; no introducir permisos o identidades inferidos. |

## Convenciones para reconstrucción o mejora

- Conservar rutas, contratos públicos, paginación, control de versión y
  respuestas de error salvo decisión explícita que los cambie.
- Mover persistencia simple a repositorios TypeORM; conservar SQL parametrizado
  sólo si JSONB, CTE, bloqueos, funciones PostgreSQL o proyecciones complejas lo
  justifican. Registrar la justificación por código y prueba, no en un informe nuevo.
- Extraer interfaces públicas para leer datos de otro módulo; no importar sus
  repositorios privados ni duplicar sus consultas.
- Mantener auditoría y datos relacionados dentro de la transacción que realiza
  la mutación. Los contextos de ensayo no son sustitutos de autorización real.
- Toda brecha de modelo, campo, estado, permiso o regla se registra como `D-XX`
  en `DECISIONES_Y_DUDAS.md` y se consulta al equipo antes de implementarse.

## Criterios de cierre técnico

Un módulo sólo puede declararse listo para integración cuando conserva sus
contratos, tiene pruebas pertinentes, compila, no depende de datos reales ni de
un ambiente local abierto, y sus migraciones o dependencias externas se han
verificado para el ambiente destino. La publicación se registra en el historial;
la disponibilidad de producción requiere además las decisiones operativas
pendientes.

## Revisión local de Albergue y Documentos — 2026-11-18

Base de ensayo: main `1bf827f7f344f7813ef1561078d3d6380adea833`, descargada antes de la instrucción de no operar Git. La revisión inicial se realizó localmente; Eduardo autorizó después publicar únicamente Albergue y Documentos en sus ramas normales. No se autoriza fusionar main ni operar la BD compartida.

### Qué contenía el trabajo y qué se conservó

Albergue ya implementaba panel, ingreso de beneficiaria e hijos seleccionados, estancia única activa, salidas temporales, retornos, egreso definitivo, nacimiento excepcional vinculado al expediente y un historial de eventos. El frontend tiene vistas propias de panel, ingreso, movimientos, cierres, nacimientos e historial. Documentos ya era el módulo único para PDFs: valida el archivo real, lo almacena en privado, lo asocia a un formulario, conserva versiones, lista y filtra por área, permite consultar bytes y anula sin borrar. Se conservan esas rutas y sus contratos; no se creó una agrupación por integrante.

No fue necesario descartar los flujos que ya funcionaban. La deficiencia técnica principal era la persistencia dentro de servicios. Albergue ahora tiene un servicio de casos de uso, un repositorio de escritura y otro de consultas. Documentos separa servicio de consulta/descarga, servicio de validación/almacenamiento de bytes y repositorios de metadatos/registro de carga. Las entidades nuevas sólo mapean tablas que ya existían; no se añadió ni modificó DDL.

Las consultas simples de documentos, áreas, inscripción, expediente, beneficiaria y catálogo usan TypeORM. Las escrituras simples de documentos, estancias, movimientos, hechos de Albergue e hijos usan repositorios o QueryBuilder de TypeORM. El SQL restante está parametrizado en repositorios: proyecciones JSONB, agregados, CTE recursivo de versiones, consultas con bloqueo de relaciones, reloj institucional y contexto auditado de PostgreSQL. No hay `query`, QueryBuilder ni acceso a repositorios en controladores o servicios de estos dos módulos.

Las mutaciones conservan el mismo EntityManager, bloqueos y auditoría dentro de su transacción. El evento de egreso conserva su motivo en el contexto auditado. La identidad técnica de Albergue se deniega en producción. Los DTO comunes ya no se importan desde Evolución. Se reutilizan las entidades públicas de Beneficiarias y Niños, sin modificar esos módulos ni copiar su captura. Las consultas compuestas del panel de Albergue leen la misma instantánea para evitar mezclar lista y conteo.

En React se conserva el transporte `apiRequest`, el error público y el QueryClient institucional. Las mutaciones de Albergue explicitan que no se reintentan. Documentos usa `useMutation` para carga/anulación y un bloqueo inmediato entre eventos, manteniendo progreso, cancelación y protección ante resultado incierto. La transferencia binaria conserva XHR/fetch porque entrega progreso y bytes; no es otro motor de formularios ni otra implementación de Documentos.

Las transacciones extensas permanecen juntas en el repositorio de escritura porque el ingreso, los vínculos infantiles y su evento deben confirmar o revertir juntos. El repositorio de lectura está separado; los umbrales de tamaño se revisaron como señales, sin dividir transacciones por cantidad de líneas.

### Límites que esta revisión no convierte en reglas

La autenticación/autorización productiva y almacenamiento definitivo siguen pendientes (D-02 y D-03). Eduardo confirmó en D-13 que los PDF no requieren aprobación. Se retiran los pendientes y filtros de revisión del flujo operativo; la carga válida queda vigente de inmediato. Las columnas históricas de revisión no se utilizan para autorizar el documento ni se alteran migraciones. El endpoint heredado de salidas pendientes devuelve un arreglo sin paginación; cambiar esa respuesta exige revisar sus consumidores. La escritura de hoja evolutiva sigue fuera de este cambio. Son límites explícitos; las pruebas locales no acreditan preparación productiva completa.


### Alcance de publicación

Cada rama incluye la base mecánica común y únicamente la reconstrucción de su módulo. El espaciado de Legal, Social y Guardería permanece local y queda fuera de esta publicación. Documentos sí lleva su propio ajuste de espaciado. Las entidades nuevas mapean tablas existentes; no se cambian migraciones.

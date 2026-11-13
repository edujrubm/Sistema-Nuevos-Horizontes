# Entrega de Legal y base común de módulos

Fecha: 13 de noviembre de 2026. Destino de revisión: rama legal. No se crea ni se fusiona un PR automáticamente.

## Qué hace este PR

- Conserva los cambios de main 332fd3b, incluidos admisión, ficha inicial e hijos.
- Reconstruye ficha Legal y referencias mediante entidades, repositorios y transacciones TypeORM. Conserva identificadores bigint como cadenas, auditoría, bloqueos y control de versión.
- Incorpora las pantallas React de Legal y referencias en el router institucional, manteniendo las cuatro secciones del formulario y mostrando errores por campo.
- Introduce un registro neutral de adaptadores de formularios. El motor compartido no importa repositorios privados de Legal ni Social.
- Retira el contenedor anterior basado en el reparto de integrantes. Guardería y Evolución conservan sus operaciones existentes en servicios de sus respectivos módulos; las utilidades compartidas quedan en src/common/registros-area/. No se presenta esta reubicación como reconstrucción ORM de esas otras áreas.
- Mueve el editor genérico de React a modules/formularios/ y la pantalla evolutiva a modules/evolucion/. Actualiza sus consumidores, sin cambiar rutas públicas ni añadir un menú por integrante.
- Actualiza imports de Documentos y Albergue hacia utilidades neutrales. Conserva sus contratos y reglas existentes. El helper compartido de auditoría continúa limitado a desarrollo/pruebas.
- Renombra scripts, fixtures, colección Postman y documentación de la agrupación anterior. Una prueba de arquitectura impide reintroducir esos nombres en código activo y herramientas.

La migración histórica 007 se conserva con su nombre y contenido originales. Es la única excepción de nomenclatura en los archivos actuales; cambiar una migración aplicada para limpiar un nombre pondría en riesgo su trazabilidad. Tampoco se reescribe el historial de commits.

## Qué no hace

No cambia el esquema ni las migraciones de database/, no activa synchronize ni migrationsRun, no lleva credenciales, datos reales, compilados, clústeres de ensayo o mecanismos del laboratorio. No reconstruye la captura evolutiva pendiente del SQL ni sustituye la autenticación del equipo.

El archivo de creación de Niños que falta en la base main lo está corrigiendo el compañero responsable. No se incluye en esta entrega. El encargado debe integrar esa corrección antes de exigir compilación completa o fusionar las ramas.

## Cambios de configuración local

Usar AREA_TEST_NOMBRE y AREA_TEST_ROL para el sustituto local de ámbito, DOCUMENTOS_DIR para el almacén privado y FORM_DRAFT_STATE_CODE / FORM_CONFIRMED_STATE_CODE / FORM_DISCARDED_STATE_CODE para los estados existentes. AUDIT_ACTOR_USERNAME identifica un usuario técnico ya presente en la BD de ensayo. Las variables antiguas no tienen alias silenciosos. Actualizar el entorno local a partir de .env.example; no modificar catálogos para acomodar una variable.

Estas variables técnicas no son permisos productivos. No eliminar sus protecciones para publicar la aplicación.

## Pruebas de esta preparación

- Tipos y compilación API/React; 38 pruebas Jest y 149 Vitest aprobadas.
- 29 pruebas PostgreSQL de Legal aprobadas: ficha, referencias, confirmación, corrección de referencias, auditoría, conflictos y reversión.
- 56 pruebas de regresión de áreas aprobadas, incluyendo Guardería, Evolución, Documentos, Albergue y peticiones Postman contra HTTP real.
- Dos comprobaciones de arquitectura aprobadas: nombres neutrales y ausencia de imports privados de áreas en el motor compartido.

La compilación completa se comprobó con un DTO temporal de Niños solo en el directorio local, excluido del commit. Esto verifica la compatibilidad bajo ese requisito de base; no acredita que main actual ya compile por sí mismo. Las pruebas SQL usaron clústeres desechables en loopback; no se conectaron a la BD del equipo.

## Orden para revisar e integrar

1. El compañero integra el DTO de Niños y el encargado confirma el esquema existente, catálogos, triggers y configuración del ambiente destino.
2. Actualizar esta rama desde main y repetir pnpm run check sin el DTO temporal. Revisar el diff y las pruebas PostgreSQL antes de fusionar.
3. Revisar Legal hacia main. No ejecutar fixtures ni migraciones por esta entrega.
4. Revisar Social sobre esta base común. Su rama contiene la base de Legal más un commit de Social; mientras Legal no esté integrado, comparar social contra legal para ver únicamente el segundo módulo. Si se usa squash para Legal, reconciliar esa base antes del PR de Social hacia main.

La entrega está preparada para revisión técnica; no certifica despliegue productivo sin autenticación ni garantiza cero regresiones. La hoja evolutiva, correcciones ordinarias de fichas confirmadas, revisión documental y las decisiones de producto pendientes conservan sus límites documentados.

## Revisión final

Se sincroniza la carga inicial del editor antes de permitir interacción, para evitar que una respuesta inicial sobrescriba texto recién ingresado. Las 17 pruebas específicas de React de Legal pasan. No cambia contratos ni persistencia.

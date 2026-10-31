> Actualización del 29 de octubre: este documento es histórico. Consulta [las decisiones vigentes](DECISIONES_VIGENTES.md). Las preguntas ya respondidas no deben reabrirse.

# Decisiones recibidas y pendientes - persona 3

Actualización: 27 de octubre de 2026. Fuente: respuestas directas del usuario en este chat y aclaraciones posteriores. Sustituye las hipótesis de AVANCE.md del día anterior donde haya diferencias.

| Pregunta | Decisión vigente |
|---|---|
| 1 | Las 14 rutas P3 son exactamente las de la página 4 del PDF, con /api/v1. Prueba automática de coincidencia. |
| 2 | Identificador de referencia y representación de IDs: por confirmar. Se conserva provisionalmente formulario_area.id y texto bigint. |
| 3 | Formato JSON, paginación y errores: por confirmar. Se conserva el contrato local documentado. |
| 4 | Contrato común: por confirmar; no depender del código ni endpoints P2 para resolver P3. |
| 5 | Se pueden corregir registros confirmados, con motivo e historial; se conserva el estado confirmado. |
| 6 | Preparar lista de mínimos de borrador y decidir con el usuario. Ver DATOS_OBLIGATORIOS_BORRADOR.md. No se inventan obligatoriedades institucionales. |
| 7 | SQL 01 y ampliación 02 últimos recibidos como base común. No aplicar parches antiguos 03/04. |
| 8 | Seguimientos solo después de confirmar el formulario. |
| 9 | Hoja por área, filtros existentes conservados. El ámbito se obtiene de contexto confiable del servidor, nunca de un filtro para conceder acceso. |
| 10 | Acción escrita libremente. Correcciones registradas en historial. |
| 11 | Resumen Social basado en mockup entregado; devolver datos disponibles y documentar campos sin soporte en SQL. |
| 12 | Consultar todos los hijos para seleccionar; abrir fichas únicamente de inscritos. Aclaración directa: ficha GUARDERIA confirmada acredita inscripción. |
| 13 | Limitar las APIs funcionales a P3 y no depender del desarrollo P2. No agregar campos Legal del mockup por suposición. |
| 14 | Historial con creación y correcciones, campos cambiados, autor, fecha y motivo. Consulta para coordinación de su propia área. |
| 15 | PDF asociado a su ficha; conexión documental coordinada con P4. Aclaración directa: agregar también carga PDF al alcance actual. |
| 16 | Entrega API; probar también pantallas. Laboratorio de verificación separado de las vistas finales. |
| 17 | Integración por rama de área; evolución compartida. Revisión en Jira conjunto. No se solicitó push. |

## Aclaraciones que ya no se deben volver a preguntar

- Legal atiende procesos y seguimientos de la beneficiaria, no de sus hijos. El SQL vigente coincide con esa regla. No se propone cambiarlo para aceptar hijos en Legal.
- Inscripción a Guardería: existencia de ficha GUARDERIA confirmada. No se inventa tabla de matrícula.
- También hacemos carga PDF. Se usa POST /beneficiarias/:id/documentos/cargas, ya contenida en el PDF en la sección documental. Es la única ruta agregada a las 14 P3; requiere acordar con P4 su propiedad final y que no se registre dos veces.
- No hacemos autenticación final en este ciclo. P3_TEST_AREA y P3_TEST_ROLE son contexto exclusivamente de laboratorio, no una sesión de producción.

## Pendientes para el grupo

1. Ratificar el ID de referencia y IDs como texto (pregunta 2).
2. Cerrar formato común de respuestas/errores/paginación (pregunta 3).
3. Cerrar los códigos reales de estado y la forma de integración que no cambie las 14 rutas (preguntas 4/5).
4. Resolver con el usuario la lista de mínimos y requisitos de confirmación (pregunta 6).
5. Revisar brechas Social/mockup con el SQL vigente, sin agregar campos unilateralmente (pregunta 11).
6. Coordinar con P4 propiedad de la ruta de carga, almacenamiento definitivo, nombres/metadatos y enlace con sus versiones/descargas.
7. Acordar nombres de rama de evolución/documentos y responsables de revisión en Jira antes de publicar.

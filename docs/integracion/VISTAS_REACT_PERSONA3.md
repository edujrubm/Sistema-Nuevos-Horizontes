# Índice de vistas funcionales React

Fecha: 4 de noviembre de 2026. Estas son vistas React que consumen el backend; no son los HTML de mockups. Los mockups del ZIP son la referencia de presentación. Persona 3 identifica las tareas asignadas y no se representa como un menú del sistema.

Frontend: http://127.0.0.1:5173. API: http://127.0.0.1:3016/api/v1. Los enlaces usan únicamente los registros sintéticos existentes en la copia local (beneficiaria 100, niño 100, fichas 1/2/3, referencia 6, entrada 1). No corresponden a personas reales.

Para que abran, ambos servidores locales deben estar activos. Las vistas nuevas comienzan sin guardar; solo una acción explícita de guardado escribe en la BD de prueba.

## Pantallas compartidas de entrada

- [Beneficiarias](http://127.0.0.1:5173/#/beneficiarias).
- [Expediente de la beneficiaria de prueba](http://127.0.0.1:5173/#/beneficiarias/100).

Son adaptadores de consulta de las API generales, no otra implementación del CRUD de Persona 1.

## Vistas de nuestras tareas

- [Trabajo Social: resumen y listado](http://127.0.0.1:5173/#/beneficiarias/100/social): Resumen y fichas sociales de la beneficiaria.
- [Ficha social](http://127.0.0.1:5173/#/beneficiarias/100/fichas/1): Las cinco páginas de la misma ficha social.
- [Nueva ficha social](http://127.0.0.1:5173/#/beneficiarias/100/social/nueva): Creación de borrador; guardar escribe en la BD local de pruebas.
- [Legal: listado](http://127.0.0.1:5173/#/beneficiarias/100/legal): Consulta de fichas legales y acceso a hoja de referencia.
- [Ficha Legal](http://127.0.0.1:5173/#/beneficiarias/100/fichas/2): Las cuatro páginas de la ficha Legal de la beneficiaria.
- [Referencias legales: listado](http://127.0.0.1:5173/#/beneficiarias/100/referencias): Listado de las referencias guardadas.
- [Nueva referencia legal](http://127.0.0.1:5173/#/beneficiarias/100/referencias/nueva): Captura, guardado y posterior confirmación.
- [Referencia legal guardada y vista previa](http://127.0.0.1:5173/#/beneficiarias/100/referencias/6): Consulta de una referencia confirmada y su vista previa; corrección con capacidad y motivo.
- [Guardería: niñas y niños](http://127.0.0.1:5173/#/beneficiarias/100/guarderia): Selección de inscritos; no da acceso a fichas de no inscritos.
- [Guardería: fichas del niño de prueba](http://127.0.0.1:5173/#/beneficiarias/100/guarderia/100): Listado de fichas infantiles del niño inscrito.
- [Ficha de Guardería](http://127.0.0.1:5173/#/beneficiarias/100/fichas/3): Las cinco páginas de la ficha infantil consultada.
- [Hoja evolutiva](http://127.0.0.1:5173/#/beneficiarias/100/evolucion): Nueva entrada, cronología, filtros y correcciones del área activa.
- [Historial de revisiones de una entrada](http://127.0.0.1:5173/#/beneficiarias/100/evolucion?historial=1): Abre el panel de historial existente dentro de la hoja evolutiva; no crea otra pantalla.

## Límites de esta entrega

- La hoja evolutiva utiliza el área activa del servidor. La sesión local está configurada actualmente para Legal; las otras áreas se prueban con su contexto de servidor correspondiente. No se concede un área por modificar el enlace.
- El historial exige capacidad de consulta y coordinación del área en el servidor; la configuración sintética local está preparada para comprobarlo.
- Documentos/Reportes y otros módulos del equipo aún no integrados no se presentan como pantallas operativas nuestras.
- Traslado/datos paternos y algunos catálogos aún no disponibles no se rellenan con ejemplos ficticios.
- Autenticación y permisos productivos siguen pendientes de integración. El servidor está limitado al entorno local.

## Documentos para el equipo

- [Informe de correcciones e integración](INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md).
- [Preguntas explicadas, ejemplos y texto para copiar](DUDAS_EQUIPO_FRONTEND.md).
- [Pruebas y límites](PRUEBAS_20261104.md).
- [Correspondencia visual con el ZIP y corrección de navegación](AJUSTE_VISUAL_MOCKUPS_20261104.md).

# Decisiones vigentes de nuestra asignación

Actualizado: 29 de octubre de 2026. Fuente: respuestas directas del usuario. Este documento sustituye los pendientes antiguos de los días 26 y 27 donde haya diferencias.

## Acuerdos cerrados

1. Se mantienen exactamente las 14 rutas P3 del PDF, con /api/v1, más la carga PDF autorizada.
2. El identificador de la referencia es `formulario_area.id`. Se conserva como texto bigint, sin crear un número adicional.
3. Las listas paginadas devuelven `{datos,pagina,limite,total}`. `total` cuenta todos los resultados filtrados antes de limitar la página.
4. Estados funcionales: borrador y confirmado. Una corrección autorizada conserva el estado confirmado y requiere motivo, versión actual e historial. No se añaden estados ni retorno automático a borrador.
5. El mínimo del borrador se define con criterio técnico coherente con SQL: beneficiaria con expediente, fecha/hora de atención y profesional; para Guardería también niño existente. No se exige texto narrativo en borrador.
6. El servidor asigna expediente, área/tipo según flujo, capturista, estado, ID, versión y captura. Al crear referencia se puede omitir `detalle`; se crea vacío. CUI y nombre no se vuelven a pedir.
7. Para confirmar referencia, destino y motivo de referencia son obligatorios y no admiten texto vacío o espacios. Origen y recomendaciones son opcionales.
8. Una referencia confirmada puede corregirse, pero no vaciar destino ni motivo. Si falla una confirmación/corrección, no cambia versión/estado/historial.
9. Seguimiento solo tras confirmar; acción libre, correcciones con motivo e historial; hoja por área y filtros conservados. Legal solo atiende beneficiarias.
10. Guardería lista todos los hijos para selección y abre solo fichas de inscritos. Una ficha GUARDERIA confirmada acredita inscripción.
11. El funcionamiento de nuestras áreas no depende de servicios, endpoints, código pendiente ni almacenamiento de otros compañeros. El soporte `persona3` es interno de nuestra entrega.
12. Los PDF se guardan de forma privada en nuestro almacenamiento local configurable y se vinculan a la ficha/expediente/área. No es requisito esperar una integración documental externa. La BD común conserva sus tablas y relaciones: no se duplican beneficiarias ni se cambia el SQL.
13. La entrega es de APIs; la pantalla de laboratorio se usa para verificarlas, sin sustituir el frontend aprobado.
14. La guía de errores en `../CONTRATO_ERRORES_API.md` define el formato a adoptar. Tener el documento no equivale a haber normalizado todas las excepciones existentes; esa implementación técnica debe verificarse aparte.
15. No hay push ni cambio de la BD compartida. La organización de entrega se hace para nuestras áreas, sin imponer a otros integrantes una tarea transversal como condición para funcionar.

## Única duda funcional que permanece abierta

**Campos del mockup Social sin correspondencia en el SQL vigente.** Ya se devuelve lo disponible. No se agregan columnas ni se mezclan datos por suposición. Ver REVISION_VISTAS.md.

No volver a preguntar por ID de referencia, formato de listas, mínimos de borrador, destino/motivo de confirmación, reglas de Guardería ni necesidad de almacenamiento compartido: ya fueron resueltos.

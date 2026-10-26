# Reportes, conteos y exportaciones

## Alcance autorizado

- Administración general consulta/exporta reportes institucionales aprobados.
- Coordinaciones consultan/exportan reportes de su área o ámbito.
- Dirección conserva las consultas expresamente concedidas por la matriz.
- El informe consolidado de acciones y avance sigue **pendiente**; no crear endpoint, permiso ni tabla editable para él.

## Semántica de conteo

Todo indicador declara:

1. período y zona horaria;
2. unidad: personas distintas, fichas, entradas, acciones, estancias o movimientos;
3. estado incluido/excluido;
4. área y ámbito;
5. tratamiento de anulaciones/correcciones;
6. fecha usada: atención, captura, ingreso o egreso.

“Acciones realizadas” se deriva de entradas confirmadas de hoja evolutiva agrupadas por acción, área y período. No se captura manualmente en el reporte. Una edición no aumenta el conteo; una nueva entrada sí. El catálogo observado —atención inicial, escucha activa, atención personalizada, atención legal, referencias, plan, coordinación, derechos, confidencialidad, llenado y apertura— es provisional.

## Albergue

- Concurrencia actual: estancias abiertas y presencia actual, separada entre beneficiarias e infantes.
- Ingresos: estancias iniciadas en el período.
- Egresos: estancias cerradas en el período.
- Salidas temporales y retornos: movimientos, sin confundirlos con egresos/ingresos nuevos.

No reportar camas o habitaciones porque no forman parte del alcance actual.

## Diseño técnico

Consultas simples pueden ejecutarse sobre índices operativos. Exportaciones grandes usan un trabajo con filtros inmutables, actor, ámbito, estado, expiración y checksum. Procesar por lotes/streaming para no cargar todo en memoria. Una URL de descarga expira y vuelve a autorizarse.

Usar vistas o vistas materializadas solo tras medir. Si se materializa, documentar frescura y mostrar fecha de corte. Los conteos históricos no deben cambiar por una edición de catálogo actual; conservar códigos/versiones relevantes.

## Protección

Aplicar el mismo ámbito a consulta y exportación. Limitar columnas según permiso, registrar generación y descarga, evitar fórmulas peligrosas en CSV y neutralizar celdas que comiencen con `=`, `+`, `-` o `@` cuando el formato lo requiera.

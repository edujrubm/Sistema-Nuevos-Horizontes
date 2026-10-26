# Cambios respecto a la propuesta reconstruida

## Fuente confirmada

Archivo original: `C:/Users/tzica/Documents/Codex/2026-10-10/ho/outputs/01_new_horizons_postgresql.sql`.
SHA-256 de la copia original incluida: `49c49b0a17ae4833c21c6dac9cd06fcaf31954f5159283d03668ccde421552aa`.
El archivo original es DDL de instalación nueva y declara que tampoco había sido ejecutado contra un servidor al prepararlo. No se considera una exportación verificada de producción.

## Diferencias resueltas

| Elemento | DDL original y tratamiento de la ampliación |
|---|---|
| Esquema | `new_horizons`, usado ahora por todas las tablas, funciones, vistas y pruebas. |
| PK y FK | `bigint`, con nombres originales de claves. Se referencian sin renombrarlas. |
| Geografía | El original ya tiene claves compuestas y controles de jerarquía; se preservan. |
| Ficha inicial | `fecha timestamptz`, `correlativo_ficha varchar(20) UNIQUE`, relatos varchar(200); se conservan, sin modificar longitudes. Los relatos nuevos de áreas son text. |
| Hijos | El nombre original admite NULL y género es varchar(1); no se endurecen ni reinterpretan. |
| Empleados | `supervisor bigint` es FK a empleado, con control de autosupervisión; se conserva, corrigiendo la suposición textual de la reconstrucción. |
| Usuarios | id_empleado obligatorio, nombre_usuario único, hashes como text; se conserva. |
| Áreas | nombre_area no es UNIQUE en el original; la ampliación reutiliza coincidencias y rechaza ambigüedad sin imponer unicidad global nueva. |
| Hoja evolutiva | `accion jsonb`, correlativo único. Se conserva íntegra; su contenido se migrará solo tras inspeccionar los datos. Las nuevas notas son filas en entrada_evolutiva. |
| Estancias | fecha_ingreso/egreso son date, sin hora. No se convierten a timestamp ni se inventa hora histórica. |
| Movimientos | salida timestamptz obligatoria, entrada opcional y secuencia validada en el original; se preservan. |
| Hijos en estancia | Fechas nuevas timestamptz; los límites respecto a estancia materna date se comparan por fecha civil en America/Guatemala. La hora exacta de ingreso materno requiere una futura migración separada. |
| Expediente unificado | Se crea un expediente único por beneficiaria. `ficha_inicial`, `formulario_area` y `nino` reciben `expediente_id`. Después del traspaso se eliminan sus conexiones directas redundantes con `beneficiaria`; la pertenencia se obtiene exclusivamente desde el expediente. |
| Pertenencia infantil | Se añade `UNIQUE(nino_id,beneficiaria_id)` para garantizar que un formulario infantil use un hijo de la beneficiaria. |
| Estancia abierta | Se añade índice parcial único por beneficiaria; si hay duplicados históricos, la transacción falla y se deben conciliar antes. |

## Verificación efectuada

Se leyó el archivo completo mediante análisis local y se compararon sus 45 tablas con las referencias de la ampliación. Se verificó la igualdad binaria de la copia del original, la existencia de destinos de FK en los CREATE TABLE nuevos, las columnas referenciadas y las correspondencias de 142 campos específicos de formularios. No se alteró la fuente ni se reemplazaron sus tablas.

Se conservan las pruebas preparadas para los nueve tipos, vínculo infantil del mismo expediente, detalle obligatorio, edad desconocida, auditoría y versión, corrección con motivo, acción obligatoria y bloqueo de borrado/reasignación. No fueron ejecutadas: no hay un motor PostgreSQL disponible. Esta revisión estructural no certifica sintaxis completa, ejecución de PL/pgSQL, permisos efectivos ni concurrencia.

## Contrato mínimo del backend

En cada transacción, el usuario se obtiene de la sesión autenticada y se establece mediante `set_config('new_horizons.actor_id', usuario_id, true)`; el motivo mediante `set_config('new_horizons.motivo', motivo, true)`. Usar motivo de registro inicial también al crear detalles, porque estos actualizan la versión de cabecera. Para corregir, bloquear la cabecera, comparar la versión del cliente y guardar todos los bloques en la misma transacción. Devolver su versión final, que puede aumentar varias veces por guardado.

Los estados, su autorización y obligatoriedad de campos se validan en servicio una vez aprobados. La fotografía de identidad al atender debe completarse al confirmar; el SQL valida solo su forma de objeto. Las FK no reemplazan la autorización por área y caso. Crear un rol de servicio con permisos mínimos; este paquete no crea usuarios de base de datos ni implementa RLS. El historial clínico debe tener acceso restringido.

## Pendientes funcionales conservados

- Aprobar estados, transiciones, catálogo de acciones, campos obligatorios y unidades médicas; confirmar HEA, E/F, IC, W y P/A.
- Validar con Psicología la estructura clínica, incluidos los ejes I–V del formulario fuente.
- El tipo médico adolescente se vincula por ahora a beneficiaria; definir el caso de una hija adolescente atendida.
- Definir múltiples demandados, responsables autorizados y firma por nota.
- Migrar hojas evolutivas JSON con correspondencias de origen, sin inventar autorías ni fechas ausentes.
- Completar idempotencia de altas y linealidad de versiones documentales en el servicio.
- Implementar y probar alternancia de movimientos de Albergue, concurrencia y cierre de estancias infantiles al egresar madre. El control temporal infantil al escribir no garantiza una modificación posterior compatible de la estancia principal.
- Probar restricciones, triggers, permisos reales, concurrencia y recuperación de respaldo antes de producción.

La matriz y el modelo de relaciones del paquete siguen siendo propuestas técnicas; las decisiones clínicas e institucionales pendientes no se convierten en aprobadas por disponer del SQL original.




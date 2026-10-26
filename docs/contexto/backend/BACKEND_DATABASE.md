# Diseño PostgreSQL

## Convenciones

- Tablas y columnas en `snake_case`; DTO TypeScript en `camelCase`.
- Claves foráneas terminan en `_id`.
- Fechas de instante usan `timestamptz`; fechas civiles como nacimiento usan `date`.
- Respetar los nombres del DDL v2 (`creado_en`, `actualizado_en`, `capturado_por`, `cargado_por`, `registrado_por` y `version`) y documentar cualquier futura normalización.
- Estados institucionales se modelan mediante catálogo o restricción documentada. No usar enum PostgreSQL hasta que los valores estén aprobados y su evolución sea conocida.
- Correlativos visibles no son claves primarias. Se generan atómicamente por secuencia o tabla de numeración.

## Integridad mínima

- Normalizar CUI para comparación y aplicar unicidad cuando no sea nulo, después de acordar reglas para documentos ausentes o repetidos históricos.
- `departamento.pais_id` y `municipio.departamento_id` deben concordar con la selección; validar en transacción o con claves compuestas.
- `beneficiaria.ocupacion_id` referencia el catálogo.
- Tablas puente tienen unicidad sobre sus claves para impedir selección duplicada.
- `documento_area` exige objeto privado único, MIME, tamaño positivo, SHA-256 y versión positiva; aún falta unicidad del número por cadena documental.
- `entrada_evolutiva` exige acción y contenido no vacíos; área y sujeto se resuelven desde `formulario_area`.
- Restricciones parciales protegen estados activos, además de las validaciones del servicio.

El DDL v2 ya incluye `uq_estancia_beneficiaria_activa` y `uq_estancia_nino_activa`. La secuencia de movimientos y una única salida temporal abierta todavía necesitan protección transaccional y, cuando se defina su representación, una restricción adicional en PostgreSQL.

## Transacciones y concurrencia

- Confirmar ficha: bloquear el borrador, comprobar versión, persistir secciones, relaciones, auditoría y correlativo en una transacción.
- Editar: `UPDATE ... WHERE id = ? AND version = ?`; cero filas produce `409 VERSION_CONFLICT`.
- Ingreso: bloquear identidad/estancia candidata y confiar también en índice único parcial.
- Salida/retorno/egreso: bloquear la estancia y su movimiento abierto.
- Nuevo nacimiento: crear `nino` dentro del expediente, registrar su relación funcional con la ficha inicial y crear la estancia infantil opcional en una sola transacción.
- Anular documento: bloquear documento vigente, persistir anulación y auditoría; el objeto no se elimina.

No mantener una transacción abierta durante carga de archivo, envío de correo o generación de PDF. Usar flujo en dos etapas con estado de carga y limpieza controlada.

## Índices iniciales

- Beneficiarias: CUI normalizado; nombre normalizado + fecha de nacimiento para coincidencias; estado.
- Fichas iniciales: `expediente_id`, correlativo y fecha.
- Formularios: `expediente_id + area_id + fecha_atencion`; `nino_id + area_id + fecha_atencion`.
- Evolución: `formulario_id + fecha_atencion`; evaluar área/acción según consultas medidas.
- Documentos: `formulario_id`, categoría, anulación y cadena de versiones; diseñar índices adicionales después de definir el documento lógico.
- Albergue: índices parciales activos ya definidos; medir movimientos por estancia y fecha.
- Auditoría: actor + fecha, recurso + identificador + fecha, tipo de evento + fecha.

Cada índice debe justificarse con `EXPLAIN (ANALYZE, BUFFERS)` usando volumen representativo. Evitar índices sobre relatos clínicos o sensibles salvo necesidad aprobada.

## Migraciones

1. Una migración por cambio coherente, con nombre descriptivo.
2. Separar adición, relleno y endurecimiento de restricciones cuando existan datos.
3. Probar avance y restauración en copia anonimizada; no asumir que un rollback destructivo es seguro.
4. Catálogos iniciales se cargan con seed versionado e idempotente.
5. Datos de prueba son sintéticos.
6. El despliegue valida que la versión de aplicación sea compatible con el esquema durante actualizaciones graduales.

## Respaldo y retención

PostgreSQL y el almacenamiento documental deben restaurarse al mismo punto lógico. Definir RPO/RTO, cifrado, pruebas periódicas de restauración y política de retención antes de producción. Un respaldo no probado no se considera recuperable.





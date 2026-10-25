# Modelo de dominio

## Identidad y acceso

- `UserAccount`: credenciales, correo institucional opcional, estado y empleado vinculado.
- `Session`: hash de token/identificador, emisión, expiración, revocación, IP y agente minimizados.
- `Role`, `Permission`, `Resource`: catálogos controlados.
- `RoleAssignment`: cuenta, rol, área opcional, caso opcional, vigencia y estado.
- `ExceptionalGrant`: recurso, acción, responsable, aprobador, ámbito, inicio, fin y revocación.

El diagrama preliminar contiene `usuario`, `empleado`, `rol`, `permisos`, `recursos` y `rol_permisos_por_recurso`, pero `empleado.rol_id` no representa roles múltiples ni ámbitos. La ampliación debe migrarse explícitamente.

## Beneficiarias y familia

- `Beneficiary`: identidad institucional, `cui` opcional según regla aprobada, nombre, `fecha_nac`, estado y catálogos generales.
- `Residence`: dirección y claves de país, departamento y municipio.
- `Child`: corresponde a `nino`; en v2 pertenece al `expediente` de la beneficiaria mediante `expediente_id` y puede tener CUI, nombre, fecha de nacimiento, sexo/género y reconocimiento.
- Madre, padre, cónyuge y responsables permanecen dentro del formulario hasta aprobar perfiles independientes.

La búsqueda de duplicados usa CUI cuando existe y coincidencias de nombre, fecha y vínculo cuando no. Nunca fusiona automáticamente.

## Ficha inicial

`InitialIntake` agrega cabecera, identificación, residencia, datos generales, salud, agresores, hijos, violencia, medios, riesgo, referencias, apoyo, entrevista, plan, seguimiento y observaciones. Puede tener campos repetibles y tablas puente (`agresores_ficha_inicial`, tipos de violencia, riesgos y referencias).

Estados propuestos: `DRAFT`, `CONFIRMED`, `INACTIVE`; deben aprobarse antes de crear enum rígido. Confirmar no vuelve inmutable la ficha: una corrección autorizada crea historial y aumenta `version`.

## Registros de área

- Psicología: variantes mujer y niñez; evaluación, examen mental, plan y seguimiento.
- Trabajo Social: ficha social y seguimientos asociados.
- Medicina: variantes niñez, mujer adolescente y mujer.
- Legal: ficha legal y hoja de referencia.
- Guardería: ficha ligada a un `Child` existente y a su responsable.

El DDL v2 materializa esa cabecera como `formulario_area` y crea detalles tipados: `psicologia_mujer`, `psicologia_ninez`, `psicologia_examen_mental`, `ficha_social`, `consulta_medica`, `ficha_legal`, `referencia_legal` y `ficha_guarderia`. `datos_generales_atencion` y `familiar_declarado` complementan la atención. Los campos clínicos/jurídicos están definidos, pero su obligatoriedad al confirmar continúa pendiente. `identidad_al_atender` usa JSONB y requiere un esquema contractual explícito.

## Hoja evolutiva

- La hoja es una proyección por sujeto y área sobre `entrada_evolutiva`, `formulario_area` y `v_hoja_evolutiva`.
- `entrada_evolutiva` conserva acción, contenido, plan, resultado, profesional, capturista, fechas, versión, motivo y origen idempotente.
- `revision_registro` conserva valores anteriores/nuevos, motivo, actor y fecha de cada corrección auditada.

Un seguimiento de área puede producir una entrada vinculada. `UNIQUE(origen_sistema, origen_id)` evita duplicarla cuando el mismo flujo se reintenta.

## Documentos y expediente

- `expediente`: contenedor persistente uno a uno con `beneficiaria`; agrupa ficha inicial, hijos y formularios.
- `documento_area`: cada fila representa una versión vinculada a un formulario, con objeto privado, MIME, tamaño, checksum y cargador.
- `documento_anterior_id`: encadena versiones; la anulación se guarda en la misma fila con fecha, responsable y motivo.

## Albergue

- `ShelterStay`: una persona alojada, ingreso, egreso y estado.
- `ShelterMovement`: `TEMPORARY_EXIT`, `RETURN` o `DISCHARGE`, con fecha del servidor, destino/responsable cuando aplique y registrador.
- Presencia es una proyección: estancia abierta sin salida temporal abierta significa “en sitio”.

V2 conserva `activos_albergue` para la beneficiaria y añade `estancia_nino`, vinculada tanto a la estancia principal como al hijo del mismo expediente. `movimiento_nino` modela salida temporal y retorno. La base impide dos estancias abiertas de la misma beneficiaria o del mismo hijo; la secuencia válida de movimientos aún corresponde al servicio.

## Invariantes transversales

1. Una referencia siempre apunta a una entidad existente y autorizada.
2. El área propietaria no cambia silenciosamente.
3. Cada mutación conserva autoría, tiempo, versión y auditoría.
4. Solo hay una estancia activa por persona.
5. Solo hay una salida temporal abierta por estancia.
6. Un retorno requiere salida abierta; un egreso requiere estancia abierta.
7. Una entrada evolutiva siempre tiene una acción.
8. Un documento anulado no vuelve a vigente mediante edición; una restauración, si se aprueba, es otra operación auditada.
9. Inactivar un expediente no elimina ni rompe relaciones históricas.



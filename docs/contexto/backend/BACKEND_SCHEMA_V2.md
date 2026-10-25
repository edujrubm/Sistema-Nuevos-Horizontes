# Esquema unificado v2 observado

## Estado de la evidencia

Este documento describe la ampliación definida en `02_ampliacion_formularios.sql` y contrastada con `D_diagrama_unificado.pdf`. El script indica revisión estática y está **pendiente de ejecutarse en PostgreSQL de ensayo**. Estas tablas y restricciones pertenecen al DDL propuesto v2, pero no deben asumirse desplegadas hasta verificar la migración.

`00_demo_formularios_aislado.sql` crea `new_horizons_demo`, usa datos ficticios y no modifica las tablas actuales. Es una demostración conceptual, no una migración de producción.

## Expediente contenedor

`new_horizons.expediente` establece una relación uno a uno con `beneficiaria` mediante `beneficiaria_id UNIQUE`. Contiene fechas y `version`; su identificador y beneficiaria no pueden reasignarse.

La migración crea un expediente para cada beneficiaria existente y cambia dos relaciones:

- `nino` incorpora `expediente_id NOT NULL` y elimina `beneficiaria_id`.
- `ficha_inicial` incorpora `expediente_id NOT NULL` y elimina `beneficiaria_id`.

Después de aplicar v2, el backend obtiene la beneficiaria de una ficha o un hijo a través de `expediente`.

## Catálogos y cabecera común

Se reutiliza `area` y se garantizan por nombre Psicología, Trabajo Social, Medicina, Legal y Guardería. Si existen nombres equivalentes duplicados, la migración se detiene.

`tipo_formulario` carga `PSICOLOGIA_MUJER`, `PSICOLOGIA_NINEZ`, `SOCIAL`, `MEDICINA_NINEZ`, `MEDICINA_ADOLESCENTE`, `MEDICINA_MUJER`, `LEGAL`, `REFERENCIA_LEGAL` y `GUARDERIA`, cada uno ligado a su área.

`estado_formulario` se crea sin datos iniciales. Los estados institucionales siguen pendientes y deben cargarse antes de insertar formularios.

`formulario_area` es la cabecera común. Conserva expediente, hijo opcional, área, tipo, estado, fecha de atención, profesional, capturista, fechas técnicas, versión, motivo de cambio, `identidad_al_atender` y documento de firma opcional. Las restricciones exigen hijo para Psicología niñez, Medicina niñez y Guardería, y lo prohíben para los tipos restantes. Expediente, sujeto, área y tipo quedan inmutables. Un disparador diferido exige el detalle correspondiente.

## Detalles de área presentes

- `psicologia_mujer`: motivo, historia, antecedentes, evaluación multiaxial, plan y datos declarados.
- `psicologia_ninez`: evaluación, desarrollo, embarazo/parto, sueño, lenguaje, conducta y relaciones.
- `psicologia_examen_mental`: solo para formularios psicológicos.
- `ficha_social`: violencia, diagnóstico, riesgos, plan, objetivo, actividades y evaluación.
- `consulta_medica`: detalle común para tres variantes, con antecedentes, examen, signos, impresión, tratamiento, laboratorios, referencia y cita.
- `ficha_legal`: demandado, diagnóstico, plan, proceso, juzgado, juicio y diligenciamiento.
- `referencia_legal`: destino, origen, motivo y recomendaciones.
- `ficha_guarderia`: ingreso, etnia, situación socioeconómica, vivienda, escuela, salud y observaciones.
- `datos_generales_atencion`: datos estructurados históricos con catálogos existentes.
- `familiar_declarado`: dato declarado o vínculo opcional con beneficiaria/hijo del mismo expediente.

Muchos campos permiten nulos. La base todavía no expresa cuáles son obligatorios al confirmar; el servicio debe aplicar las reglas institucionales aprobadas.

## Evolución e identidad histórica

`entrada_evolutiva` pertenece a `formulario_area`. Acción y contenido son obligatorios; también conserva plan, resultado, fechas, profesional, capturista, versión, motivo y origen idempotente. `UNIQUE(origen_sistema, origen_id)` evita duplicar entradas generadas por otro flujo.

`v_hoja_evolutiva` proyecta expediente, beneficiaria, hijo y área. La hoja por área se obtiene con `formulario_area.area_id`.

`v_identidad_formulario` resuelve nombre, CUI y fecha de nacimiento y calcula `edad_a_la_atencion` en `America/Guatemala`. No se persiste edad declarada. La estructura y minimización del JSON `identidad_al_atender` todavía deben documentarse.

## Documentos

`documento_area` vincula cada archivo con un formulario y conserva categoría, objeto privado, MIME, tamaño, SHA-256, versión, documento anterior, cargador y anulación. Anular exige conjuntamente fecha, usuario y motivo.

Cada versión es una fila encadenada con `documento_anterior_id`. V2 no contiene tablas separadas `documento`/`documento_version` ni unicidad del número de versión por cadena lógica. El backend no debe asumir el modelo documental anterior.

## Albergue infantil

`estancia_nino` vincula un hijo con una estancia principal de `activos_albergue`, registra ingreso/egreso/usuario e impide dos estancias abiertas para el mismo hijo. Un disparador valida el mismo expediente y fechas compatibles con la estancia principal.

`movimiento_nino` admite `SALIDA_TEMPORAL` y `RETORNO`. La alternancia y una única salida abierta todavía no están garantizadas por el DDL y requieren validación transaccional. Otro índice único parcial impide dos estancias activas de una beneficiaria.

## Auditoría, versión e inmutabilidad

`revision_registro` guarda tabla, registro, operación, valores anterior/nuevo, actor, motivo y fecha; es inmutable.

Los disparadores:

- exigen `SET LOCAL new_horizons.actor_id` en operaciones auditadas;
- exigen `SET LOCAL new_horizons.motivo` para actualizaciones;
- incrementan versión de expediente, cabecera y evolución;
- propagan cambios de detalles a la versión de cabecera;
- impiden borrado físico de tablas nuevas auditadas;
- impiden trasladar registros entre formularios.

NestJS debe establecer actor y motivo dentro de la misma transacción y conexión PostgreSQL antes de mutar. Un ORM que cambie de conexión entre `SET LOCAL` y la escritura rompería la auditoría.

## Aspectos por probar o completar

1. Ejecutar la migración completa sobre una copia de ensayo.
2. Probar `tocar_cabecera()` con `auditar()`: modificar un detalle actualiza la cabecera y las actualizaciones exigen motivo.
3. Aprobar y cargar `estado_formulario`.
4. Implementar validación de completitud al confirmar.
5. Completar la secuencia de `movimiento_nino`.
6. Decidir identificador lógico y unicidad de versiones documentales.
7. Confirmar auditoría/no borrado para tablas originales; esta ampliación no los agrega a `beneficiaria`, `nino` ni `ficha_inicial`.
8. Definir el esquema de `identidad_al_atender`.
9. Medir índices con datos representativos.

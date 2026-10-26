# Unificación sobre el SQL original de Nuevos Horizontes

Versión 2, 24 de octubre de 2026. Este paquete reemplaza la reconstrucción anterior basada en el PDF y toma como fuente el DDL aportado por el usuario. Añade un expediente único por beneficiaria y conecta dentro de él la ficha inicial y los nueve formularios de área mediante 19 tablas adicionales. `ficha_inicial`, `formulario_area` y `nino` quedan conectados exclusivamente al expediente; la beneficiaria se obtiene desde `expediente.beneficiaria_id`. `formulario_area` se mantiene como cabecera común y los formularios infantiles conservan su vínculo con el hijo. Los seguimientos sociales se registran como entradas evolutivas.

## Archivos y orden de uso

1. `01_new_horizons_postgresql.sql`: copia exacta del archivo original, 45 tablas en `new_horizons`. Solo para instalación nueva. Si ya se aplicó en la base objetivo, NO volver a ejecutarlo.
2. `02_ampliacion_formularios.sql`: ampliación sobre el esquema original; añade `expediente`, una clave única compuesta a `nino`, `expediente_id` en `ficha_inicial` y 18 tablas adicionales para formularios, seguimiento, documentación e historial. Se ejecuta una sola vez. Conserva las columnas y tipos originales.
3. `03_pruebas_integridad.sql`: datos sintéticos y pruebas con ROLLBACK, exclusivamente en una base de ensayo desechable.
4. `MODELO_Y_RELACIONES.md`, `MATRIZ_FORMULARIOS.md` y `DICCIONARIO_CAMPOS.csv`: explicación de relaciones y correspondencia de campos.
5. `CAMBIOS_Y_VALIDACION.md`: diferencias verificadas, limitaciones y verificación realizada.

## Aplicación y límites

En base de ensayo nueva, ejecutar los SQL 01, 02 y 03 con psql y `-v ON_ERROR_STOP=1`. En una base que ya tenga aplicado el original, contrastar primero su DDL vigente y ejecutar únicamente 02 tras ensayarlo en una copia. El script no es idempotente: una segunda ejecución debe fallar y revertir su transacción.

No se ejecutó ningún SQL sobre un servidor. Este entorno no tiene PostgreSQL disponible; la validación de ejecución y concurrencia permanece pendiente. Conocer el archivo original permite adaptar nombres, tipos y relaciones, pero no demuestra que una base desplegada coincida actualmente con él.

Los estados de formularios quedan como catálogo sin precarga institucional. Antes de usar la aplicación deben definirse sus valores y transiciones y los campos obligatorios por variante. Las pruebas usan un estado exclusivo de prueba y lo revierten.

La ampliación reutiliza las áreas por nombre normalizado en mayúsculas/minúsculas y espacios. Detiene la transacción si hay nombres equivalentes duplicados. Variantes como `Psicologia` sin tilde o abreviaturas deben conciliarse manualmente antes de ejecutar; no se fusionan IDs automáticamente.

El script anterior en esquema `nh` era una referencia reconstruida; no debe combinarse con esta versión. No se modificó el archivo fuente ni ninguna base existente.

## Prevalidación previa

Antes de ejecutar `02_ampliacion_formularios.sql`, ejecute `00_prevalidacion_solo_lectura.sql` y conserve su salida. Consulte `GUIA_PREVALIDACION.md` para interpretar el dictamen y documentar el ensayo.





# Migraciones SQL de la integración

Base general: SQL01 + ampliación02. Después ejecutar en orden 003,004,005,006,007 y 008_documentos_integracion.sql. No modificar ni repetir migraciones aplicadas.

003–006 se conservan como en main. 007 añade campos opcionales de los mockups. 008_documentos_integracion es una PROPUESTA nueva de soporte PDF y JSON seguro para bigint: se probó en una copia sintética; no se ejecutó en la BD compartida.

El anterior 008_local_mockups.sql mezclaba documentos y experimentos. No se incluye como migración operativa. El resto experimental quedó en docs/propuestas/009_mockups_laboratorio.sql y NO se ejecuta en los scripts de esta entrega.

Si la BD ya recibió el antiguo 008, detenerse y comparar objetos/historial antes de aplicar otro script. Si una cadena documental histórica incumple las nuevas restricciones, corregirla con el encargado de BD, con motivo e historial; no borrar datos para forzar la migración.

synchronize=false, migrationsRun=false. El arranque no ejecuta SQL compartido. Todavía se necesita acordar el registro formal de migraciones con el grupo. Consultar docs/integracion/INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md.

Se conserva también `007_estado_formulario_descartado.sql` de main: ambos scripts 007 tienen nombres diferentes y deben registrarse por nombre completo. Los estados FORM_* conservan los valores institucionales de main; los P3_* de las pruebas se configuran exclusivamente en su entorno aislado.

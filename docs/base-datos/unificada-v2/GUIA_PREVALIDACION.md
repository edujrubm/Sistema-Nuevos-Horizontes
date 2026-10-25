# Guía de prevalidación antes de ampliar la base

Ejecute `00_prevalidacion_solo_lectura.sql` antes de `02_ampliacion_formularios.sql`. Abre una transacción `READ ONLY`; no crea tablas, restricciones ni registros.

Use primero una copia restaurada o una base de desarrollo representativa. Con `psql`, guarde la evidencia completa:

```powershell
psql -X -v ON_ERROR_STOP=1 -d NOMBRE_BASE -f "00_prevalidacion_solo_lectura.sql" 2>&1 | Tee-Object "prevalidacion_antes_de_ampliar.txt"
```

En pgAdmin, cargue y ejecute el archivo completo y guarde los resultados. El último resultado debe decir `APTO PARA ENSAYAR 02 EN UNA COPIA/ENTORNO DE PRUEBA`. Si dice `NO APTO`, no ejecute 02; revise las filas `BLOQUEO`.

La comparación de áreas ignora mayúsculas y espacios, pero distingue tildes. `Psicologia` y `Psicología` deben conciliarse manualmente.

Conserve: respaldo usado, salida completa, fecha/base/usuario/versión, hash SHA-256 de 02, resultado del ensayo, conteo de las 19 tablas nuevas y responsable de autorizar el paso a la base principal.

Después de `APTO`, ejecute 02 primero sobre la copia. `03_pruebas_integridad.sql` se reserva para una base desechable y revierte sus datos sintéticos. La prevalidación no demuestra todavía triggers, concurrencia o integración con NestJS.



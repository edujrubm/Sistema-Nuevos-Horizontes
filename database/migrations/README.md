# Migraciones SQL

Cada archivo de este directorio es un cambio versionado de PostgreSQL. Una vez
aplicado en cualquier ambiente compartido no se modifica, renombra ni ejecuta
de nuevo como sustituto de una corrección: se crea una migración posterior.

El arranque de la API no aplica scripts automáticamente (`synchronize=false` y
`migrationsRun=false`). Antes de ejecutar una migración:

1. Identificar ambiente, respaldo y responsable.
2. Consultar el registro real de scripts aplicados y objetos requeridos.
3. Comparar el nombre completo del archivo y su alcance con la base destino.
4. Ejecutar sólo el script aprobado que falte y comprobar el resultado.
5. Registrar la evidencia en `docs/DECISIONES_Y_DUDAS.md` mientras no exista un registro operativo separado.

La existencia de un archivo en Git no acredita su aplicación en Neon, pruebas o
producción. En especial, verificar funciones, triggers, índices y catálogos de
los que dependa el backend antes de publicar código que los invoque.

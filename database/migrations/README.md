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

## Propuesta local de normalización del 24 de noviembre de 2026

Se reservan 018–023 para los seis scripts de formularios, documentos, Albergue
y Guardería cuyos prefijos colisionaban con otros módulos. Los demás SQL no
cambian. `equivalencias-nombres.json` conserva nombre anterior, nombre propuesto
y SHA-256 del contenido exacto. El SQL no fue editado: incluso sus comentarios
históricos se conservan para no alterar la evidencia de un script aplicado.

Este cambio de nombres es una propuesta de repositorio, no una migración de BD.
Antes de integrarlo, el encargado debe cotejar los nombres anteriores y hashes
con el registro de cada ambiente y reconocer ambos nombres como el mismo script.
Si un nombre anterior ya está aplicado, NO ejecutar el nuevo. No renombrar filas
del registro operativo ni alterar bases compartidas de manera automática.
Si no puede reconciliarse el historial, mantener los nombres históricos hasta
acordar una transición. La regla de inmutabilidad continúa vigente.

En una base nueva se requiere primero el esquema base aprobado 001/002 y luego
los scripts pendientes en orden. 019 depende de los cambios documentales de 018;
021 y 022 requieren tablas y funciones de auditoría del esquema base.
Los huecos numéricos no autorizan inventar ni ejecutar migraciones ausentes.

blob_git y sha256 identifican los bytes originales versionados. Las seis reglas
-text de .gitattributes evitan conversiones CRLF/LF de estos SQL históricos.

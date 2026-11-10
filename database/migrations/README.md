# Migraciones SQL
Guardar aquí las copias exactas de los scripts aprobados y aplicados, con prefijo
secuencial. No modificar el contenido de una migración aplicada.

Al 29 de octubre de 2026, el repositorio contiene las migraciones `003` a
`006` para el alcance de Persona 1. La aplicación efectiva en PostgreSQL se
comprueba por separado; no se infiere únicamente de que el archivo exista en
Git.

La migración `007_estado_formulario_descartado.sql` incorpora el estado aprobado
`DESCARTADO` para cerrar borradores sin eliminar físicamente su cabecera,
detalle ni auditoría.

La migración de Persona 3 agrega únicamente los campos opcionales identificados
al comparar los mockups con el esquema. No crea los catálogos, estados o
relaciones que todavía requieren una decisión institucional.

La propuesta de mockups locales parte de los scripts base `01` y `02`, y de las
migraciones anteriores. Fue probada en una base de datos local nueva; no se
ejecuta automáticamente al arrancar el backend y no acredita su aplicación en
la base de datos compartida.

Consultar `docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md` antes de integrar.
Los estados y endpoints experimentales no sustituyen las decisiones de negocio
pendientes ni adelantan la autenticación.
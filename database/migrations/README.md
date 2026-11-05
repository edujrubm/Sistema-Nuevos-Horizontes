# Migraciones SQL

Guardar aquí las copias exactas de los scripts aprobados y aplicados, con prefijo secuencial. No modificar una migración aplicada.

`007_persona3_campos_mockups.sql` agrega únicamente los campos opcionales aprobables
identificados al comparar los mockups de Persona 3 con el esquema. No crea los
catálogos, estados o relaciones que aún requieren decisión institucional.


## Correcciones de mockups y laboratorio

Se conservan las copias exactas de 003–006 provenientes de beneficiarias (5993ade).
La propuesta `008_local_mockups.sql` parte de 01+02 y 003–007. Se probó en una
BD local nueva; no se ejecuta automáticamente al arrancar el backend y este
push no acredita su aplicación en la BD compartida. No editar ni repetir
una migración aplicada: 008 se ejecuta una vez por base.

Consultar `docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md` antes de integrar.
Los estados y endpoints experimentales no sustituyen las decisiones de negocio
pendientes del equipo ni adelantan autenticación.

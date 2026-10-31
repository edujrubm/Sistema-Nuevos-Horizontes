-- Solo ejecutar en una copia vacía de V1 para pruebas. Todos los datos son sintéticos.
BEGIN;
INSERT INTO new_horizons.area (id_area,nombre_area,descripcion) VALUES (1,'Legal','Laboratorio local'),(2,'Médica','Aislamiento de pruebas');
INSERT INTO new_horizons.rol (id_rol,tipo_rol,id_area) VALUES (1,'Legal pruebas',1);
INSERT INTO new_horizons.empleado (id_empleado,nombre,rol_id) VALUES (1,'Empleado sintético',1);
INSERT INTO new_horizons.usuario(id_usuario,nombre_usuario,contrasena_hash,id_empleado) VALUES(1,'laboratorio-local','CUENTA_SIN_LOGIN_SOLO_PRUEBAS',1);
INSERT INTO new_horizons.tipo_violencia (tipo_violencia_id,tipo) VALUES (1,'Catálogo sintético');
SELECT setval(pg_get_serial_sequence('new_horizons.area','id_area'),(SELECT max(id_area) FROM new_horizons.area));
COMMIT;

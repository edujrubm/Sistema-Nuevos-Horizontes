-- Solo para probar migración de datos existentes de V1, nunca para una instalación real.
INSERT INTO new_horizons.beneficiaria(id_beneficiaria,nombre) VALUES(100,'Beneficiaria histórica sintética');
INSERT INTO new_horizons.nino(nino_id,nombre,beneficiaria_id) VALUES(100,'Infante histórico sintético',100);
INSERT INTO new_horizons.ficha_inicial(id_ficha_inicial,beneficiaria_id,observaciones) VALUES(100,100,'Contenido histórico a conservar');
SELECT setval(pg_get_serial_sequence('new_horizons.beneficiaria','id_beneficiaria'),100);
SELECT setval(pg_get_serial_sequence('new_horizons.ficha_inicial','id_ficha_inicial'),100);

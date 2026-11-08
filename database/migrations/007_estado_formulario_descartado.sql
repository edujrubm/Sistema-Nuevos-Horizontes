BEGIN;

INSERT INTO new_horizons.estado_formulario (codigo, descripcion)
VALUES ('DESCARTADO', 'Borrador descartado de forma lógica')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

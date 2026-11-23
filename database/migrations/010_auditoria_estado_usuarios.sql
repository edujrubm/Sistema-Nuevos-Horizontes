BEGIN;

-- Auditoría de activación y desactivación de cuentas.
-- Nunca registra contraseñas ni hashes.

CREATE OR REPLACE FUNCTION new_horizons.auditar_estado_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor BIGINT;
    v_motivo TEXT;
BEGIN
    -- Registrar únicamente cambios del estado activo.
    IF OLD.activo IS NOT DISTINCT FROM NEW.activo THEN
        RETURN NEW;
    END IF;

    -- Obtener el contexto establecido por NestJS.
    v_actor := NULLIF(
        CURRENT_SETTING('new_horizons.actor_id', TRUE),
        ''
    )::BIGINT;

    v_motivo := NULLIF(
        BTRIM(CURRENT_SETTING('new_horizons.motivo', TRUE)),
        ''
    );

    -- Rechazar modificaciones sin responsable.
    IF v_actor IS NULL THEN
        RAISE EXCEPTION
            'Se requiere new_horizons.actor_id para modificar el estado de un usuario';
    END IF;

    IF v_motivo IS NULL THEN
        RAISE EXCEPTION
            'Se requiere un motivo para modificar el estado de un usuario';
    END IF;

    -- Registrar únicamente información administrativa.
    INSERT INTO new_horizons.revision_registro (
        tabla,
        registro_id,
        operacion,
        anterior,
        nuevo,
        actor_id,
        motivo
    )
    VALUES (
        'usuario',
        NEW.id_usuario::TEXT,
        'UPDATE',
        JSONB_BUILD_OBJECT(
            'activo', OLD.activo,
            'desactivado_en', OLD.desactivado_en,
            'desactivado_por', OLD.desactivado_por
        ),
        JSONB_BUILD_OBJECT(
            'activo', NEW.activo,
            'desactivado_en', NEW.desactivado_en,
            'desactivado_por', NEW.desactivado_por
        ),
        v_actor,
        v_motivo
    );

    RETURN NEW;
END;
$$;

-- Evitar duplicar el trigger si la migración se ejecuta nuevamente.
DROP TRIGGER IF EXISTS auditoria_estado_usuario
ON new_horizons.usuario;

CREATE TRIGGER auditoria_estado_usuario
AFTER UPDATE OF activo
ON new_horizons.usuario
FOR EACH ROW
WHEN (OLD.activo IS DISTINCT FROM NEW.activo)
EXECUTE FUNCTION new_horizons.auditar_estado_usuario();

COMMIT;
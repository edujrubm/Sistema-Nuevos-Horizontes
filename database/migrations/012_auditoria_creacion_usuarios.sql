BEGIN;

-- Auditoría administrativa de usuarios.
-- Registra creación y cambios de estado.
-- Nunca almacena contraseñas, hashes ni tokens.

CREATE OR REPLACE FUNCTION new_horizons.auditar_estado_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor BIGINT;
    v_motivo TEXT;
    v_anterior JSONB;
    v_nuevo JSONB;
BEGIN
    -- Ignorar actualizaciones que no cambian el estado.
    -- Esta condición solo aplica a UPDATE.
    IF TG_OP = 'UPDATE' THEN
        IF OLD.activo IS NOT DISTINCT FROM NEW.activo THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Obtener el administrador responsable.
    v_actor := NULLIF(
        CURRENT_SETTING('new_horizons.actor_id', TRUE),
        ''
    )::BIGINT;

    -- Obtener la justificación administrativa.
    v_motivo := NULLIF(
        BTRIM(CURRENT_SETTING('new_horizons.motivo', TRUE)),
        ''
    );

    IF v_actor IS NULL THEN
        RAISE EXCEPTION
            'Se requiere new_horizons.actor_id para auditar usuarios';
    END IF;

    IF v_motivo IS NULL THEN
        RAISE EXCEPTION
            'Se requiere un motivo para auditar usuarios';
    END IF;

    IF TG_OP = 'INSERT' THEN

        -- No existe estado anterior para un usuario nuevo.
        v_anterior := NULL;

        -- Registrar únicamente datos administrativos.
        v_nuevo := JSONB_BUILD_OBJECT(
            'id_empleado', NEW.id_empleado,
            'nombre_usuario', NEW.nombre_usuario,
            'activo', NEW.activo
        );

    ELSIF TG_OP = 'UPDATE' THEN

        -- Conservar el comportamiento de auditoría anterior.
        v_anterior := JSONB_BUILD_OBJECT(
            'activo', OLD.activo,
            'desactivado_en', OLD.desactivado_en,
            'desactivado_por', OLD.desactivado_por
        );

        v_nuevo := JSONB_BUILD_OBJECT(
            'activo', NEW.activo,
            'desactivado_en', NEW.desactivado_en,
            'desactivado_por', NEW.desactivado_por
        );

    END IF;

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
        TG_OP,
        v_anterior,
        v_nuevo,
        v_actor,
        v_motivo
    );

    RETURN NEW;
END;
$$;

-- Sustituir el trigger anterior por uno que también audite INSERT.
DROP TRIGGER IF EXISTS auditoria_estado_usuario
ON new_horizons.usuario;

CREATE TRIGGER auditoria_estado_usuario
AFTER INSERT OR UPDATE OF activo
ON new_horizons.usuario
FOR EACH ROW
EXECUTE FUNCTION new_horizons.auditar_estado_usuario();

COMMIT;
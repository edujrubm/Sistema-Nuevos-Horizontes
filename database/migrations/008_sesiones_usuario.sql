-- =========================================================
-- NUEVOS HORIZONTES
-- MIGRACIÓN 008: GESTIÓN DE SESIONES
-- =========================================================
--
-- Permite registrar, consultar y revocar sesiones JWT.
-- No modifica la matriz de permisos institucional.
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS new_horizons.sesion_usuario (
    id_sesion UUID PRIMARY KEY,

    id_usuario BIGINT NOT NULL
        REFERENCES new_horizons.usuario(id_usuario),

    creado_en TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    expira_en TIMESTAMPTZ NOT NULL,

    revocado_en TIMESTAMPTZ,

    CONSTRAINT chk_sesion_fechas
        CHECK (expira_en > creado_en),

    CONSTRAINT chk_sesion_revocacion
        CHECK (
            revocado_en IS NULL
            OR revocado_en >= creado_en
        )
);

-- Facilita buscar las sesiones de un usuario.
CREATE INDEX IF NOT EXISTS idx_sesion_usuario
ON new_horizons.sesion_usuario (id_usuario);

-- Facilita consultar sesiones vigentes.
CREATE INDEX IF NOT EXISTS idx_sesion_usuario_vigente
ON new_horizons.sesion_usuario (id_usuario, expira_en)
WHERE revocado_en IS NULL;

COMMIT;
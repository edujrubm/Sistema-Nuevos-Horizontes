BEGIN;

-- Restablecer contraseñas de otras cuentas es una
-- operación administrativa exclusiva del Administrador General.

-- Eliminar el permiso de los demás roles.
DELETE FROM new_horizons.rol_permisos_por_recurso rp
USING new_horizons.rol r,
      new_horizons.permisos p,
      new_horizons.recursos rec
WHERE rp.id_rol = r.id_rol
  AND rp.id_permisos = p.id_permisos
  AND rp.id_recursos = rec.id_recursos
  AND p.tipo_permisos = 'restablecer'
  AND rec.tipo_recursos = 'usuarios'
  AND r.tipo_rol <> 'administrador_general';

-- Garantizar que el Administrador General conserve el permiso.
INSERT INTO new_horizons.rol_permisos_por_recurso (
    id_rol,
    id_permisos,
    id_recursos
)
SELECT
    r.id_rol,
    p.id_permisos,
    rec.id_recursos
FROM new_horizons.rol r
CROSS JOIN new_horizons.permisos p
CROSS JOIN new_horizons.recursos rec
WHERE r.tipo_rol = 'administrador_general'
  AND p.tipo_permisos = 'restablecer'
  AND rec.tipo_recursos = 'usuarios'
  AND NOT EXISTS (
      SELECT 1
      FROM new_horizons.rol_permisos_por_recurso rp
      WHERE rp.id_rol = r.id_rol
        AND rp.id_permisos = p.id_permisos
        AND rp.id_recursos = rec.id_recursos
  );

COMMIT;
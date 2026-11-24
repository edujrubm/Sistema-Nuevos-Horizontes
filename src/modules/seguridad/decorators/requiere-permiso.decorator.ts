import { SetMetadata } from "@nestjs/common";

export const REQUIERE_PERMISO_KEY = "requiere_permiso";

export interface PermisoRequerido {
  permiso: string;
  recurso: string;
}

export const RequierePermiso = (permiso: string, recurso: string) =>
  SetMetadata(REQUIERE_PERMISO_KEY, {
    permiso,
    recurso,
  } satisfies PermisoRequerido);

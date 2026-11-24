import { apiRequest } from "@/shared/api/http-client";

function securityApiBase() {
  const explicit = import.meta.env.VITE_SECURITY_API_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const shared =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
  return shared ? shared.replace(/\/v1\/?$/, "") : "/api";
}

const requestOptions = () => ({ baseUrl: securityApiBase() });

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  debe_cambiar_contrasena: boolean;
  usuario: {
    id_usuario: string;
    nombre_usuario: string;
    empleado: { id_empleado: string; nombre: string };
    rol: { id_rol: string; tipo_rol: string; id_area: string | null };
  };
}

export interface ProfileResponse {
  mensaje: string;
  usuario: {
    id_usuario: string;
    id_empleado: string;
    id_rol: string;
    tipo_rol: string;
    id_area: string | null;
    id_sesion: string;
  };
}

export function login(username: string, password: string) {
  return apiRequest<LoginResponse>(
    "/seguridad/login",
    {
      method: "POST",
      body: JSON.stringify({ nombre_usuario: username, contrasena: password }),
    },
    requestOptions(),
  );
}

export function getProfile(signal?: AbortSignal) {
  return apiRequest<ProfileResponse>(
    "/seguridad/perfil",
    { signal },
    requestOptions(),
  );
}

export function logout() {
  return apiRequest<{ mensaje: string }>(
    "/seguridad/logout",
    { method: "POST" },
    requestOptions(),
  );
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}) {
  return apiRequest<{ mensaje: string }>(
    "/seguridad/cambiar-contrasena",
    {
      method: "PATCH",
      body: JSON.stringify({
        contrasena_actual: input.currentPassword,
        contrasena_nueva: input.newPassword,
        confirmar_contrasena: input.confirmation,
      }),
    },
    requestOptions(),
  );
}

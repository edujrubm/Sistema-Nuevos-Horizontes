import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "./auth-api";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthSession,
  readAuthSession,
  type StoredAuthSession,
  writeAuthSession,
} from "./auth-storage";

interface AuthContextValue {
  session: StoredAuthSession | null;
  initializing: boolean;
  sessionExpired: boolean;
  signIn(username: string, password: string): Promise<StoredAuthSession>;
  signOut(): Promise<void>;
  completePasswordChange(input: {
    currentPassword: string;
    newPassword: string;
    confirmation: string;
  }): Promise<void>;
  clearSessionNotice(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredAuthSession | null>(() =>
    readAuthSession(),
  );
  const [initializing, setInitializing] = useState(Boolean(session));
  const [sessionExpired, setSessionExpired] = useState(false);

  const removeSession = useCallback((expired = false) => {
    clearAuthSession();
    setSession(null);
    setSessionExpired(expired);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!session) {
      setInitializing(false);
      return () => controller.abort();
    }
    void authApi
      .getProfile(controller.signal)
      .then((response) => {
        setSession((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  id: response.usuario.id_usuario,
                  employeeId: response.usuario.id_empleado,
                  roleId: response.usuario.id_rol,
                  role: response.usuario.tipo_rol,
                  areaId: response.usuario.id_area,
                },
              }
            : null,
        );
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          removeSession(true);
      })
      .finally(() => setInitializing(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const unauthorized = () => removeSession(true);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, unauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, unauthorized);
  }, [removeSession]);

  const signIn = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    const next: StoredAuthSession = {
      accessToken: response.access_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      mustChangePassword: response.debe_cambiar_contrasena,
      user: {
        id: response.usuario.id_usuario,
        username: response.usuario.nombre_usuario,
        employeeId: response.usuario.empleado.id_empleado,
        employeeName: response.usuario.empleado.nombre,
        roleId: response.usuario.rol.id_rol,
        role: response.usuario.rol.tipo_rol,
        areaId: response.usuario.rol.id_area,
      },
    };
    writeAuthSession(next);
    setSession(next);
    setSessionExpired(false);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (session) await authApi.logout();
    } finally {
      removeSession(false);
    }
  }, [removeSession, session]);

  const completePasswordChange = useCallback(
    async (input: {
      currentPassword: string;
      newPassword: string;
      confirmation: string;
    }) => {
      await authApi.changePassword(input);
      removeSession(false);
    },
    [removeSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      sessionExpired,
      signIn,
      signOut,
      completePasswordChange,
      clearSessionNotice: () => setSessionExpired(false),
    }),
    [
      completePasswordChange,
      initializing,
      session,
      sessionExpired,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value)
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return value;
}

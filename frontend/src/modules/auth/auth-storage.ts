export const AUTH_SESSION_KEY = "nuevos-horizontes.auth.session";
export const AUTH_UNAUTHORIZED_EVENT = "nuevos-horizontes.auth.unauthorized";

export interface StoredAuthSession {
  accessToken: string;
  expiresAt: number;
  mustChangePassword: boolean;
  user: {
    id: string;
    username: string;
    employeeId: string;
    employeeName: string;
    roleId: string;
    role: string;
    areaId: string | null;
  };
}

export function readAuthSession(): StoredAuthSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredAuthSession;
    if (!value.accessToken || value.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }
    return value;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function writeAuthSession(session: StoredAuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function currentAccessToken() {
  return readAuthSession()?.accessToken;
}

import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: PropsWithChildren) {
  const { session, initializing } = useAuth();
  const location = useLocation();
  if (initializing)
    return <p className="status-message auth-loading">Validando sesión…</p>;
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.mustChangePassword && location.pathname !== "/cambiar-contrasena")
    return <Navigate to="/cambiar-contrasena" replace />;
  return children;
}

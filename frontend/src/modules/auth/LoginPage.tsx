import { type FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "@/shared/api/api-error";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { session, sessionExpired, signIn, clearSessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const passwordChanged =
    (location.state as { passwordChanged?: boolean } | null)
      ?.passwordChanged === true;

  useEffect(() => () => clearSessionNotice(), [clearSessionNotice]);
  if (session)
    return (
      <Navigate
        to={
          session.mustChangePassword ? "/cambiar-contrasena" : "/beneficiarias"
        }
        replace
      />
    );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const next = await signIn(username.trim(), password);
      const requested = (location.state as { from?: string } | null)?.from;
      navigate(
        next.mustChangePassword
          ? "/cambiar-contrasena"
          : requested || "/beneficiarias",
        { replace: true },
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.body.estado === 401
          ? "Usuario o contraseña incorrectos. Revisa los datos e inténtalo nuevamente."
          : "No fue posible iniciar sesión. Inténtalo nuevamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-brand-panel"
        aria-label="Asociación Nuevos Horizontes"
      >
        <span className="auth-logo" aria-hidden="true">
          NH
        </span>
        <p>Asociación Nuevos Horizontes</p>
        <h1>Atención integral, información protegida.</h1>
        <span>Acceso exclusivo para personal autorizado.</span>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div>
            <span className="auth-eyebrow">Sistema institucional</span>
            <h2>Iniciar sesión</h2>
            <p>Ingresa con la cuenta asignada por administración.</p>
          </div>
          {sessionExpired ? (
            <div className="alert warning" role="status">
              Tu sesión terminó. Inicia sesión nuevamente para continuar.
            </div>
          ) : null}
          {passwordChanged ? (
            <div className="alert success" role="status">
              Contraseña actualizada. Inicia sesión con tu nueva contraseña.
            </div>
          ) : null}
          {error ? (
            <div className="alert error" role="alert">
              <strong>{error}</strong>
            </div>
          ) : null}
          <label className="field">
            <span>Usuario *</span>
            <input
              autoComplete="username"
              maxLength={60}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Contraseña *</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>
          <button
            className="button primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Verificando…" : "Ingresar"}
          </button>
          <small className="auth-help">
            Si no puedes acceder, comunícate con la persona administradora del
            sistema.
          </small>
        </form>
      </section>
    </main>
  );
}

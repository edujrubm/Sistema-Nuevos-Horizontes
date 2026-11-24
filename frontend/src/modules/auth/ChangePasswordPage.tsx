import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "@/shared/api/api-error";
import { useAuth } from "./AuthContext";

export function ChangePasswordPage() {
  const { session, completePasswordChange, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  if (!session) return <Navigate to="/login" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 12) {
      setError("La nueva contraseña debe tener al menos 12 caracteres.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await completePasswordChange({
        currentPassword,
        newPassword,
        confirmation,
      });
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.body.mensaje
          : "No fue posible actualizar la contraseña.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page-compact">
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <div>
            <span className="auth-eyebrow">Seguridad de la cuenta</span>
            <h1>
              {session.mustChangePassword
                ? "Cambia tu contraseña temporal"
                : "Cambiar contraseña"}
            </h1>
            <p>
              Utiliza al menos 12 caracteres. Al terminar deberás iniciar sesión
              nuevamente.
            </p>
          </div>
          {error ? (
            <div className="alert error" role="alert">
              <strong>{error}</strong>
            </div>
          ) : null}
          <label className="field">
            <span>Contraseña actual *</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Nueva contraseña *</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <small>Mínimo 12 caracteres.</small>
          </label>
          <label className="field">
            <span>Confirmar nueva contraseña *</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </label>
          <button
            className="button primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Actualizando…" : "Actualizar contraseña"}
          </button>
          <button
            className="button text"
            type="button"
            onClick={() => void signOut()}
          >
            {session.mustChangePassword ? "Cerrar sesión" : "Cancelar"}
          </button>
        </form>
      </section>
    </main>
  );
}

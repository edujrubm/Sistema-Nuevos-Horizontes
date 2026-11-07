import { useState, type ReactNode } from "react";

import type { AreaForm } from "../api/area-forms-api";
import { TextAreaField } from "@/shared/components/forms";

export type AreaFormEditorState =
  "idle" | "loading" | "dirty" | "saving" | "saved" | "conflict" | "error";

interface AreaFormShellProps {
  form?: AreaForm;
  state: AreaFormEditorState;
  error?: string;
  draftStateCode?: string;
  children: ReactNode;
  onSave: (reason: string) => void | Promise<void>;
  onConfirm: (reason: string) => void | Promise<void>;
  onReload: () => void;
  onCancel: () => void;
}

const stateMessages: Record<AreaFormEditorState, string> = {
  idle: "Sin cambios pendientes",
  loading: "Cargando formulario…",
  dirty: "Cambios pendientes de guardar",
  saving: "Guardando cambios…",
  saved: "Cambios guardados",
  conflict: "Existe una versión más reciente",
  error: "No fue posible completar la operación",
};

export function AreaFormShell({
  form,
  state,
  error,
  draftStateCode = "BORRADOR",
  children,
  onSave,
  onConfirm,
  onReload,
  onCancel,
}: AreaFormShellProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  if (state === "loading" || !form) {
    return (
      <p className="status-message" role="status">
        Cargando formulario…
      </p>
    );
  }

  const readOnly = form.estado !== draftStateCode;
  const busy = state === "saving";

  function validReason() {
    if (reason.trim().length >= 3) {
      setReasonError(undefined);
      return true;
    }
    setReasonError("Explica el motivo con al menos 3 caracteres.");
    return false;
  }

  function save() {
    if (!validReason()) return;
    void onSave(reason.trim());
  }

  function confirm() {
    if (!validReason()) return;
    void onConfirm(reason.trim());
  }

  return (
    <section className="area-form-shell">
      <header className="panel area-form-context">
        <div>
          <span>{form.area}</span>
          <h1>{form.tipo}</h1>
          <p>
            Formulario #{form.id} · Versión {form.version}
          </p>
        </div>
        <span className={`status ${readOnly ? "active" : "draft"}`}>
          {readOnly ? "Confirmada" : "Borrador"}
        </span>
      </header>

      {state === "conflict" ? (
        <div className="alert warning" role="alert">
          <strong>El formulario cambió desde que lo abriste.</strong>
          <span>Recarga la versión vigente antes de continuar.</span>
          <div>
            <button
              className="button secondary"
              type="button"
              onClick={onReload}
            >
              Recargar versión
            </button>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="alert error" role="alert">
          <strong>{error ?? stateMessages.error}</strong>
        </div>
      ) : null}

      {readOnly ? (
        <div className="alert success" role="status">
          <strong>Ficha confirmada</strong>
          <span>La información se muestra en modo de solo lectura.</span>
        </div>
      ) : null}

      <fieldset
        className="area-form-editor"
        disabled={readOnly || busy || state === "conflict"}
      >
        <legend className="sr-only">Contenido del formulario</legend>
        {children}
      </fieldset>

      {!readOnly ? (
        <section className="panel area-form-audit">
          <TextAreaField
            id="area-form-change-reason"
            label="Motivo de la actualización o confirmación"
            value={reason}
            error={reasonError}
            hint="Este texto quedará asociado a la trazabilidad del formulario."
            required
            fullWidth
            onChange={(event) => setReason(event.target.value)}
          />

          {confirming ? (
            <div
              className="area-form-confirmation"
              role="region"
              aria-labelledby="area-form-confirm-title"
            >
              <h2 id="area-form-confirm-title">Confirmar ficha</h2>
              <p>
                Revisa el contenido. Después de confirmar, la ficha quedará en
                modo de solo lectura.
              </p>
              <div>
                <button
                  className="button text"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  Volver a editar
                </button>
                <button
                  className="button primary"
                  type="button"
                  disabled={busy}
                  onClick={confirm}
                >
                  Confirmar definitivamente
                </button>
              </div>
            </div>
          ) : (
            <footer className="area-form-actions">
              <span aria-live="polite">{stateMessages[state]}</span>
              <div>
                <button
                  className="button text"
                  type="button"
                  disabled={busy}
                  onClick={onCancel}
                >
                  Cancelar
                </button>
                <button
                  className="button secondary"
                  type="button"
                  disabled={busy || state !== "dirty"}
                  onClick={save}
                >
                  Guardar borrador
                </button>
                <button
                  className="button primary"
                  type="button"
                  disabled={busy || state === "dirty" || state === "conflict"}
                  onClick={() => setConfirming(true)}
                >
                  Revisar y confirmar
                </button>
              </div>
            </footer>
          )}
        </section>
      ) : (
        <div className="area-form-actions">
          <button className="button secondary" type="button" onClick={onCancel}>
            Volver al listado
          </button>
        </div>
      )}
    </section>
  );
}

import { useState, type ReactNode } from "react";

import type { AreaForm } from "../api/area-forms-api";

export type AreaFormEditorState =
  "idle" | "loading" | "dirty" | "saving" | "saved" | "conflict" | "error";

interface AreaFormShellProps {
  form?: AreaForm;
  state: AreaFormEditorState;
  error?: string;
  draftStateCode?: string;
  discardedStateCode?: string;
  canConfirm?: boolean;
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

const draftSaveReason = "Guardado de borrador";
const initialConfirmationReason = "Confirmación inicial de ficha";

export function AreaFormShell({
  form,
  state,
  error,
  draftStateCode = "BORRADOR",
  discardedStateCode = "DESCARTADO",
  canConfirm = false,
  children,
  onSave,
  onConfirm,
  onReload,
  onCancel,
}: AreaFormShellProps) {
  const [confirming, setConfirming] = useState(false);

  if (state === "loading" || !form) {
    return (
      <p className="status-message" role="status">
        Cargando formulario…
      </p>
    );
  }

  const discarded = form.estado === discardedStateCode;
  const readOnly = form.estado !== draftStateCode;
  const busy = state === "saving";

  function save() {
    void onSave(draftSaveReason);
  }

  function confirm() {
    void onConfirm(initialConfirmationReason);
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
          {discarded ? "Descartada" : readOnly ? "Confirmada" : "Borrador"}
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
          <strong>{discarded ? "Ficha descartada" : "Ficha confirmada"}</strong>
          <span>
            {discarded
              ? "El borrador se conserva únicamente para trazabilidad."
              : "La información se muestra en modo de solo lectura."}
          </span>
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
                  disabled={
                    busy ||
                    state === "dirty" ||
                    state === "conflict" ||
                    !canConfirm
                  }
                  title={
                    canConfirm
                      ? undefined
                      : "Completa y guarda los campos obligatorios antes de confirmar."
                  }
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

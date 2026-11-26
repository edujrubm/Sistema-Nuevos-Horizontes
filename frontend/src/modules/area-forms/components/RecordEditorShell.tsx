import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Ficha } from "@/shared/types/api";
import { ApiError } from "@/shared/api/api-error";
import { AreaFormShell, type AreaFormEditorState } from "./AreaFormShell";
import { asAreaForm } from "./record-presentation";
import "./record-presentation.css";

/** Adapta los controladores de cada área al mismo marco usado por las variantes clínicas. */
export function RecordEditorShell({
  editor,
  title,
  area,
  type,
  subject,
  back,
  editable,
  canConfirm,
  canSave,
  children,
  auxiliaryDirty = false,
  correction = false,
  saveDisabled = false,
}: {
  editor: {
    record?: Ficha;
    dirty: boolean;
    busy: boolean;
    draft: boolean;
    conflict: boolean;
    uncertain: boolean;
    error?: unknown;
    message: string;
    reload: () => void;
    submit: (confirm?: boolean) => Promise<unknown>;
  };
  title: string;
  area: string;
  type: string;
  subject?: string;
  back: string;
  editable: boolean;
  canConfirm: boolean;
  canSave: boolean;
  children: ReactNode;
  auxiliaryDirty?: boolean;
  correction?: boolean;
  saveDisabled?: boolean;
}) {
  const navigate = useNavigate();
  const state: AreaFormEditorState =
    editor.conflict || editor.uncertain
      ? "conflict"
      : editor.busy
        ? "saving"
        : editor.dirty
          ? "dirty"
          : editor.error
            ? "error"
            : editor.message
              ? "saved"
              : "idle";
  function save() {
    if (!editable || auxiliaryDirty) return;
    // El hook conserva validaciones, control de versión, auditoría y manejo de errores del área.
    return editor
      .submit()
      .then(() => undefined)
      .catch(() => undefined);
  }
  return (
    <div className="record-editor-shell">
      <AreaFormShell
        form={editor.record ? asAreaForm(editor.record, area) : undefined}
        newRecord={{ type, area }}
        title={title}
        subjectLabel={subject}
        state={state}
        error={
          editor.error instanceof ApiError
            ? editor.error.body.mensaje
            : undefined
        }
        readOnlyOverride={!editor.draft && !correction}
        allowReadOnlyNavigation
        showFeedback={false}
        showSave={canSave}
        saveDisabled={!editable || auxiliaryDirty || saveDisabled}
        showConfirm={Boolean(editor.record && editor.draft && canConfirm)}
        canConfirm={canConfirm && !auxiliaryDirty && !editor.uncertain}
        onSave={save}
        onConfirm={() =>
          editor
            .submit(true)
            .then(() => undefined)
            .catch(() => undefined)
        }
        onReload={editor.reload}
        onCancel={() => navigate(back)}
      >
        {children}
      </AreaFormShell>
    </div>
  );
}

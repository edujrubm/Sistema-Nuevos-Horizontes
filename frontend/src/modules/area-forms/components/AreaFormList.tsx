import { Fragment, useState } from "react";

import type { AreaForm } from "../api/area-forms-api";

interface AreaFormListProps {
  forms: AreaForm[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  hasMore?: boolean;
  draftStateCode?: string;
  discardingId?: string;
  discardError?: string;
  onOpen: (form: AreaForm) => void;
  onDiscard?: (form: AreaForm, reason: string) => Promise<void>;
  onPrepareDiscard?: () => void;
  onCreate: () => void;
  onRetry: () => void;
  onLoadMore?: () => void;
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const createdAtFormatter = new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Guatemala",
});

function displayCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : createdAtFormatter.format(date);
}

export function AreaFormList({
  forms,
  loading = false,
  loadingMore = false,
  error,
  hasMore = false,
  draftStateCode = "BORRADOR",
  discardingId,
  discardError,
  onOpen,
  onDiscard,
  onPrepareDiscard,
  onCreate,
  onRetry,
  onLoadMore,
}: AreaFormListProps) {
  const [formToDiscard, setFormToDiscard] = useState<AreaForm>();
  const [discardReason, setDiscardReason] = useState("");

  if (loading) {
    return (
      <p className="status-message" role="status">
        Cargando formularios…
      </p>
    );
  }

  if (error) {
    return (
      <div className="alert error" role="alert">
        <strong>No fue posible cargar los formularios.</strong>
        <span>{error}</span>
        <div>
          <button className="button secondary" type="button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  async function confirmDiscard() {
    const reason = discardReason.trim();
    if (!formToDiscard || !onDiscard || reason.length < 3) return;
    try {
      await onDiscard(formToDiscard, reason);
      setFormToDiscard(undefined);
      setDiscardReason("");
    } catch {
      // El error se presenta con discardError y el diálogo conserva el motivo.
    }
  }

  return (
    <section
      className="panel area-form-list"
      aria-labelledby="area-form-list-title"
    >
      <header className="area-form-list-header">
        <div>
          <h2 id="area-form-list-title">Fichas del área</h2>
          <p>Consulta borradores y fichas confirmadas del expediente.</p>
        </div>
        <button className="button primary" type="button" onClick={onCreate}>
          Nueva ficha
        </button>
      </header>

      {forms.length === 0 ? (
        <div className="empty-state">
          <h3>No hay fichas registradas</h3>
          <p>Crea la primera ficha del área para esta beneficiaria.</p>
        </div>
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Área</th>
                <th>Fecha de atención</th>
                <th>Creada</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const draft = form.estado === draftStateCode;
                const discardOpen = formToDiscard?.id === form.id;
                return (
                  <Fragment key={form.id}>
                    <tr>
                      <td>{form.tipo}</td>
                      <td>{form.area}</td>
                      <td>{displayDate(form.fechaAtencion)}</td>
                      <td>{displayCreatedAt(form.creadoEn)}</td>
                      <td>{form.version}</td>
                      <td>
                        <span
                          className={`status ${draft ? "draft" : "active"}`}
                        >
                          {draft ? "Borrador" : "Confirmada"}
                        </span>
                      </td>
                      <td>
                        <div className="area-form-list-actions">
                          <button
                            className="button text"
                            type="button"
                            onClick={() => onOpen(form)}
                          >
                            {draft ? "Continuar" : "Consultar"}
                          </button>
                          {draft && onDiscard ? (
                            <button
                              className="button danger-outline"
                              type="button"
                              disabled={Boolean(discardingId)}
                              onClick={() => {
                                onPrepareDiscard?.();
                                setFormToDiscard(form);
                                setDiscardReason("");
                              }}
                            >
                              Descartar borrador
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {discardOpen ? (
                      <tr className="area-form-list-discard-row">
                        <td colSpan={7}>
                          <div
                            className="area-form-confirmation destructive area-form-list-discard"
                            role="region"
                            aria-labelledby={`area-form-list-discard-title-${form.id}`}
                          >
                            <h3 id={`area-form-list-discard-title-${form.id}`}>
                              Descartar borrador
                            </h3>
                            <p>
                              Se descartará la ficha {form.tipo}. Dejará de
                              aparecer en este listado, pero se conservará para
                              auditoría.
                            </p>
                            {discardError ? (
                              <div className="alert error" role="alert">
                                <strong>{discardError}</strong>
                              </div>
                            ) : null}
                            <label className="field">
                              <span>Motivo del descarte</span>
                              <textarea
                                value={discardReason}
                                required
                                minLength={3}
                                maxLength={500}
                                disabled={discardingId === form.id}
                                onChange={(event) =>
                                  setDiscardReason(event.target.value)
                                }
                              />
                            </label>
                            <div>
                              <button
                                className="button text"
                                type="button"
                                disabled={discardingId === form.id}
                                onClick={() => {
                                  setFormToDiscard(undefined);
                                  setDiscardReason("");
                                }}
                              >
                                Conservar borrador
                              </button>
                              <button
                                className="button danger"
                                type="button"
                                disabled={
                                  discardingId === form.id ||
                                  discardReason.trim().length < 3
                                }
                                onClick={() => void confirmDiscard()}
                              >
                                {discardingId === form.id
                                  ? "Descartando…"
                                  : "Descartar definitivamente"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && onLoadMore ? (
        <div className="pagination-actions">
          <button
            className="button secondary"
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

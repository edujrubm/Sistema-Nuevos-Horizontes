import type { AreaForm } from "../api/area-forms-api";

interface AreaFormListProps {
  forms: AreaForm[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  hasMore?: boolean;
  draftStateCode?: string;
  onOpen: (form: AreaForm) => void;
  onCreate: () => void;
  onRetry: () => void;
  onLoadMore?: () => void;
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function AreaFormList({
  forms,
  loading = false,
  loadingMore = false,
  error,
  hasMore = false,
  draftStateCode = "BORRADOR",
  onOpen,
  onCreate,
  onRetry,
  onLoadMore,
}: AreaFormListProps) {
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
                <th>Fecha</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const draft = form.estado === draftStateCode;
                return (
                  <tr key={form.id}>
                    <td>{form.tipo}</td>
                    <td>{form.area}</td>
                    <td>{displayDate(form.fechaAtencion)}</td>
                    <td>{form.version}</td>
                    <td>
                      <span className={`status ${draft ? "draft" : "active"}`}>
                        {draft ? "Borrador" : "Confirmada"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button text"
                        type="button"
                        onClick={() => onOpen(form)}
                      >
                        {draft ? "Continuar" : "Consultar"}
                      </button>
                    </td>
                  </tr>
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
